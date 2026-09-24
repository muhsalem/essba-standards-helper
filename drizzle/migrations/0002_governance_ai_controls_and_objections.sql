CREATE TABLE public.ai_invocation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_kind text NOT NULL CHECK (request_kind IN ('assessment_suggestion','standards_assistant','six_scale','translation')),
  identifier_hash text NOT NULL CHECK (char_length(identifier_hash) BETWEEN 32 AND 128),
  run_id text,
  outcome text NOT NULL CHECK (outcome IN ('succeeded','failed','denied','limited')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_invocation_events TO service_role;
ALTER TABLE public.ai_invocation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to AI invocation events" ON public.ai_invocation_events FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE INDEX ai_invocation_events_kind_created_idx ON public.ai_invocation_events (request_kind, created_at DESC);
CREATE INDEX ai_invocation_events_identifier_created_idx ON public.ai_invocation_events (identifier_hash, created_at DESC);

CREATE TABLE public.assessment_objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL CHECK (char_length(btrim(reference_code)) BETWEEN 4 AND 40),
  requester_name text NOT NULL CHECK (char_length(btrim(requester_name)) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) <= 255),
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 20 AND 3000),
  preferred_language text NOT NULL DEFAULT 'ar' CHECK (preferred_language IN ('ar','en')),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','under_review','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.assessment_objections TO anon, authenticated;
GRANT SELECT, UPDATE ON public.assessment_objections TO authenticated;
GRANT ALL ON public.assessment_objections TO service_role;
ALTER TABLE public.assessment_objections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an assessment objection" ON public.assessment_objections FOR INSERT TO anon, authenticated WITH CHECK (status = 'received');
CREATE POLICY "Editors can read assessment objections" ON public.assessment_objections FOR SELECT TO authenticated USING (private.is_editor(auth.uid()));
CREATE POLICY "Editors can update assessment objections" ON public.assessment_objections FOR UPDATE TO authenticated USING (private.is_editor(auth.uid())) WITH CHECK (private.is_editor(auth.uid()));
CREATE TRIGGER assessment_objections_updated_at BEFORE UPDATE ON public.assessment_objections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.assessment_requests ADD COLUMN consent_version text NOT NULL DEFAULT 'privacy-2026-09-23';
ALTER TABLE public.assessment_requests ADD COLUMN consented_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.standard_sections ADD COLUMN review_status text NOT NULL DEFAULT 'approved' CHECK (review_status IN ('draft','pending_review','approved','rejected'));
ALTER TABLE public.standard_sections ADD COLUMN content_version integer NOT NULL DEFAULT 1 CHECK (content_version > 0);
ALTER TABLE public.standard_sections ADD COLUMN reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.standard_sections ADD COLUMN reviewed_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.register_submission_attempt(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_submission_attempt(text, text, integer, integer) TO service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;