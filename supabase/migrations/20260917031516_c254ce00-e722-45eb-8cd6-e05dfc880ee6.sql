CREATE TABLE public.eligibility_gate_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_key text NOT NULL UNIQUE,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  guidance_ar text,
  guidance_en text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.eligibility_gate_checks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.eligibility_gate_checks TO authenticated;
GRANT ALL ON public.eligibility_gate_checks TO service_role;
ALTER TABLE public.eligibility_gate_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published gate checks are public" ON public.eligibility_gate_checks FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can read all gate checks" ON public.eligibility_gate_checks FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create gate checks" ON public.eligibility_gate_checks FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gate checks" ON public.eligibility_gate_checks FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gate checks" ON public.eligibility_gate_checks FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE TRIGGER eligibility_gate_checks_updated_at BEFORE UPDATE ON public.eligibility_gate_checks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();