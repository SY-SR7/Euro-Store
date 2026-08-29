DROP FUNCTION IF EXISTS public.approve_exchange_request_atomic(
  UUID, TEXT, UUID, TEXT, TEXT, TIMESTAMPTZ, UUID, TEXT
);

CREATE OR REPLACE FUNCTION public.approve_exchange_request_atomic(
  p_exchange_request_id UUID,
  p_resolution_path TEXT,
  p_partner_id UUID,
  p_qr_token TEXT,
  p_qr_token_hash TEXT,
  p_qr_code_url TEXT,
  p_qr_expires_at TIMESTAMPTZ,
  p_actor_id UUID,
  p_actor_role TEXT
)
RETURNS public.exchange_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  current_request public.exchange_requests;
  updated_request public.exchange_requests;
  is_regeneration BOOLEAN := FALSE;
BEGIN
  IF p_actor_role NOT IN ('admin', 'helper') THEN RAISE EXCEPTION 'invalid_actor_role' USING ERRCODE = '22023'; END IF;
  IF p_resolution_path NOT IN ('helper', 'partner') THEN RAISE EXCEPTION 'invalid_resolution_path' USING ERRCODE = '22023'; END IF;
  IF p_qr_code_url !~ '^exchange-qr-codes/[A-Za-z0-9][A-Za-z0-9._/-]{0,1023}$' THEN
    RAISE EXCEPTION 'invalid_qr_storage_path' USING ERRCODE = '22023';
  END IF;
  IF p_resolution_path = 'partner' THEN
    IF p_partner_id IS NULL THEN RAISE EXCEPTION 'partner_id_required' USING ERRCODE = '22023'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = p_partner_id AND is_active = TRUE) THEN
      RAISE EXCEPTION 'partner_not_found' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  SELECT * INTO current_request FROM public.exchange_requests WHERE id = p_exchange_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'exchange_not_found' USING ERRCODE = 'P0002'; END IF;
  IF current_request.status = 'approved'
     AND current_request.qr_code_used_at IS NULL
     AND current_request.qr_code_expires_at <= NOW() THEN
    is_regeneration := TRUE;
  ELSIF current_request.status <> 'pending' THEN
    RAISE EXCEPTION 'already_processed' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.exchange_requests
  SET status = 'approved',
      resolution_path = p_resolution_path,
      partner_id = CASE WHEN p_resolution_path = 'partner' THEN p_partner_id ELSE NULL END,
      partner_stage = CASE WHEN p_resolution_path = 'partner' THEN 'awaiting_customer' ELSE NULL END,
      qr_code_token = p_qr_token,
      qr_code_url = p_qr_code_url,
      qr_code_generated_at = NOW(),
      qr_code_expires_at = p_qr_expires_at,
      qr_code_used_at = NULL,
      processed_by_id = p_actor_id,
      processed_by_role = p_actor_role::public.user_role,
      updated_at = NOW()
  WHERE id = p_exchange_request_id
  RETURNING * INTO updated_request;

  INSERT INTO public.exchange_qr_tokens (exchange_request_id, customer_id, token_hash, expires_at, created_at)
  VALUES (updated_request.id, updated_request.customer_id, p_qr_token_hash, p_qr_expires_at, NOW())
  ON CONFLICT (exchange_request_id) DO UPDATE
  SET customer_id = EXCLUDED.customer_id, token_hash = EXCLUDED.token_hash,
      expires_at = EXCLUDED.expires_at, created_at = EXCLUDED.created_at, redeemed_at = NULL;

  INSERT INTO public.exchange_status_history (exchange_request_id, status, changed_by_id, changed_by_role, notes)
  VALUES (updated_request.id, 'approved', p_actor_id, p_actor_role::public.user_role, CASE WHEN is_regeneration THEN 'qr_regenerated' ELSE p_resolution_path END);

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, before_state, after_state)
  VALUES (p_actor_id, p_actor_role::public.user_role,
    CASE WHEN is_regeneration THEN 'exchange.qr_regenerated' ELSE 'exchange.approved' END,
    'exchange_requests', updated_request.id,
    jsonb_build_object('status', current_request.status, 'qr_code_url', current_request.qr_code_url),
    jsonb_build_object('status', 'approved', 'resolution_path', p_resolution_path, 'partner_id', p_partner_id, 'qr_code_url', p_qr_code_url));

  RETURN updated_request;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_exchange_request_atomic(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_exchange_request_atomic(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID, TEXT
) TO service_role;

ALTER FUNCTION public.reject_exchange_request_atomic(UUID, TEXT, UUID, TEXT)
  SET search_path TO pg_catalog, public, pg_temp;

UPDATE storage.buckets
SET public = FALSE, file_size_limit = 1048576, allowed_mime_types = ARRAY['image/png', 'image/webp']
WHERE id = 'exchange-qr-codes';
