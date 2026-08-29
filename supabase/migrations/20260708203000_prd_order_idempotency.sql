ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_customer_idempotency_key
  ON public.orders(customer_id, idempotency_key)
  WHERE customer_id IS NOT NULL AND idempotency_key IS NOT NULL;

DROP FUNCTION IF EXISTS public.place_order_atomic(
  TEXT,
  UUID,
  JSONB,
  INTEGER,
  INTEGER,
  UUID,
  INTEGER,
  INTEGER,
  INTEGER,
  INTEGER,
  TEXT,
  JSONB,
  INTEGER
);

CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_order_number TEXT,
  p_customer_id UUID,
  p_address_snapshot JSONB,
  p_subtotal_syp INTEGER,
  p_discount_syp INTEGER,
  p_discount_code_id UUID,
  p_loyalty_discount_syp INTEGER,
  p_loyalty_points_used INTEGER,
  p_shipping_syp INTEGER,
  p_total_syp INTEGER,
  p_notes TEXT,
  p_items JSONB,
  p_points_earned INTEGER,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_item_type TEXT;
  v_variant_id UUID;
  v_bundle_id UUID;
  v_qty INTEGER;
  v_stock INTEGER;
  v_bundle_item RECORD;
  v_bundle_qty INTEGER;
  v_idempotency_key TEXT := NULLIF(BTRIM(p_idempotency_key), '');
BEGIN
  IF p_customer_id IS NOT NULL AND v_idempotency_key IS NOT NULL THEN
    SELECT id
      INTO v_order_id
    FROM public.orders
    WHERE customer_id = p_customer_id
      AND idempotency_key = v_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN v_order_id;
    END IF;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INTEGER;
    v_item_type := COALESCE(v_item->>'item_type', 'variant');

    IF v_item_type = 'bundle' THEN
      v_bundle_id := (v_item->>'variant_id')::UUID;

      FOR v_bundle_item IN
        SELECT product_variant_id, quantity
        FROM public.bundle_items
        WHERE bundle_id = v_bundle_id
      LOOP
        v_variant_id := v_bundle_item.product_variant_id;
        v_bundle_qty := v_bundle_item.quantity * v_qty;

        SELECT stock_quantity
          INTO v_stock
        FROM public.product_variants
        WHERE id = v_variant_id
        FOR UPDATE;

        IF v_stock IS NULL OR v_stock < v_bundle_qty THEN
          RAISE EXCEPTION 'OUT_OF_STOCK:%', v_variant_id;
        END IF;

        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - v_bundle_qty,
            updated_at = NOW()
        WHERE id = v_variant_id;
      END LOOP;
    ELSE
      v_variant_id := (v_item->>'variant_id')::UUID;

      SELECT stock_quantity
        INTO v_stock
      FROM public.product_variants
      WHERE id = v_variant_id
      FOR UPDATE;

      IF v_stock IS NULL OR v_stock < v_qty THEN
        RAISE EXCEPTION 'OUT_OF_STOCK:%', v_variant_id;
      END IF;

      UPDATE public.product_variants
      SET stock_quantity = stock_quantity - v_qty,
          updated_at = NOW()
      WHERE id = v_variant_id;
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    order_number,
    customer_id,
    address_snapshot,
    subtotal_syp,
    discount_syp,
    discount_code_id,
    loyalty_discount_syp,
    loyalty_points_used,
    shipping_syp,
    total_syp,
    notes,
    status,
    payment_status,
    payment_method,
    loyalty_points_earned,
    idempotency_key
  ) VALUES (
    p_order_number,
    p_customer_id,
    p_address_snapshot,
    p_subtotal_syp,
    p_discount_syp,
    p_discount_code_id,
    p_loyalty_discount_syp,
    p_loyalty_points_used,
    p_shipping_syp,
    p_total_syp,
    p_notes,
    'pending',
    'pending',
    'cash_on_delivery',
    p_points_earned,
    v_idempotency_key
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_type := COALESCE(v_item->>'item_type', 'variant');

    INSERT INTO public.order_items (
      order_id,
      variant_id,
      bundle_id,
      quantity,
      unit_price_syp,
      total_price_syp,
      product_snapshot
    ) VALUES (
      v_order_id,
      CASE WHEN v_item_type = 'variant' THEN (v_item->>'variant_id')::UUID ELSE NULL END,
      CASE WHEN v_item_type = 'bundle' THEN (v_item->>'variant_id')::UUID ELSE NULL END,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price_syp')::INTEGER,
      (v_item->>'total_price_syp')::INTEGER,
      v_item->'product_snapshot'
    );
  END LOOP;

  IF p_discount_code_id IS NOT NULL THEN
    UPDATE public.discount_codes
    SET used_count = used_count + 1
    WHERE id = p_discount_code_id;
  END IF;

  IF p_customer_id IS NOT NULL AND p_loyalty_points_used > 0 THEN
    PERFORM public.award_loyalty_points(
      p_customer_id,
      -p_loyalty_points_used,
      'redeemed',
      v_order_id,
      p_customer_id,
      'customer',
      'Redeemed points at checkout'
    );
  END IF;

  IF p_customer_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      actor_id,
      actor_role,
      action,
      entity_type,
      entity_id,
      before_state,
      after_state,
      ip_address,
      user_agent
    ) VALUES (
      p_customer_id,
      'customer',
      'order.created',
      'orders',
      v_order_id,
      NULL,
      jsonb_build_object('order_number', p_order_number, 'total_syp', p_total_syp),
      NULL,
      NULL
    );
  END IF;

  RETURN v_order_id;
END;
$$;
