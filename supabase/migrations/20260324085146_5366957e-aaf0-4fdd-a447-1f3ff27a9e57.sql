
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  reminder_minutes integer NOT NULL DEFAULT 60,
  notification_settings jsonb NOT NULL DEFAULT '{
    "newBooking": {"email": true, "sms": false, "push": true},
    "cancelledBooking": {"email": true, "sms": true, "push": true},
    "reminder": {"email": false, "sms": false, "push": true},
    "newMessage": {"email": false, "sms": false, "push": true},
    "payment": {"email": true, "sms": false, "push": true},
    "newReview": {"email": true, "sms": false, "push": false},
    "planChange": {"email": true, "sms": false, "push": true}
  }'::jsonb,
  bg_preset text NOT NULL DEFAULT 'none',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
