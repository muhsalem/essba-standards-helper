CREATE TABLE public.assessment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE DEFAULT ('SSE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  client_name text NOT NULL CHECK (char_length(client_name) BETWEEN 2 AND 120),
  organization_name text NOT NULL CHECK (char_length(organization_name) BETWEEN 2 AND 160),
  email text NOT NULL CHECK (char_length(email) <= 255),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  country text CHECK (country IS NULL OR char_length(country) <= 100),
  sector text NOT NULL CHECK (char_length(sector) BETWEEN 2 AND 160),
  activity text NOT NULL CHECK (char_length(activity) BETWEEN 2 AND 240),
  assessment_type text NOT NULL CHECK (assessment_type IN ('expert', 'self', 'ai_review')),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  preferred_language text NOT NULL DEFAULT 'ar' CHECK (preferred_language IN ('ar', 'en')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'scheduled', 'completed', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.assessment_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.assessment_requests TO authenticated;
GRANT ALL ON public.assessment_requests TO service_role;
ALTER TABLE public.assessment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an assessment request" ON public.assessment_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');

CREATE TABLE public.standard_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE CHECK (section_key ~ '^[a-z0-9_]+$'),
  sort_order integer NOT NULL DEFAULT 0,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  body_ar text NOT NULL,
  body_en text NOT NULL,
  translation_status text NOT NULL DEFAULT 'approved' CHECK (translation_status IN ('pending', 'translated', 'approved')),
  is_published boolean NOT NULL DEFAULT true,
  translated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.standard_sections TO anon, authenticated;
GRANT ALL ON public.standard_sections TO service_role;
ALTER TABLE public.standard_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published standard sections are public" ON public.standard_sections FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE CHECK (setting_key ~ '^[a-z0-9_]+$'),
  value text NOT NULL CHECK (char_length(value) <= 500),
  label_ar text NOT NULL,
  label_en text NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brand_settings TO anon, authenticated;
GRANT ALL ON public.brand_settings TO service_role;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public brand settings are readable" ON public.brand_settings FOR SELECT TO anon, authenticated USING (is_public = true);

CREATE TABLE public.content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.standard_sections(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  change_note text CHECK (change_note IS NULL OR char_length(change_note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_revisions TO authenticated;
GRANT ALL ON public.content_revisions TO service_role;
ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER assessment_requests_updated_at BEFORE UPDATE ON public.assessment_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER standard_sections_updated_at BEFORE UPDATE ON public.standard_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER brand_settings_updated_at BEFORE UPDATE ON public.brand_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.standard_sections (section_key, sort_order, title_ar, title_en, body_ar, body_en, translated_at) VALUES
('introduction', 10, 'المعيار المرجعي', 'The Reference Standard', 'إطار معياري موحد لتقييم وتصنيف القطاعات والأنشطة الاقتصادية وقياس مدى امتثالها لأحكام الشريعة الإسلامية بمنهجية مرجحة وشفافة.', 'A unified reference framework for assessing and classifying economic sectors and activities and measuring their compliance with Islamic Shariah through a transparent, weighted methodology.', now()),
('eligibility_gate', 20, 'بوابة الأهلية', 'Eligibility Gate', 'فحص أولي ملزم وغير مرجح للتحقق من خلو النشاط من الربا والميسر والسلع أو الخدمات المحرمة والغش والغرر. يؤدي الإخفاق إلى عدم الأهلية بصرف النظر عن درجات المحاور.', 'A mandatory, unweighted initial screen verifies that the activity is free from riba, maysir, prohibited goods or services, fraud, and gharar. Failure makes the activity ineligible regardless of its axis scores.', now()),
('weighted_axes', 30, 'محاور القياس الستة', 'The Six Weighted Axes', 'العقود 25%، الإيرادات 25%، التمويل 20%، العمليات 15%، الحوكمة 10%، والإفصاح 5%. المسؤولية الاجتماعية قيمة استرشادية ولا تدخل في الدرجة الملزمة.', 'Contracts 25%, revenue 25%, financing 20%, operations 15%, governance 10%, and disclosure 5%. Social responsibility is aspirational and is excluded from the binding score.', now()),
('score_bands', 40, 'نطاقات التصنيف', 'Classification Bands', 'ممتثل: 85–100 (امتثال كامل من 95). ممتثل بشروط: 75–84. يحتاج معالجة: 60–74. غير ممتثل: أقل من 60 (إخفاق هيكلي دون 45).', 'Compliant: 85–100 (full compliance from 95). Conditionally compliant: 75–84. Needs remediation: 60–74. Non-compliant: below 60 (structural failure below 45).', now()),
('risk_matrix', 50, 'مصفوفة الحكم والمخاطر', 'Verdict and Risk Matrix', 'تُدمج نتيجة القياس مع مستوى المخاطر الشرعية المستقل S1–S4 لإصدار الحكم: معتمد، معتمد بشروط، مشروط، معالجة، أو مرفوض. لا يضع المعيار قاعدة آلية لاشتقاق مستوى المخاطر، لذلك يحدده المراجع المختص.', 'The measurement result is combined with an independent S1–S4 Shariah risk tier to produce the verdict: approved, approved with conditions, conditional, remediation, or rejected. The standard does not define an automatic risk-tier derivation rule, so a qualified reviewer selects it.', now()),
('special_states', 60, 'الحالات الخاصة', 'Special States', 'يشمل الإطار حالتين مستقلتين عن نطاقات الدرجات: قيد الدراسة أو الإحالة، وغير منطبق أو خارج النطاق.', 'The framework includes two states separate from the score bands: under study or referral, and not applicable or out of scope.', now());

INSERT INTO public.brand_settings (setting_key, value, label_ar, label_en) VALUES
('brand_name', 'SSESBA · GSCS', 'اسم المنصة', 'Platform name'),
('primary_color', '#15263F', 'اللون الكحلي', 'Navy color'),
('accent_color', '#B88734', 'اللون الذهبي', 'Gold color'),
('surface_color', '#F8F5ED', 'لون الخلفية', 'Surface color');