CREATE TABLE public.submission_throttle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  identifier text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  hits integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, identifier)
);

GRANT ALL ON public.submission_throttle TO service_role;

ALTER TABLE public.submission_throttle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to throttle" ON public.submission_throttle
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE INDEX submission_throttle_window_idx ON public.submission_throttle (window_start);

-- تسجيل الطلب: دالة عدّ مركزية تعمل بصلاحيات الخدمة فقط
CREATE OR REPLACE FUNCTION public.register_submission_attempt(_scope text, _identifier text, _limit integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.submission_throttle;
BEGIN
  DELETE FROM public.submission_throttle WHERE window_start < now() - make_interval(secs => _window_seconds * 4);

  INSERT INTO public.submission_throttle (scope, identifier)
  VALUES (_scope, _identifier)
  ON CONFLICT (scope, identifier) DO UPDATE
    SET hits = CASE WHEN public.submission_throttle.window_start < now() - make_interval(secs => _window_seconds) THEN 1 ELSE public.submission_throttle.hits + 1 END,
        window_start = CASE WHEN public.submission_throttle.window_start < now() - make_interval(secs => _window_seconds) THEN now() ELSE public.submission_throttle.window_start END
  RETURNING * INTO _row;

  RETURN _row.hits <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.register_submission_attempt(text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_submission_attempt(text, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_submission_attempt(text, text, integer, integer) TO service_role;

-- ضبط الصلاحيات: منع استدعاء دالة الأدوار من الزوار غير المسجلين
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;