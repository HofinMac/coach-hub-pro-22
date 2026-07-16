-- Track whether the invite email was actually delivered via Resend
ALTER TABLE public.client_invites
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
