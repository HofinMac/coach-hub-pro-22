
-- Fix overly permissive insert on audit log - restrict to authenticated users only with actor tracking
DROP POLICY "System can insert audit entries" ON public.partner_audit_log;
CREATE POLICY "Authenticated users can insert audit entries"
  ON public.partner_audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');
