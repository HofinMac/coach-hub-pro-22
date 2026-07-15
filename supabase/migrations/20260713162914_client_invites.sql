-- Coach-client assignment via invite

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_coach_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "Coaches can view their clients profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (assigned_coach_id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

-- Client invites
CREATE TABLE public.client_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (token)
);

ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own invites"
  ON public.client_invites FOR ALL
  TO authenticated
  USING (coach_id = auth.uid() OR get_user_role(auth.uid()) = 'admin')
  WITH CHECK (coach_id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

-- Reveal the inviting coach's name to an unauthenticated visitor following an invite link
CREATE OR REPLACE FUNCTION public.get_invite_coach_name(_token uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name
  FROM public.client_invites ci
  JOIN public.profiles p ON p.id = ci.coach_id
  WHERE ci.token = _token AND ci.status = 'pending';
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_coach_name(uuid) TO anon, authenticated;

-- Accept a pending invite (role + coach assignment) when a new user signs up with an invite_token
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token text;
  _invite public.client_invites%ROWTYPE;
BEGIN
  _token := NEW.raw_user_meta_data ->> 'invite_token';

  IF _token IS NOT NULL THEN
    BEGIN
      SELECT * INTO _invite FROM public.client_invites
        WHERE token = _token::uuid AND status = 'pending'
        FOR UPDATE;
    EXCEPTION WHEN invalid_text_representation THEN
      -- malformed invite_token metadata: fall through to a normal (coach) signup
      _invite := NULL;
    END;
  END IF;

  IF _invite.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, email, role, assigned_coach_id, onboarding_done)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      NEW.email,
      'client',
      _invite.coach_id,
      false
    );

    UPDATE public.client_invites
    SET status = 'accepted', client_id = NEW.id, accepted_at = now()
    WHERE id = _invite.id;
  ELSE
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Scope client visibility of available slots to their assigned coach
DROP POLICY "Clients can read available slots" ON public.coach_slots;

CREATE POLICY "Clients can read own coach's available slots"
  ON public.coach_slots FOR SELECT
  TO authenticated
  USING (
    status IN ('available', 'partially_booked')
    AND coach_id = (SELECT assigned_coach_id FROM public.profiles WHERE id = auth.uid())
  );
