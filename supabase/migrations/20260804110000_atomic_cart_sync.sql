CREATE OR REPLACE FUNCTION public.merge_customer_cart(
  p_customer_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_customer_id IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'invalid_cart';
  END IF;

  INSERT INTO public.cart_items (customer_id, product_variant_id, quantity, updated_at)
  SELECT p_customer_id,
         requested.variant_id,
         LEAST(requested.quantity, pv.stock_quantity, 99),
         NOW()
  FROM (
    SELECT item.variant_id, MAX(item.quantity) AS quantity
    FROM jsonb_to_recordset(p_items) AS item(variant_id UUID, quantity INTEGER)
    WHERE item.variant_id IS NOT NULL AND item.quantity BETWEEN 1 AND 99
    GROUP BY item.variant_id
  ) requested
  JOIN public.product_variants pv ON pv.id = requested.variant_id
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.is_active = TRUE AND pv.stock_quantity > 0
    AND p.is_active = TRUE AND p.status = 'published'
  ON CONFLICT (customer_id, product_variant_id) DO UPDATE
        SET quantity = LEAST(
          public.cart_items.quantity + EXCLUDED.quantity,
          (SELECT stock_quantity FROM public.product_variants WHERE id = EXCLUDED.product_variant_id),
          99
        ),
        updated_at = NOW();

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'product_variant_id', ci.product_variant_id,
    'quantity', ci.quantity
  ) ORDER BY ci.added_at), '[]'::JSONB)
  INTO v_result
  FROM public.cart_items ci
  WHERE ci.customer_id = p_customer_id;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_customer_cart(
  p_customer_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_customer_id IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'invalid_cart';
  END IF;

  DELETE FROM public.cart_items WHERE customer_id = p_customer_id;

  INSERT INTO public.cart_items (customer_id, product_variant_id, quantity, updated_at)
  SELECT p_customer_id,
         requested.variant_id,
         LEAST(requested.quantity, pv.stock_quantity, 99),
         NOW()
  FROM (
    SELECT item.variant_id, MAX(item.quantity) AS quantity
    FROM jsonb_to_recordset(p_items) AS item(variant_id UUID, quantity INTEGER)
    WHERE item.variant_id IS NOT NULL AND item.quantity BETWEEN 1 AND 99
    GROUP BY item.variant_id
  ) requested
  JOIN public.product_variants pv ON pv.id = requested.variant_id
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.is_active = TRUE AND pv.stock_quantity > 0
    AND p.is_active = TRUE AND p.status = 'published';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'product_variant_id', ci.product_variant_id,
    'quantity', ci.quantity
  ) ORDER BY ci.added_at), '[]'::JSONB)
  INTO v_result
  FROM public.cart_items ci
  WHERE ci.customer_id = p_customer_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_customer_cart(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_customer_cart(UUID, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.replace_customer_cart(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_customer_cart(UUID, JSONB) TO service_role;
