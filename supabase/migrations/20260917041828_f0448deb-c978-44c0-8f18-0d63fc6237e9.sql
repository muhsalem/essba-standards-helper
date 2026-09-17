CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, specialty, job_title, organization, bio, avatar_url, preferred_language, preferences)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'specialty',''),
    NULLIF(NEW.raw_user_meta_data->>'job_title',''),
    NULLIF(NEW.raw_user_meta_data->>'organization',''),
    NULLIF(NEW.raw_user_meta_data->>'bio',''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url',''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language',''), 'ar'),
    COALESCE(NEW.raw_user_meta_data->'preferences', '{}'::jsonb)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;