DELETE FROM public.exchange_qr_tokens token
USING (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY exchange_request_id
           ORDER BY created_at DESC, id DESC
         ) AS row_number
  FROM public.exchange_qr_tokens
) duplicate
WHERE token.id = duplicate.id
  AND duplicate.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS exchange_qr_tokens_exchange_request_id_key
  ON public.exchange_qr_tokens(exchange_request_id);

CREATE OR REPLACE FUNCTION public.approve_exchange_request_atomic(
  p_exchange_request_id UUID,
  p_resolution_path TEXT,
  p_partner_id UUID,
  p_qr_token TEXT,
  p_qr_token_hash TEXT,
  p_qr_expires_at TIMESTAMPTZ,
  p_actor_id UUID,
  p_actor_role TEXT
)
RETURNS public.exchange_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_request public.exchange_requests;
  updated_request public.exchange_requests;
BEGIN
  IF p_actor_role NOT IN ('admin', 'helper') THEN RAISE EXCEPTION 'invalid_actor_role' USING ERRCODE = '22023'; END IF;
  IF p_resolution_path NOT IN ('helper', 'partner') THEN RAISE EXCEPTION 'invalid_resolution_path' USING ERRCODE = '22023'; END IF;
  IF p_resolution_path = 'partner' THEN
    IF p_partner_id IS NULL THEN RAISE EXCEPTION 'partner_id_required' USING ERRCODE = '22023'; END IF;
    IF NOT EXISTS (SELECT 1 FROM partner_profiles WHERE id = p_partner_id AND is_active = TRUE) THEN
      RAISE EXCEPTION 'partner_not_found' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  SELECT * INTO current_request FROM exchange_requests WHERE id = p_exchange_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'exchange_not_found' USING ERRCODE = 'P0002'; END IF;
  IF current_request.status <> 'pending' THEN RAISE EXCEPTION 'already_processed' USING ERRCODE = 'P0001'; END IF;

  UPDATE exchange_requests
  SET status = 'approved',
      resolution_path = p_resolution_path,
      partner_id = CASE WHEN p_resolution_path = 'partner' THEN p_partner_id ELSE NULL END,
      partner_stage = CASE WHEN p_resolution_path = 'partner' THEN 'awaiting_customer' ELSE NULL END,
      qr_code_token = p_qr_token,
      qr_code_expires_at = p_qr_expires_at,
      qr_code_used_at = NULL,
      processed_by_id = p_actor_id,
      processed_by_role = p_actor_role,
      updated_at = NOW()
  WHERE id = p_exchange_request_id
  RETURNING * INTO updated_request;

  INSERT INTO exchange_qr_tokens (exchange_request_id, customer_id, token_hash, expires_at, created_at)
  VALUES (updated_request.id, updated_request.customer_id, p_qr_token_hash, p_qr_expires_at, NOW())
  ON CONFLICT (exchange_request_id) DO UPDATE
  SET customer_id = EXCLUDED.customer_id, token_hash = EXCLUDED.token_hash,
      expires_at = EXCLUDED.expires_at, created_at = EXCLUDED.created_at, redeemed_at = NULL;

  INSERT INTO exchange_status_history (exchange_request_id, status, changed_by_id, changed_by_role, notes)
  VALUES (updated_request.id, 'approved', p_actor_id, p_actor_role, p_resolution_path);

  INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id, before_state, after_state)
  VALUES (p_actor_id, p_actor_role::user_role, 'exchange.approved', 'exchange_requests', updated_request.id,
    jsonb_build_object('status', current_request.status),
    jsonb_build_object('status', 'approved', 'resolution_path', p_resolution_path, 'partner_id', p_partner_id));

  RETURN updated_request;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_exchange_request_atomic(
  p_exchange_request_id UUID,
  p_rejection_reason TEXT,
  p_actor_id UUID,
  p_actor_role TEXT
)
RETURNS public.exchange_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_request public.exchange_requests;
  updated_request public.exchange_requests;
BEGIN
  IF p_actor_role NOT IN ('admin', 'helper') THEN RAISE EXCEPTION 'invalid_actor_role' USING ERRCODE = '22023'; END IF;
  IF length(trim(p_rejection_reason)) < 2 THEN RAISE EXCEPTION 'rejection_reason_required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO current_request FROM exchange_requests WHERE id = p_exchange_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'exchange_not_found' USING ERRCODE = 'P0002'; END IF;
  IF current_request.status <> 'pending' THEN RAISE EXCEPTION 'already_processed' USING ERRCODE = 'P0001'; END IF;

  UPDATE exchange_requests
  SET status = 'rejected', rejection_reason = trim(p_rejection_reason),
      processed_by_id = p_actor_id, processed_by_role = p_actor_role::public.user_role, updated_at = NOW()
  WHERE id = p_exchange_request_id
  RETURNING * INTO updated_request;

  INSERT INTO exchange_status_history (exchange_request_id, status, changed_by_id, changed_by_role, notes)
  VALUES (updated_request.id, 'rejected', p_actor_id, p_actor_role::public.user_role, trim(p_rejection_reason));

  INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id, before_state, after_state)
  VALUES (p_actor_id, p_actor_role::user_role, 'exchange.rejected', 'exchange_requests', updated_request.id,
    jsonb_build_object('status', current_request.status),
    jsonb_build_object('status', 'rejected', 'rejection_reason', trim(p_rejection_reason)));

  RETURN updated_request;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_exchange_request_atomic(UUID, TEXT, UUID, TEXT, TEXT, TIMESTAMPTZ, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_exchange_request_atomic(UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_exchange_request_atomic(UUID, TEXT, UUID, TEXT, TEXT, TIMESTAMPTZ, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_exchange_request_atomic(UUID, TEXT, UUID, TEXT) TO service_role;
