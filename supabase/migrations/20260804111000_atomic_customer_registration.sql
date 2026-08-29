CREATE OR REPLACE FUNCTION public.register_customer_profile(
  p_customer_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_preferred_language TEXT DEFAULT 'ar',
  p_qr_code_url TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL
)
RETURNS public.customer_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_profile public.customer_profiles;
  v_referrer_id UUID;
  v_referral_code TEXT := UPPER(NULLIF(BTRIM(COALESCE(p_referral_code, '')), ''));
BEGIN
  IF p_customer_id IS NULL
     OR CHAR_LENGTH(BTRIM(COALESCE(p_full_name, ''))) NOT BETWEEN 2 AND 100
     OR CHAR_LENGTH(BTRIM(COALESCE(p_email, ''))) NOT BETWEEN 3 AND 320
     OR p_preferred_language NOT IN ('ar', 'en')
     OR (p_phone IS NOT NULL AND CHAR_LENGTH(BTRIM(p_phone)) NOT BETWEEN 6 AND 32)
     OR (p_qr_code_url IS NOT NULL AND p_qr_code_url !~ '^loyalty-qr-codes/[A-Za-z0-9][A-Za-z0-9._/-]{0,1023}$') THEN
    RAISE EXCEPTION 'invalid_customer_profile';
  END IF;

  IF v_referral_code IS NOT NULL AND v_referral_code !~ '^[A-Z0-9]{8,12}$' THEN
    v_referral_code := NULL;
  END IF;

  INSERT INTO public.customer_profiles (
    id, full_name, email, phone, preferred_language, qr_code_url
  ) VALUES (
    p_customer_id,
    BTRIM(p_full_name),
    LOWER(BTRIM(p_email)),
    NULLIF(BTRIM(COALESCE(p_phone, '')), ''),
    p_preferred_language,
    p_qr_code_url
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_referral_code IS NOT NULL THEN
    SELECT cp.id INTO v_referrer_id
    FROM public.customer_profiles cp
    WHERE cp.referral_code = v_referral_code
      AND cp.id <> p_customer_id
      AND cp.is_blocked = FALSE;

    IF v_referrer_id IS NOT NULL THEN
      UPDATE public.customer_profiles
      SET referred_by = COALESCE(referred_by, v_referrer_id), updated_at = NOW()
      WHERE id = p_customer_id AND referred_by IS NULL;

      INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
      VALUES (v_referrer_id, p_customer_id, v_referral_code, 'pending')
      ON CONFLICT (referred_id) DO NOTHING;
    END IF;
  END IF;

  SELECT * INTO v_profile
  FROM public.customer_profiles
  WHERE id = p_customer_id;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'customer_profile_not_created';
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.register_customer_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_customer_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

UPDATE storage.buckets
SET public = FALSE,
    file_size_limit = 1048576,
    allowed_mime_types = ARRAY['image/png']
WHERE id = 'loyalty-qr-codes';

DROP POLICY IF EXISTS "public_read_loyalty_qr" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_loyalty_qr" ON storage.objects;
