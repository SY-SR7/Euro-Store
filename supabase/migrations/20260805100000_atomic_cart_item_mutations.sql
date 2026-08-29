CREATE OR REPLACE FUNCTION public.add_customer_cart_item(
  p_customer_id UUID,
  p_item_type TEXT,
  p_item_id UUID,
  p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_available INTEGER;
  v_cart_item_id UUID;
  v_quantity INTEGER;
BEGIN
  IF p_customer_id IS NULL
    OR p_item_id IS NULL
    OR p_item_type NOT IN ('variant', 'bundle')
    OR p_quantity NOT BETWEEN 1 AND 99 THEN
    RAISE EXCEPTION 'invalid_cart_item';
  END IF;

  IF p_item_type = 'variant' THEN
    SELECT LEAST(pv.stock_quantity, 99)
    INTO v_available
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = p_item_id
      AND pv.is_active
      AND p.is_active
      AND p.status = 'published'
    FOR UPDATE OF pv;

    IF COALESCE(v_available, 0) < 1 THEN
      RAISE EXCEPTION 'cart_item_unavailable';
    END IF;

    INSERT INTO public.cart_items (customer_id, product_variant_id, quantity, updated_at)
    VALUES (p_customer_id, p_item_id, LEAST(p_quantity, v_available), NOW())
    ON CONFLICT (customer_id, product_variant_id) DO UPDATE
      SET quantity = LEAST(public.cart_items.quantity + EXCLUDED.quantity, v_available, 99),
          updated_at = NOW()
    RETURNING id, quantity INTO v_cart_item_id, v_quantity;
  ELSE
    PERFORM 1
    FROM public.bundle_items bi
    JOIN public.product_variants pv ON pv.id = bi.product_variant_id
    WHERE bi.bundle_id = p_item_id
    FOR UPDATE OF pv;

    v_available := public.cart_bundle_available_quantity(p_item_id);
    IF COALESCE(v_available, 0) < 1 THEN
      RAISE EXCEPTION 'cart_item_unavailable';
    END IF;

    INSERT INTO public.cart_bundle_items (customer_id, bundle_id, quantity, updated_at)
    VALUES (p_customer_id, p_item_id, LEAST(p_quantity, v_available), NOW())
    ON CONFLICT (customer_id, bundle_id) DO UPDATE
      SET quantity = LEAST(public.cart_bundle_items.quantity + EXCLUDED.quantity, v_available, 99),
          updated_at = NOW()
    RETURNING id, quantity INTO v_cart_item_id, v_quantity;
  END IF;

  RETURN jsonb_build_object(
    'cart_item_id', v_cart_item_id,
    'item_type', p_item_type,
    'item_id', p_item_id,
    'quantity', v_quantity
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_customer_cart_item_quantity(
  p_customer_id UUID,
  p_cart_item_id UUID,
  p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_item_type TEXT;
  v_item_id UUID;
  v_available INTEGER;
  v_quantity INTEGER;
BEGIN
  IF p_customer_id IS NULL OR p_cart_item_id IS NULL OR p_quantity NOT BETWEEN 1 AND 99 THEN
    RAISE EXCEPTION 'invalid_cart_item';
  END IF;

  SELECT 'variant', ci.product_variant_id
  INTO v_item_type, v_item_id
  FROM public.cart_items ci
  WHERE ci.id = p_cart_item_id AND ci.customer_id = p_customer_id;

  IF v_item_id IS NULL THEN
    SELECT 'bundle', cbi.bundle_id
    INTO v_item_type, v_item_id
    FROM public.cart_bundle_items cbi
    WHERE cbi.id = p_cart_item_id AND cbi.customer_id = p_customer_id;
  END IF;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'cart_item_not_found';
  END IF;

  IF v_item_type = 'variant' THEN
    SELECT LEAST(pv.stock_quantity, 99)
    INTO v_available
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_item_id
      AND pv.is_active
      AND p.is_active
      AND p.status = 'published'
    FOR UPDATE OF pv;
  ELSE
    PERFORM 1
    FROM public.bundle_items bi
    JOIN public.product_variants pv ON pv.id = bi.product_variant_id
    WHERE bi.bundle_id = v_item_id
    FOR UPDATE OF pv;
    v_available := public.cart_bundle_available_quantity(v_item_id);
  END IF;

  IF COALESCE(v_available, 0) < 1 THEN
    RAISE EXCEPTION 'cart_item_unavailable';
  END IF;

  IF v_item_type = 'variant' THEN
    UPDATE public.cart_items
    SET quantity = LEAST(p_quantity, v_available, 99), updated_at = NOW()
    WHERE id = p_cart_item_id AND customer_id = p_customer_id
    RETURNING quantity INTO v_quantity;
  ELSE
    UPDATE public.cart_bundle_items
    SET quantity = LEAST(p_quantity, v_available, 99), updated_at = NOW()
    WHERE id = p_cart_item_id AND customer_id = p_customer_id
    RETURNING quantity INTO v_quantity;
  END IF;

  RETURN jsonb_build_object(
    'cart_item_id', p_cart_item_id,
    'item_type', v_item_type,
    'item_id', v_item_id,
    'quantity', v_quantity
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_customer_cart_item(
  p_customer_id UUID,
  p_cart_item_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF p_customer_id IS NULL OR p_cart_item_id IS NULL THEN
    RAISE EXCEPTION 'invalid_cart_item';
  END IF;

  DELETE FROM public.cart_items
  WHERE id = p_cart_item_id AND customer_id = p_customer_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    DELETE FROM public.cart_bundle_items
    WHERE id = p_cart_item_id AND customer_id = p_customer_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  END IF;

  RETURN v_deleted > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.add_customer_cart_item(UUID, TEXT, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_customer_cart_item_quantity(UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.remove_customer_cart_item(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_customer_cart_item(UUID, TEXT, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_customer_cart_item_quantity(UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_customer_cart_item(UUID, UUID) TO service_role;
