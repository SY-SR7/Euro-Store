CREATE OR REPLACE FUNCTION public.admin_list_orders(
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_page INTEGER := GREATEST(COALESCE(p_page, 1), 1);
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
  v_status TEXT := NULLIF(BTRIM(COALESCE(p_status, '')), '');
  v_search TEXT := NULLIF(BTRIM(COALESCE(p_search, '')), '');
  v_result JSONB;
BEGIN
  IF v_search IS NOT NULL AND CHAR_LENGTH(v_search) > 100 THEN
    RAISE EXCEPTION 'search_too_long';
  END IF;

  IF v_status IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'order_status' AND e.enumlabel = v_status
  ) THEN
    RAISE EXCEPTION 'invalid_order_status';
  END IF;

  WITH matching AS (
    SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
           o.total_syp, o.created_at, o.address_snapshot, o.notes
    FROM public.orders o
    WHERE (v_status IS NULL OR o.status::TEXT = v_status)
      AND (
        v_search IS NULL
        OR o.order_number ILIKE '%' || v_search || '%'
        OR COALESCE(o.address_snapshot->>'full_name', '') ILIKE '%' || v_search || '%'
      )
  ), page_rows AS (
    SELECT *
    FROM matching
    ORDER BY created_at DESC, id DESC
    OFFSET (v_page - 1) * v_limit
    LIMIT v_limit
  )
  SELECT jsonb_build_object(
    'orders', COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY created_at DESC, id DESC) FROM page_rows), '[]'::JSONB),
    'total', (SELECT COUNT(*) FROM matching),
    'page', v_page,
    'limit', v_limit
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_search_customers(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_search TEXT := NULLIF(BTRIM(COALESCE(p_search, '')), '');
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 100);
  v_result JSONB;
BEGIN
  IF v_search IS NOT NULL AND CHAR_LENGTH(v_search) > 100 THEN
    RAISE EXCEPTION 'search_too_long';
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(rows) ORDER BY rows.created_at DESC, rows.id DESC), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT cp.id, cp.full_name, cp.phone, cp.email, cp.created_at,
           cp.loyalty_points, cp.referral_code, cp.is_blocked
    FROM public.customer_profiles cp
    WHERE v_search IS NULL
      OR COALESCE(cp.full_name, '') ILIKE '%' || v_search || '%'
      OR COALESCE(cp.phone, '') ILIKE '%' || v_search || '%'
      OR COALESCE(cp.email, '') ILIKE '%' || v_search || '%'
    ORDER BY cp.created_at DESC, cp.id DESC
    LIMIT v_limit
  ) rows;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_orders(INTEGER, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_orders(INTEGER, INTEGER, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.admin_search_customers(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_customers(TEXT, INTEGER) TO service_role;
