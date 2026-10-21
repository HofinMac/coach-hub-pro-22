-- Coaches can occupy a slot themselves for a client who does not use the app
-- ("obsazeno ručně"): the slot gets status 'booked' (hidden from app clients)
-- and the client's name in manual_client_name. Coach reminders cover these too.

ALTER TABLE public.coach_slots
  ADD COLUMN IF NOT EXISTS manual_client_name text
  CHECK (manual_client_name IS NULL OR length(manual_client_name) <= 120);

CREATE OR REPLACE FUNCTION public.enqueue_due_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _r record;
  _n integer := 0;
BEGIN
  FOR _r IN
    SELECT b.id, b.client_id, s.start_time, private.display_name(s.coach_id) AS coach_name
    FROM public.slot_bookings b
    JOIN public.coach_slots s ON s.id = b.slot_id
    LEFT JOIN public.user_settings us ON us.user_id = b.client_id
    WHERE b.status = 'confirmed'
      AND b.reminder_sent_at IS NULL
      AND s.start_time > now()
      AND s.start_time <= now() + make_interval(mins => coalesce(us.reminder_minutes, 60))
    FOR UPDATE OF b SKIP LOCKED
  LOOP
    UPDATE public.slot_bookings SET reminder_sent_at = now() WHERE id = _r.id;
    PERFORM public.enqueue_notification(_r.client_id, 'reminder', 'Připomínka tréninku',
      private.format_when(_r.start_time) || ' s trenérem ' || _r.coach_name, '/klient/kalendar', 'reminder-' || _r.id);
    _n := _n + 1;
  END LOOP;

  FOR _r IN
    SELECT s.id, s.coach_id, s.start_time,
           concat_ws(', ', nullif(btrim(s.manual_client_name), ''),
             (SELECT string_agg(private.display_name(b.client_id), ', ')
                FROM public.slot_bookings b WHERE b.slot_id = s.id AND b.status = 'confirmed')) AS clients
    FROM public.coach_slots s
    LEFT JOIN public.user_settings us ON us.user_id = s.coach_id
    WHERE s.reminder_sent_at IS NULL
      AND s.start_time > now()
      AND s.start_time <= now() + make_interval(mins => coalesce(us.reminder_minutes, 60))
      AND s.status <> 'cancelled'
      AND (
        nullif(btrim(s.manual_client_name), '') IS NOT NULL
        OR EXISTS (SELECT 1 FROM public.slot_bookings b WHERE b.slot_id = s.id AND b.status = 'confirmed')
      )
    FOR UPDATE OF s SKIP LOCKED
  LOOP
    UPDATE public.coach_slots SET reminder_sent_at = now() WHERE id = _r.id;
    PERFORM public.enqueue_notification(_r.coach_id, 'reminder', 'Připomínka tréninku',
      private.format_when(_r.start_time) || ' · ' || _r.clients, '/calendar', 'reminder-slot-' || _r.id);
    _n := _n + 1;
  END LOOP;

  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_due_reminders() FROM PUBLIC, anon, authenticated;
