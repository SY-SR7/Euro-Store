CREATE OR REPLACE FUNCTION public.partner_receive_exchange_atomic(
  p_exchange_id UUID,
  p_partner_id UUID,
  p_token_hash TEXT
)
RETURNS public.exchange_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public, pg_temp
AS $$
DECLARE
  v_token public.exchange_qr_tokens%ROWTYPE;
  v_exchange public.exchange_requests%ROWTYPE;
BEGIN
  IF p_exchange_id IS NULL OR p_partner_id IS NULL OR length(trim(p_token_hash)) <> 64 THEN
    RAISE EXCEPTION 'invalid_receipt_input';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.partner_profiles
    WHERE id = p_partner_id AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'inactive_partner';
  END IF;

  SELECT * INTO v_token
  FROM public.exchange_qr_tokens
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND OR v_token.exchange_request_id <> p_exchange_id THEN
    RAISE EXCEPTION 'token_not_found';
  END IF;
  IF v_token.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'token_already_used';
  END IF;
  IF v_token.expires_at <= NOW() THEN
    RAISE EXCEPTION 'token_expired';
  END IF;

  SELECT * INTO v_exchange
  FROM public.exchange_requests
  WHERE id = p_exchange_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'exchange_not_found'; END IF;
  IF v_exchange.resolution_path <> 'partner' THEN RAISE EXCEPTION 'not_partner_path'; END IF;
  IF v_exchange.partner_id IS NOT NULL AND v_exchange.partner_id <> p_partner_id THEN
    RAISE EXCEPTION 'assigned_to_other_partner';
  END IF;
  IF v_exchange.status <> 'approved' THEN RAISE EXCEPTION 'invalid_status'; END IF;
  IF coalesce(v_exchange.partner_stage, 'awaiting_customer') <> 'awaiting_customer' THEN
    RAISE EXCEPTION 'invalid_stage';
  END IF;

  UPDATE public.exchange_qr_tokens
  SET redeemed_at = NOW()
  WHERE id = v_token.id;

  UPDATE public.exchange_requests
  SET partner_id = p_partner_id,
      partner_stage = 'received_from_customer',
      qr_code_used_at = NOW(),
      updated_at = NOW()
  WHERE id = p_exchange_id
  RETURNING * INTO v_exchange;

  INSERT INTO public.exchange_status_history (
    exchange_request_id, status, changed_by_id, changed_by_role, notes
  ) VALUES (
    p_exchange_id, 'received_from_customer', p_partner_id, 'partner',
    'exchange.partner.confirm_receipt'
  );

  RETURN v_exchange;
END;
$$;

REVOKE ALL ON FUNCTION public.partner_receive_exchange_atomic(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partner_receive_exchange_atomic(UUID, UUID, TEXT) TO service_role;
