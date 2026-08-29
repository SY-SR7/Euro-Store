ALTER TABLE public.customer_profiles
  ALTER COLUMN wishlist_share_token DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.ensure_wishlist_share_token(p_customer_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_token UUID;
BEGIN
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'invalid_customer';
  END IF;

  UPDATE public.customer_profiles
  SET wishlist_share_token = COALESCE(wishlist_share_token, gen_random_uuid()),
      updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING wishlist_share_token INTO v_token;

  IF v_token IS NULL THEN
    RAISE EXCEPTION 'customer_not_found';
  END IF;

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_wishlist_share_token(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_wishlist_share_token(UUID) TO service_role;
