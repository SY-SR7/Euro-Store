CREATE OR REPLACE FUNCTION public.helper_scan_exchange_atomic(
  p_exchange_request_id UUID,
  p_helper_id UUID,
  p_token_hash TEXT
)
RETURNS public.exchange_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exchange public.exchange_requests%ROWTYPE;
  v_token public.exchange_qr_tokens%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF p_exchange_request_id IS NULL OR p_helper_id IS NULL OR LENGTH(COALESCE(p_token_hash, '')) <> 64 THEN
    RAISE EXCEPTION 'invalid_scan_input';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.helper_profiles
    WHERE id = p_helper_id AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'inactive_helper';
  END IF;

  SELECT * INTO v_token
  FROM public.exchange_qr_tokens
  WHERE token_hash = p_token_hash
    AND exchange_request_id = p_exchange_request_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'token_not_found'; END IF;
  IF v_token.redeemed_at IS NOT NULL THEN RAISE EXCEPTION 'token_already_used'; END IF;
  IF v_token.expires_at <= v_now THEN RAISE EXCEPTION 'token_expired'; END IF;

  SELECT * INTO v_exchange
  FROM public.exchange_requests
  WHERE id = p_exchange_request_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'exchange_not_found'; END IF;
  IF v_exchange.resolution_path IS DISTINCT FROM 'helper' THEN RAISE EXCEPTION 'not_helper_path'; END IF;
  IF v_exchange.status::TEXT <> 'approved' THEN RAISE EXCEPTION 'invalid_status'; END IF;
  IF v_exchange.qr_code_used_at IS NOT NULL THEN RAISE EXCEPTION 'token_already_used'; END IF;

  UPDATE public.exchange_qr_tokens
  SET redeemed_at = v_now
  WHERE id = v_token.id;

  UPDATE public.exchange_requests
  SET qr_code_used_at = v_now, updated_at = v_now
  WHERE id = v_exchange.id
  RETURNING * INTO v_exchange;

  INSERT INTO public.exchange_status_history (
    exchange_request_id, status, changed_by_id, changed_by_role, notes
  ) VALUES (
    v_exchange.id, 'approved', p_helper_id, 'helper', 'Helper scanned exchange QR'
  );

  RETURN v_exchange;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_helper_exchange_secure(
  p_exchange_request_id UUID,
  p_helper_id UUID,
  p_replacement_variant_id UUID
)
RETURNS public.exchange_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_variant_active BOOLEAN;
  v_product_active BOOLEAN;
  v_result public.exchange_requests%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.helper_profiles
    WHERE id = p_helper_id AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'inactive_helper';
  END IF;

  SELECT product_id, is_active
  INTO v_product_id, v_variant_active
  FROM public.product_variants
  WHERE id = p_replacement_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'replacement_variant_not_found'; END IF;
  IF NOT v_variant_active THEN RAISE EXCEPTION 'replacement_variant_inactive'; END IF;

  SELECT is_active INTO v_product_active
  FROM public.products
  WHERE id = v_product_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_product_active THEN RAISE EXCEPTION 'replacement_product_inactive'; END IF;

  SELECT * INTO v_result
  FROM public.complete_helper_exchange(
    p_exchange_request_id,
    p_helper_id,
    p_replacement_variant_id
  );
  RETURN v_result;
END;
$$;

ALTER FUNCTION public.helper_scan_exchange_atomic(UUID, UUID, TEXT) OWNER TO postgres;
ALTER FUNCTION public.complete_helper_exchange_secure(UUID, UUID, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.helper_scan_exchange_atomic(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_helper_exchange_secure(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.helper_scan_exchange_atomic(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_helper_exchange_secure(UUID, UUID, UUID) TO service_role;
