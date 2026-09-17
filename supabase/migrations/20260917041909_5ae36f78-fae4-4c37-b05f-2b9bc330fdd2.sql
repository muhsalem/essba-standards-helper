CREATE OR REPLACE FUNCTION private.is_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','reviewer')
  )
$$;
REVOKE ALL ON FUNCTION private.is_editor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_editor(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'reviewer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

ALTER POLICY "Admins can read all standard sections" ON public.standard_sections USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can update standard sections" ON public.standard_sections USING (private.is_editor(auth.uid())) WITH CHECK (private.is_editor(auth.uid()));
ALTER POLICY "Admins can read revision history" ON public.content_revisions USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can create revisions" ON public.content_revisions WITH CHECK (private.is_editor(auth.uid()));
ALTER POLICY "Admins can read assessment results" ON public.assessment_results USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can read profiles" ON public.profiles USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can read all gate checks" ON public.eligibility_gate_checks USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can create gate checks" ON public.eligibility_gate_checks WITH CHECK (private.is_editor(auth.uid()));
ALTER POLICY "Admins can update gate checks" ON public.eligibility_gate_checks USING (private.is_editor(auth.uid())) WITH CHECK (private.is_editor(auth.uid()));
ALTER POLICY "Admins can delete gate checks" ON public.eligibility_gate_checks USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can read all examples" ON public.assessment_examples USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can create examples" ON public.assessment_examples WITH CHECK (private.is_editor(auth.uid()));
ALTER POLICY "Admins can update examples" ON public.assessment_examples USING (private.is_editor(auth.uid())) WITH CHECK (private.is_editor(auth.uid()));
ALTER POLICY "Admins can delete examples" ON public.assessment_examples USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can read audit log" ON public.admin_audit_log USING (private.is_editor(auth.uid()));
ALTER POLICY "Admins can create audit entries" ON public.admin_audit_log WITH CHECK (private.is_editor(auth.uid()) AND actor_user_id = auth.uid());