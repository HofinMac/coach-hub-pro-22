-- Core domain tables replacing the client-side demo data:
-- client intake & coach records, training plans, workout logs, progress,
-- messages, packages & payments, and coach ↔ gym links / gym reviews.

-- ─── Helpers ────────────────────────────────────────────────────────────────

-- True when _client_id is a client assigned to the current user (coach).
CREATE OR REPLACE FUNCTION public.is_my_client(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _client_id AND assigned_coach_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ─── Client intake (filled by the client during onboarding) ─────────────────

CREATE TABLE public.client_intake (
  client_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age integer,
  gender text NOT NULL DEFAULT '',
  height_cm numeric,
  experience text NOT NULL DEFAULT '',
  injuries text[] NOT NULL DEFAULT '{}',
  injury_detail text NOT NULL DEFAULT '',
  current_activity text NOT NULL DEFAULT '',
  goals text[] NOT NULL DEFAULT '{}',
  goal_detail text NOT NULL DEFAULT '',
  preferred_days text NOT NULL DEFAULT '',
  preferred_time text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own intake" ON public.client_intake
  FOR ALL TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches read their clients' intake" ON public.client_intake
  FOR SELECT TO authenticated
  USING (public.is_my_client(client_id) OR public.get_user_role(auth.uid()) = 'admin');

CREATE TRIGGER client_intake_updated_at BEFORE UPDATE ON public.client_intake
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Coach's private record about a client ─────────────────────────────────

CREATE TABLE public.coach_client_records (
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead', 'at_risk')),
  tags text[] NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (coach_id, client_id)
);

ALTER TABLE public.coach_client_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage records of own clients" ON public.coach_client_records
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid() AND public.is_my_client(client_id));

CREATE TRIGGER coach_client_records_updated_at BEFORE UPDATE ON public.coach_client_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Training plans ─────────────────────────────────────────────────────────
-- exercises: [{ exerciseId, exerciseName, sets, reps, rpe, rest, notes? }]

CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  exercises jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(exercises) = 'array'),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX workout_plans_coach_idx ON public.workout_plans (coach_id);
CREATE INDEX workout_plans_client_idx ON public.workout_plans (client_id);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own plans" ON public.workout_plans
  FOR ALL TO authenticated
  USING (coach_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (
    coach_id = auth.uid()
    AND (client_id IS NULL OR public.is_my_client(client_id))
  );

CREATE POLICY "Clients read own published plans" ON public.workout_plans
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() AND status <> 'draft');

CREATE TRIGGER workout_plans_updated_at BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Workout logs (a client finished a workout) ─────────────────────────────

CREATE TABLE public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  duration_min integer CHECK (duration_min IS NULL OR duration_min >= 0),
  rpe numeric CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX workout_logs_client_idx ON public.workout_logs (client_id, performed_at DESC);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own workout logs" ON public.workout_logs
  FOR ALL TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches read their clients' workout logs" ON public.workout_logs
  FOR SELECT TO authenticated
  USING (public.is_my_client(client_id) OR public.get_user_role(auth.uid()) = 'admin');

-- ─── Progress entries (body measurements) ──────────────────────────────────

CREATE TABLE public.progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at date NOT NULL DEFAULT current_date,
  weight numeric CHECK (weight IS NULL OR weight > 0),
  body_fat numeric CHECK (body_fat IS NULL OR body_fat BETWEEN 0 AND 100),
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX progress_entries_client_idx ON public.progress_entries (client_id, logged_at);

ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own progress" ON public.progress_entries
  FOR ALL TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coaches manage their clients' progress" ON public.progress_entries
  FOR ALL TO authenticated
  USING (public.is_my_client(client_id) OR public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.is_my_client(client_id));

-- ─── Messages (one conversation per coach ↔ client pair) ───────────────────

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) > 0 AND length(body) <= 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id = coach_id OR sender_id = client_id)
);

CREATE INDEX messages_conversation_idx ON public.messages (coach_id, client_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND read_at IS NULL
    AND (
      (coach_id = auth.uid() AND public.is_my_client(client_id))
      OR (client_id = auth.uid() AND coach_id = public.get_assigned_coach_id(auth.uid()))
    )
  );

