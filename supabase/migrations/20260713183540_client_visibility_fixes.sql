-- Fixes found during end-to-end testing of client booking:
--
-- 1. A client had no RLS path to read their assigned coach's profile
--    (needed to display the coach's name in the client calendar).
-- 2. "Clients can read own coach's available slots" only covers
--    status IN ('available','partially_booked'), so once a slot a
--    client booked flips to 'booked' (full) or later 'completed' /
--    'cancelled' / 'no_show', the client could no longer read that
--    coach_slots row at all -- their own "Moje rezervace" list showed
--    the booking as if the slot had been deleted.

-- A raw subquery on profiles inside a profiles policy causes Postgres to
-- detect infinite recursion (the subquery re-triggers RLS on profiles,
-- which re-evaluates this very policy). Route it through a SECURITY
-- DEFINER function instead, same trick already used by get_user_role().
CREATE OR REPLACE FUNCTION public.get_assigned_coach_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assigned_coach_id FROM public.profiles WHERE id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_assigned_coach_id(uuid) TO authenticated;

CREATE POLICY "Clients can view their assigned coach's profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = public.get_assigned_coach_id(auth.uid()));

CREATE POLICY "Clients can read slots they have booked" ON public.coach_slots
  FOR SELECT TO authenticated
  USING (id IN (SELECT slot_id FROM public.slot_bookings WHERE client_id = auth.uid()));
