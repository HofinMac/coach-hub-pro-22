-- Web push notifications
--
-- Flow: domain triggers call enqueue_notification() → a row in notification_events
-- (outbox) → pg_net pings the `send-push` edge function → it claims pending events
-- (claim_notification_events) and delivers them to the recipient's push_subscriptions.
-- A pg_cron job enqueues training reminders and re-pings the worker as a backstop.
-- Push preferences come from user_settings.notification_settings -> <category> -> push.

-- ─── Private config ─────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS private.app_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO private.app_config (key, value)
VALUES ('push_worker_url', 'https://oqtxwelesrwmvvurzslj.supabase.co/functions/v1/send-push')
ON CONFLICT (key) DO NOTHING;

-- ─── Device subscriptions ──────────────────────────────────────────────────

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own push subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- A browser endpoint belongs to whoever is signed in on that device now
-- (another account may have used it before), so registration goes through RPC.
CREATE OR REPLACE FUNCTION public.register_push_subscription(
  _endpoint text, _p256dh text, _auth text, _user_agent text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  IF _endpoint !~ '^https://' THEN
    RAISE EXCEPTION 'INVALID_ENDPOINT' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  VALUES (auth.uid(), _endpoint, _p256dh, _auth, left(coalesce(_user_agent, ''), 300))
  ON CONFLICT (endpoint) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        last_seen_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.register_push_subscription(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_push_subscription(text, text, text, text) TO authenticated;

-- ─── Outbox ─────────────────────────────────────────────────────────────────

CREATE TABLE public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'newBooking', 'cancelledBooking', 'reminder', 'newMessage', 'payment', 'newReview', 'planChange', 'test'
  )),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '/',
  tag text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'skipped', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  processed_at timestamptz
);

CREATE INDEX notification_events_pending_idx ON public.notification_events (created_at)
  WHERE status IN ('pending', 'processing');

-- RLS on, no policies: only SECURITY DEFINER functions and the service role touch it.
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Fire-and-forget ping of the edge function (no-op where pg_net is not installed).
CREATE OR REPLACE FUNCTION private.kick_push_worker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text;
BEGIN
  IF to_regproc('net.http_post') IS NULL THEN
    RETURN;
  END IF;
  SELECT value INTO _url FROM private.app_config WHERE key = 'push_worker_url';
  IF _url IS NULL THEN
    RETURN;
  END IF;
  EXECUTE 'SELECT net.http_post(url := $1, body := ''{}''::jsonb, headers := ''{"Content-Type": "application/json"}''::jsonb)'
    USING _url;
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification problem break the user's action.
  RAISE WARNING 'kick_push_worker failed: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_notification(
  _user_id uuid, _category text, _title text, _body text, _url text, _tag text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _enabled text;
