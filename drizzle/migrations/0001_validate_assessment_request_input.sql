CREATE OR REPLACE FUNCTION public.validate_assessment_request()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF length(btrim(NEW.client_name)) < 2 OR length(NEW.client_name) > 120 THEN
    RAISE EXCEPTION 'invalid client_name';
  END IF;
  IF length(btrim(NEW.organization_name)) < 2 OR length(NEW.organization_name) > 160 THEN
    RAISE EXCEPTION 'invalid organization_name';
  END IF;
  IF NEW.email !~* '^[^@\s]+@[^@\s.]+\.[a-z]{2,}$' OR length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'invalid email';
  END IF;
  IF NEW.phone IS NOT NULL AND length(NEW.phone) > 30 THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;
  IF NEW.country IS NOT NULL AND length(NEW.country) > 100 THEN
    RAISE EXCEPTION 'invalid country';
  END IF;
  IF length(btrim(NEW.sector)) < 2 OR length(NEW.sector) > 160 THEN
    RAISE EXCEPTION 'invalid sector';
  END IF;
  IF length(btrim(NEW.activity)) < 2 OR length(NEW.activity) > 240 THEN
    RAISE EXCEPTION 'invalid activity';
  END IF;
  IF NEW.assessment_type NOT IN ('expert','self','ai_review') THEN
    RAISE EXCEPTION 'invalid assessment_type';
  END IF;
  IF NEW.preferred_language NOT IN ('ar','en') THEN
    RAISE EXCEPTION 'invalid preferred_language';
  END IF;
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 2000 THEN
    RAISE EXCEPTION 'invalid notes';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assessment_requests_validate
  BEFORE INSERT OR UPDATE ON public.assessment_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_assessment_request();