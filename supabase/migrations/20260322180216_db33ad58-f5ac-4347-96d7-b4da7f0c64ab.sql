
-- 1. Campaign rules - reusable rule definitions
CREATE TABLE public.campaign_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN (
    'min_attendance', 'min_sessions_month', 'plan_completion',
    'course_completion', 'manual_approval', 'streak_days',
    'weight_goal', 'custom_metric'
  )),
  operator text NOT NULL DEFAULT 'gte' CHECK (operator IN ('eq','gt','gte','lt','lte')),
  threshold integer NOT NULL DEFAULT 0,
  metric_key text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read campaign rules"
  ON public.campaign_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage campaign rules"
  ON public.campaign_rules FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 2. Promo codes - individual trackable codes
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  max_uses integer DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_personal boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code)
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own or public codes"
  ON public.promo_codes FOR SELECT TO authenticated
  USING (
    assigned_to IS NULL
    OR assigned_to = auth.uid()
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage codes"
  ON public.promo_codes FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 3. Redemptions - tracks actual code usage
CREATE TABLE public.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  source text DEFAULT 'app' CHECK (source IN ('app','manual','api')),
  notes text DEFAULT ''
);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own redemptions"
  ON public.redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert redemptions"
  ON public.redemptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 4. Audit log - full history of all partner module actions
CREATE TABLE public.partner_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN (
    'partner','campaign','rule','promo_code','benefit','challenge','certificate','redemption'
  )),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN (
    'created','updated','activated','deactivated',
    'approved','rejected','expired','redeemed',
    'progress_updated','completed','assigned','revoked'
  )),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  old_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON public.partner_audit_log FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert audit entries"
  ON public.partner_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. Eligibility tracking - who qualifies for what
CREATE TABLE public.eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  eligible boolean NOT NULL DEFAULT false,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  rule_results jsonb NOT NULL DEFAULT '[]',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

ALTER TABLE public.eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own eligibility"
  ON public.eligibility FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can manage eligibility"
  ON public.eligibility FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin' OR user_id = auth.uid())
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin' OR user_id = auth.uid());
