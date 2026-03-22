
-- Helper function to check user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- 1. Partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website text,
  description text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read partners"
  ON public.partners FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage partners"
  ON public.partners FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 2. Promo campaigns table
CREATE TABLE public.promo_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  target_group text NOT NULL DEFAULT 'both' CHECK (target_group IN ('coach','client','both')),
  reward_type text NOT NULL DEFAULT 'percentage' CHECK (reward_type IN ('percentage','fixed','promo_code')),
  reward_value text NOT NULL DEFAULT '',
  promo_code text,
  goal_type text NOT NULL DEFAULT 'manual' CHECK (goal_type IN ('attendance','plan_completion','course_completion','manual')),
  goal_value integer DEFAULT 0,
  valid_from timestamptz,
  valid_to timestamptz,
  requires_approval boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active campaigns"
  ON public.promo_campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage campaigns"
  ON public.promo_campaigns FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 3. Coach certificates (for course completion verification)
CREATE TABLE public.coach_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  certificate_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can read own certificates"
  ON public.coach_certificates FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Coaches can insert own certificates"
  ON public.coach_certificates FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid() AND public.get_user_role(auth.uid()) = 'coach');

CREATE POLICY "Admins can update certificates"
  ON public.coach_certificates FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 4. Coach benefits
CREATE TABLE public.coach_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  coach_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  promo_code text,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, coach_id)
);

ALTER TABLE public.coach_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can read own benefits"
  ON public.coach_benefits FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Coaches can insert own benefit requests"
  ON public.coach_benefits FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Admins can update benefits"
  ON public.coach_benefits FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 5. Client challenges
CREATE TABLE public.client_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_progress integer NOT NULL DEFAULT 0,
  goal_target integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','expired','claimed')),
  completed_at timestamptz,
  promo_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, client_id)
);

ALTER TABLE public.client_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own challenges"
  ON public.client_challenges FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert challenges"
  ON public.client_challenges FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update challenges"
  ON public.client_challenges FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin' OR client_id = auth.uid());

-- 6. Reward history
CREATE TABLE public.reward_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  reward_type text NOT NULL,
  reward_value text NOT NULL DEFAULT '',
  promo_code text,
  redeemed boolean NOT NULL DEFAULT false,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reward history"
  ON public.reward_history FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert rewards"
  ON public.reward_history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update own rewards"
  ON public.reward_history FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- Storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

CREATE POLICY "Coaches can upload certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Coaches and admins can read certificates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR public.get_user_role(auth.uid()) = 'admin'
  ));
