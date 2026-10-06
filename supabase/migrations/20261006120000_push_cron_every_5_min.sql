-- Run the push cron tick every 5 minutes instead of every minute: reminders may
-- arrive up to 5 minutes earlier than the configured lead time, and failed
-- deliveries are retried on the same cadence. Event notifications are unaffected
-- (they ping the send-push worker immediately via pg_net).
DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    PERFORM cron.schedule('push-notifications-tick', '*/5 * * * *', 'SELECT private.push_cron_tick()');
  END IF;
END;
$$;
