CREATE TABLE IF NOT EXISTS public.cart_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, bundle_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_bundle_items_customer
  ON public.cart_bundle_items(customer_id, added_at);

ALTER TABLE public.cart_bundle_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers manage own bundle cart" ON public.cart_bundle_items;
CREATE POLICY "Customers manage own bundle cart"
  ON public.cart_bundle_items
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.cart_bundle_available_quantity(p_bundle_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
    WHEN COUNT(*) = 0 OR NOT BOOL_AND(pv.is_active AND p.is_active AND p.status = 'published') THEN 0
    ELSE LEAST(MIN(pv.stock_quantity / bi.quantity), 99)::INTEGER
  END
  FROM public.product_bundles pb
  JOIN public.bundle_items bi ON bi.bundle_id = pb.id
  JOIN public.product_variants pv ON pv.id = bi.product_variant_id
  JOIN public.products p ON p.id = pv.product_id
  WHERE pb.id = p_bundle_id AND pb.status = 'published';
$$;

CREATE OR REPLACE FUNCTION public.merge_customer_cart_v2(
  p_customer_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_variant_items JSONB;
  v_result JSONB;
BEGIN
  IF p_customer_id IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'invalid_cart';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'variant_id', requested.item_id,
    'quantity', requested.quantity
  )), '[]'::JSONB)
  INTO v_variant_items
  FROM (
    SELECT item.item_id, MAX(item.quantity) AS quantity
    FROM jsonb_to_recordset(p_items) AS item(item_type TEXT, item_id UUID, quantity INTEGER)
    WHERE COALESCE(item.item_type, 'variant') = 'variant'
      AND item.item_id IS NOT NULL AND item.quantity BETWEEN 1 AND 99
    GROUP BY item.item_id
  ) requested;

  PERFORM public.merge_customer_cart(p_customer_id, v_variant_items);

  INSERT INTO public.cart_bundle_items (customer_id, bundle_id, quantity, updated_at)
  SELECT p_customer_id,
         requested.item_id,
         LEAST(requested.quantity, public.cart_bundle_available_quantity(requested.item_id)),
         NOW()
  FROM (
    SELECT item.item_id, MAX(item.quantity) AS quantity
    FROM jsonb_to_recordset(p_items) AS item(item_type TEXT, item_id UUID, quantity INTEGER)
    WHERE item.item_type = 'bundle'
      AND item.item_id IS NOT NULL AND item.quantity BETWEEN 1 AND 99
    GROUP BY item.item_id
  ) requested
  WHERE public.cart_bundle_available_quantity(requested.item_id) > 0
  ON CONFLICT (customer_id, bundle_id) DO UPDATE
    SET quantity = LEAST(
          public.cart_bundle_items.quantity + EXCLUDED.quantity,
          public.cart_bundle_available_quantity(EXCLUDED.bundle_id),
          99
        ),
        updated_at = NOW();

  SELECT COALESCE(jsonb_agg(item ORDER BY added_at), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'item_type', 'variant', 'item_id', product_variant_id, 'quantity', quantity
    ) AS item, added_at
    FROM public.cart_items WHERE customer_id = p_customer_id
    UNION ALL
    SELECT jsonb_build_object(
      'item_type', 'bundle', 'item_id', bundle_id, 'quantity', quantity
    ) AS item, added_at
    FROM public.cart_bundle_items WHERE customer_id = p_customer_id
  ) combined;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_customer_cart_v2(
  p_customer_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_customer_id IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'invalid_cart';
  END IF;

  DELETE FROM public.cart_items WHERE customer_id = p_customer_id;
  DELETE FROM public.cart_bundle_items WHERE customer_id = p_customer_id;
  RETURN public.merge_customer_cart_v2(p_customer_id, p_items);
END;
$$;

REVOKE ALL ON FUNCTION public.cart_bundle_available_quantity(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.merge_customer_cart_v2(UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.replace_customer_cart_v2(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cart_bundle_available_quantity(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.merge_customer_cart_v2(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.replace_customer_cart_v2(UUID, JSONB) TO service_role;