-- Recipients mark messages as read via RPC (no direct UPDATE policy).
CREATE OR REPLACE FUNCTION public.mark_conversation_read(_coach_id uuid, _client_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.messages
  SET read_at = now()
  WHERE coach_id = _coach_id
    AND client_id = _client_id
    AND read_at IS NULL
    AND sender_id <> auth.uid()
    AND auth.uid() IN (_coach_id, _client_id)
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid, uuid) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END;
$$;

-- ─── Packages (session credits) and payments ───────────────────────────────

CREATE TABLE public.client_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_credits integer NOT NULL CHECK (total_credits > 0),
  remaining_credits integer NOT NULL CHECK (remaining_credits >= 0),
  price_czk integer NOT NULL DEFAULT 0 CHECK (price_czk >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (remaining_credits <= total_credits)
);

CREATE INDEX client_packages_client_idx ON public.client_packages (client_id);
CREATE INDEX client_packages_coach_idx ON public.client_packages (coach_id);

ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own packages" ON public.client_packages
  FOR ALL TO authenticated
  USING (coach_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (coach_id = auth.uid() AND public.is_my_client(client_id));

CREATE POLICY "Clients read own packages" ON public.client_packages
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE TRIGGER client_packages_updated_at BEFORE UPDATE ON public.client_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.client_packages(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount_czk integer NOT NULL CHECK (amount_czk >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_client_idx ON public.payments (client_id);
CREATE INDEX payments_coach_idx ON public.payments (coach_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own payments" ON public.payments
  FOR ALL TO authenticated
  USING (coach_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (coach_id = auth.uid() AND public.is_my_client(client_id));

CREATE POLICY "Clients read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Completing a booking uses one credit from the client's oldest active package
-- with this coach; cancelling / no-show after completion does not refund.
CREATE OR REPLACE FUNCTION public.consume_package_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coach uuid;
  _pkg uuid;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT coach_id INTO _coach FROM public.coach_slots WHERE id = NEW.slot_id;

    SELECT id INTO _pkg FROM public.client_packages
      WHERE coach_id = _coach AND client_id = NEW.client_id
        AND status = 'active' AND remaining_credits > 0
        AND (expires_at IS NULL OR expires_at >= current_date)
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE;

    IF _pkg IS NOT NULL THEN
      UPDATE public.client_packages
      SET remaining_credits = remaining_credits - 1,
          status = CASE WHEN remaining_credits - 1 = 0 THEN 'used' ELSE status END
      WHERE id = _pkg;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER slot_bookings_consume_credit AFTER UPDATE OF status ON public.slot_bookings
  FOR EACH ROW EXECUTE FUNCTION public.consume_package_credit();

-- ─── Gyms: details, coach links, reviews ───────────────────────────────────

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS opening_hours text NOT NULL DEFAULT '';

CREATE POLICY "Creators can update own gyms" ON public.gyms
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE TABLE public.coach_gyms (
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (coach_id, gym_id)
);

ALTER TABLE public.coach_gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read coach gyms" ON public.coach_gyms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches manage own gym links" ON public.coach_gyms
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE TABLE public.gym_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, author_id)
);

ALTER TABLE public.gym_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read gym reviews" ON public.gym_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own gym reviews" ON public.gym_reviews
  FOR ALL TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- ─── Coach dashboard: clients without activity for 14+ days ────────────────

CREATE OR REPLACE FUNCTION public.get_client_last_activity(_coach_id uuid)
RETURNS TABLE (client_id uuid, last_activity timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         GREATEST(
           (SELECT max(performed_at) FROM public.workout_logs w WHERE w.client_id = p.id),
           (SELECT max(s.start_time) FROM public.slot_bookings b
              JOIN public.coach_slots s ON s.id = b.slot_id
              WHERE b.client_id = p.id AND b.status IN ('confirmed', 'completed')
                AND s.start_time <= now())
         )
  FROM public.profiles p
  WHERE p.assigned_coach_id = _coach_id
    AND (_coach_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
$$;

GRANT EXECUTE ON FUNCTION public.get_client_last_activity(uuid) TO authenticated;
