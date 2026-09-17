CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

ALTER POLICY "Admins can read audit log" ON public.admin_audit_log USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can create audit entries" ON public.admin_audit_log WITH CHECK (private.has_role(auth.uid(), 'admin') AND actor_user_id = auth.uid());
ALTER POLICY "Admins can read assessment requests" ON public.assessment_requests USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can update assessment requests" ON public.assessment_requests USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can delete assessment requests" ON public.assessment_requests USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can read all standard sections" ON public.standard_sections USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can update standard sections" ON public.standard_sections USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can read all brand settings" ON public.brand_settings USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can update brand settings" ON public.brand_settings USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can read revision history" ON public.content_revisions USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can create revisions" ON public.content_revisions WITH CHECK (private.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;