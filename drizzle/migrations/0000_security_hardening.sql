-- Security hardening
--
-- 1. profiles: users could set their own role (e.g. 'admin') or assigned_coach_id,
--    because the "update own profile" policy has no column restrictions.
-- 2. slot_bookings: every coach could read/update every booking of every coach,
--    and clients could insert bookings directly, bypassing book_coach_slot().
-- 3. Partner module: users could mark their own challenges/rewards/eligibility as
--    completed, and forge audit log entries.

-- ─── 1. profiles: protect privileged columns ────────────────────────────────

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No JWT user (signup trigger, service role, SQL editor): trusted context.
  IF auth.uid() IS NULL OR public.get_user_role(auth.uid()) = 'admin' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'coach';
    NEW.assigned_coach_id := NULL;
  ELSE
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'ROLE_CHANGE_NOT_ALLOWED' USING ERRCODE = '42501';
    END IF;
    IF NEW.assigned_coach_id IS DISTINCT FROM OLD.assigned_coach_id THEN
      RAISE EXCEPTION 'COACH_ASSIGNMENT_CHANGE_NOT_ALLOWED' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── 2. slot_bookings: scope to the slot's coach ────────────────────────────

CREATE OR REPLACE FUNCTION public.is_slot_owner(_slot_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_slots WHERE id = _slot_id AND coach_id = auth.uid()
  )
$$;

DROP POLICY IF EXISTS "Clients can book slots" ON public.slot_bookings;
DROP POLICY IF EXISTS "Users can read own bookings" ON public.slot_bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON public.slot_bookings;

-- Clients book through book_coach_slot() (SECURITY DEFINER); coaches may add
-- bookings to their own slots (e.g. when rescheduling).
CREATE POLICY "Coaches can add bookings to own slots"
  ON public.slot_bookings FOR INSERT TO authenticated
  WITH CHECK (public.is_slot_owner(slot_id) OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can read own or own-slot bookings"
  ON public.slot_bookings FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR public.is_slot_owner(slot_id)
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- Clients cancel through cancel_client_booking() (SECURITY DEFINER).
CREATE POLICY "Coaches can update bookings on own slots"
  ON public.slot_bookings FOR UPDATE TO authenticated
  USING (public.is_slot_owner(slot_id) OR public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.is_slot_owner(slot_id) OR public.get_user_role(auth.uid()) = 'admin');

-- ─── 3. Partner module ──────────────────────────────────────────────────────

-- Clients may join a challenge, but not start it as completed/claimed.
DROP POLICY IF EXISTS "System can insert challenges" ON public.client_challenges;
CREATE POLICY "Clients can join challenges"
  ON public.client_challenges FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
    OR (
      client_id = auth.uid()
      AND status = 'active'
      AND current_progress = 0
      AND completed_at IS NULL
      AND promo_code IS NULL
    )
  );

DROP POLICY IF EXISTS "Admins can update challenges" ON public.client_challenges;
CREATE POLICY "Admins can update challenges"
  ON public.client_challenges FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Rewards are granted by admins only.
DROP POLICY IF EXISTS "System can insert rewards" ON public.reward_history;
CREATE POLICY "Admins can insert rewards"
  ON public.reward_history FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can update own rewards" ON public.reward_history;
CREATE POLICY "Admins can update rewards"
  ON public.reward_history FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Eligibility is informational for users; only admins persist it.
DROP POLICY IF EXISTS "System can manage eligibility" ON public.eligibility;
CREATE POLICY "Admins can manage eligibility"
  ON public.eligibility FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Benefit requests and certificates always start as pending.
DROP POLICY IF EXISTS "Coaches can insert own benefit requests" ON public.coach_benefits;
CREATE POLICY "Coaches can insert own benefit requests"
  ON public.coach_benefits FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
    AND status = 'pending'
    AND approved_by IS NULL
    AND approved_at IS NULL
    AND promo_code IS NULL
  );

DROP POLICY IF EXISTS "Coaches can insert own certificates" ON public.coach_certificates;
CREATE POLICY "Coaches can insert own certificates"
  ON public.coach_certificates FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'coach'
    AND status = 'pending'
    AND reviewed_by IS NULL
  );

-- The permissive WITH CHECK (true) policy let anyone forge audit entries; the
-- policy "Authenticated users can insert audit entries" (actor = self) remains.
DROP POLICY IF EXISTS "System can insert audit entries" ON public.partner_audit_log;
