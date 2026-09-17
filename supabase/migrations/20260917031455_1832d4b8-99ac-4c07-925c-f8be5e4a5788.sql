CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  specialty text,
  job_title text,
  organization text,
  bio text,
  avatar_url text,
  preferred_language text NOT NULL DEFAULT 'ar' CHECK (preferred_language IN ('ar','en')),
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Teachers can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can read profiles" ON public.profiles FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, preferred_language)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language',''), 'ar'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE DEFAULT ('MSH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  owner_user_id uuid,
  organization_name text,
  sector_key text NOT NULL,
  activity_name text NOT NULL,
  assessment_mode text NOT NULL CHECK (assessment_mode IN ('expert','self','ai_review')),
  gate_state jsonb NOT NULL,
  scores jsonb NOT NULL,
  risk_tier text NOT NULL CHECK (risk_tier IN ('S1','S2','S3','S4')),
  weighted_score numeric(5,1) NOT NULL CHECK (weighted_score BETWEEN 0 AND 100),
  result_band text NOT NULL CHECK (result_band IN ('compliant','conditional','remediation','non_compliant')),
  verdict text NOT NULL CHECK (verdict IN ('approved','approved_conditional','conditional','remediation','rejected')),
  is_eligible boolean NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.assessment_results TO anon, authenticated;
GRANT SELECT ON public.assessment_results TO authenticated;
GRANT ALL ON public.assessment_results TO service_role;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit completed assessment" ON public.assessment_results FOR INSERT TO anon, authenticated WITH CHECK ((owner_user_id IS NULL AND auth.uid() IS NULL) OR owner_user_id = auth.uid());
CREATE POLICY "Owners can read own assessment results" ON public.assessment_results FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Admins can read assessment results" ON public.assessment_results FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

CREATE TABLE public.assessment_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_key text NOT NULL UNIQUE,
  isic_code text NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  activity_ar text NOT NULL,
  activity_en text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  gate_state jsonb NOT NULL,
  scores jsonb NOT NULL,
  risk_tier text NOT NULL CHECK (risk_tier IN ('S1','S2','S3','S4')),
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assessment_examples TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.assessment_examples TO authenticated;
GRANT ALL ON public.assessment_examples TO service_role;
ALTER TABLE public.assessment_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published examples are public" ON public.assessment_examples FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can read all examples" ON public.assessment_examples FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create examples" ON public.assessment_examples FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update examples" ON public.assessment_examples FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete examples" ON public.assessment_examples FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE TRIGGER assessment_examples_updated_at BEFORE UPDATE ON public.assessment_examples FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();