BEGIN
  -- Nobody to notify, or the actor themselves.
  IF _user_id IS NULL OR (_user_id = auth.uid() AND _category <> 'test') THEN
    RETURN;
  END IF;

  -- No device registered → nothing to deliver.
  IF NOT EXISTS (SELECT 1 FROM public.push_subscriptions WHERE user_id = _user_id) THEN
    RETURN;
  END IF;

  -- Respect the user's push switch for this category (missing settings = on).
  IF _category <> 'test' THEN
    SELECT notification_settings -> _category ->> 'push' INTO _enabled
    FROM public.user_settings WHERE user_id = _user_id;
    IF _enabled = 'false' THEN
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.notification_events (user_id, category, title, body, url, tag)
  VALUES (_user_id, _category, left(_title, 120), left(coalesce(_body, ''), 240), coalesce(_url, '/'), _tag);

  PERFORM private.kick_push_worker();
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_notification(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- Used by the edge function (service role): claim a batch of events to deliver.
-- Events stuck in "processing" for 5+ minutes are retried, up to 3 attempts.
CREATE OR REPLACE FUNCTION public.claim_notification_events(_limit integer DEFAULT 50)
RETURNS SETOF public.notification_events
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notification_events e
  SET status = 'processing', attempts = e.attempts + 1, claimed_at = now()
  WHERE e.id IN (
    SELECT id FROM public.notification_events
    WHERE (status = 'pending' OR (status = 'processing' AND claimed_at < now() - interval '5 minutes'))
      AND attempts < 3
    ORDER BY created_at
    LIMIT _limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING e.*
$$;

REVOKE ALL ON FUNCTION public.claim_notification_events(integer) FROM PUBLIC, anon, authenticated;

-- "Poslat zkušební upozornění" in Settings.
CREATE OR REPLACE FUNCTION public.send_test_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.push_subscriptions WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'NO_SUBSCRIPTION' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.notification_events
    WHERE user_id = auth.uid() AND category = 'test' AND created_at > now() - interval '15 seconds'
  ) THEN
    RAISE EXCEPTION 'TOO_MANY' USING ERRCODE = 'P0001';
  END IF;

  PERFORM public.enqueue_notification(
    auth.uid(), 'test', 'Coach Hub', 'Upozornění fungují. Takhle vám dáme vědět o novinkách.', '/', 'test'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.send_test_notification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_test_notification() TO authenticated;

-- ─── Formatting helpers ─────────────────────────────────────────────────────

-- "pá 10. 10. v 8:00" in Prague time.
CREATE OR REPLACE FUNCTION private.format_when(_t timestamptz)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (ARRAY['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'])[extract(dow FROM _t AT TIME ZONE 'Europe/Prague')::int + 1]
    || ' ' || to_char(_t AT TIME ZONE 'Europe/Prague', 'FMDD. FMMM. "v" FMHH24:MI')
$$;

CREATE OR REPLACE FUNCTION private.display_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(nullif(btrim(full_name), ''), nullif(email, ''), 'Někdo') FROM public.profiles WHERE id = _user_id
$$;

-- ─── Domain triggers ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION private.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_id = NEW.coach_id THEN
    PERFORM public.enqueue_notification(
      NEW.client_id, 'newMessage', private.display_name(NEW.coach_id), NEW.body,
      '/klient/zpravy', 'msg-' || NEW.coach_id || '-' || NEW.client_id);
  ELSE
    PERFORM public.enqueue_notification(
      NEW.coach_id, 'newMessage', private.display_name(NEW.client_id), NEW.body,
      '/messages?client=' || NEW.client_id, 'msg-' || NEW.coach_id || '-' || NEW.client_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER messages_notify AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION private.notify_new_message();

CREATE OR REPLACE FUNCTION private.notify_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slot public.coach_slots%ROWTYPE;
  _when text;
  _tag text := 'booking-' || NEW.id;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NULL;
  END IF;

  SELECT * INTO _slot FROM public.coach_slots WHERE id = NEW.slot_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  _when := private.format_when(_slot.start_time);

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' THEN
      PERFORM public.enqueue_notification(_slot.coach_id, 'newBooking', 'Nová žádost o rezervaci',
        private.display_name(NEW.client_id) || ' · ' || _when, '/calendar', _tag);
    ELSIF NEW.status = 'confirmed' THEN
      PERFORM public.enqueue_notification(NEW.client_id, 'newBooking', 'Nový termín tréninku',
        'Trenér vás zapsal na ' || _when, '/klient/kalendar', _tag);
    END IF;
  ELSIF NEW.status = 'confirmed' THEN
    PERFORM public.enqueue_notification(NEW.client_id, 'newBooking', 'Rezervace potvrzena',
      'Trénink ' || _when, '/klient/kalendar', _tag);
  ELSIF NEW.status = 'rejected' THEN
    PERFORM public.enqueue_notification(NEW.client_id, 'cancelledBooking', 'Rezervace zamítnuta',
      'Termín ' || _when || ' trenér nepotvrdil', '/klient/kalendar', _tag);
  ELSIF NEW.status = 'cancelled' THEN
    IF auth.uid() = NEW.client_id THEN
      PERFORM public.enqueue_notification(_slot.coach_id, 'cancelledBooking', 'Klient zrušil rezervaci',
        private.display_name(NEW.client_id) || ' · ' || _when, '/calendar', _tag);
    ELSE
      PERFORM public.enqueue_notification(NEW.client_id, 'cancelledBooking', 'Trénink byl zrušen',
        'Termín ' || _when || ' se neuskuteční', '/klient/kalendar', _tag);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER slot_bookings_notify AFTER INSERT OR UPDATE OF status ON public.slot_bookings
  FOR EACH ROW EXECUTE FUNCTION private.notify_booking_change();

CREATE OR REPLACE FUNCTION private.notify_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_id IS NULL OR NEW.status <> 'active' THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'INSERT' OR OLD.status <> 'active' OR OLD.client_id IS DISTINCT FROM NEW.client_id THEN
    PERFORM public.enqueue_notification(NEW.client_id, 'planChange', 'Nový tréninkový plán',
      NEW.title, '/klient/treninky', 'plan-' || NEW.id);
  ELSIF OLD.exercises IS DISTINCT FROM NEW.exercises OR OLD.title IS DISTINCT FROM NEW.title THEN
    PERFORM public.enqueue_notification(NEW.client_id, 'planChange', 'Trenér upravil váš plán',
      NEW.title, '/klient/treninky', 'plan-' || NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER workout_plans_notify AFTER INSERT OR UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION private.notify_plan_change();

CREATE OR REPLACE FUNCTION private.notify_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _amount text := regexp_replace(NEW.amount_czk::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g') || ' Kč';
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM public.enqueue_notification(NEW.client_id, 'payment', 'Nová platba k úhradě',
      NEW.description || ' · ' || _amount
        || coalesce(', splatnost ' || to_char(NEW.due_date, 'FMDD. FMMM.'), ''),
      '/klient/platby', 'payment-' || NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    PERFORM public.enqueue_notification(NEW.client_id, 'payment', 'Platba přijata',
      NEW.description || ' · ' || _amount, '/klient/platby', 'payment-' || NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER payments_notify AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION private.notify_payment();

CREATE OR REPLACE FUNCTION private.notify_gym_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coach uuid;
  _gym text;
BEGIN
  SELECT name INTO _gym FROM public.gyms WHERE id = NEW.gym_id;
  FOR _coach IN SELECT coach_id FROM public.coach_gyms WHERE gym_id = NEW.gym_id LOOP
    PERFORM public.enqueue_notification(_coach, 'newReview', 'Nové hodnocení posilovny',
      coalesce(_gym, 'Posilovna') || ' · ' || repeat('★', NEW.rating), '/gyms', 'review-' || NEW.id);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE TRIGGER gym_reviews_notify AFTER INSERT ON public.gym_reviews
  FOR EACH ROW EXECUTE FUNCTION private.notify_gym_review();

-- ─── Training reminders (run by cron) ───────────────────────────────────────

ALTER TABLE public.slot_bookings ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
ALTER TABLE public.coach_slots ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Reminds clients (per confirmed booking) and coaches (per slot with a confirmed
-- booking) `user_settings.reminder_minutes` (default 60) before the start.
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
           (SELECT string_agg(private.display_name(b.client_id), ', ')
              FROM public.slot_bookings b WHERE b.slot_id = s.id AND b.status = 'confirmed') AS clients
    FROM public.coach_slots s
    LEFT JOIN public.user_settings us ON us.user_id = s.coach_id
    WHERE s.reminder_sent_at IS NULL
      AND s.start_time > now()
      AND s.start_time <= now() + make_interval(mins => coalesce(us.reminder_minutes, 60))
      AND EXISTS (SELECT 1 FROM public.slot_bookings b WHERE b.slot_id = s.id AND b.status = 'confirmed')
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

-- One cron tick: reminders, a backstop ping for anything still pending, cleanup.
CREATE OR REPLACE FUNCTION private.push_cron_tick()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_due_reminders();
  IF EXISTS (SELECT 1 FROM public.notification_events WHERE status IN ('pending', 'processing') AND attempts < 3) THEN
    PERFORM private.kick_push_worker();
  END IF;
  DELETE FROM public.notification_events WHERE created_at < now() - interval '30 days';
END;
$$;

-- ─── Extensions & schedule (skipped where unavailable, e.g. local tests) ───

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net') THEN
    CREATE EXTENSION IF NOT EXISTS pg_net;
  ELSE
    RAISE NOTICE 'pg_net not available: push worker will not be pinged from the database';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'pg_net setup failed: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    PERFORM cron.schedule('push-notifications-tick', '* * * * *', 'SELECT private.push_cron_tick()');
  ELSE
    RAISE NOTICE 'pg_cron not available: reminders are not scheduled';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'pg_cron setup failed: %', SQLERRM;
END;
$$;
