ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS bundle_id uuid REFERENCES public.product_bundles(id);

CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_order_number text,
  p_customer_id uuid,
  p_address_snapshot jsonb,
  p_subtotal_syp integer,
  p_discount_syp integer,
  p_discount_code_id uuid,
  p_loyalty_discount_syp integer,
  p_loyalty_points_used integer,
  p_shipping_syp integer,
  p_total_syp integer,
  p_notes text,
  p_items jsonb,
  p_points_earned integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_variant_id uuid;
  v_qty integer;
  v_stock integer;
  v_item_type text;
  v_bundle_id uuid;
  v_bundle_item record;
  v_bundle_qty integer;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::integer;
    v_item_type := COALESCE(v_item->>'item_type', 'variant');

    IF v_item_type = 'bundle' THEN
      v_bundle_id := (v_item->>'variant_id')::uuid;

      FOR v_bundle_item IN
        SELECT * FROM public.bundle_items WHERE bundle_id = v_bundle_id
      LOOP
        v_variant_id := v_bundle_item.product_variant_id;
        v_bundle_qty := v_bundle_item.quantity * v_qty;

        SELECT stock_quantity
        INTO v_stock
        FROM public.product_variants
        WHERE id = v_variant_id
        FOR UPDATE;

        IF v_stock < v_bundle_qty THEN
          RAISE EXCEPTION 'out_of_stock:%', v_variant_id;
        END IF;

        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - v_bundle_qty
        WHERE id = v_variant_id;
      END LOOP;
    ELSE
      v_variant_id := (v_item->>'variant_id')::uuid;

      SELECT stock_quantity
      INTO v_stock
      FROM public.product_variants
      WHERE id = v_variant_id
      FOR UPDATE;

      IF v_stock < v_qty THEN
        RAISE EXCEPTION 'out_of_stock:%', v_variant_id;
      END IF;

      UPDATE public.product_variants
      SET stock_quantity = stock_quantity - v_qty
      WHERE id = v_variant_id;
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    order_number, customer_id, address_snapshot, subtotal_syp,
    discount_syp, discount_code_id, loyalty_discount_syp,
    loyalty_points_used, shipping_syp, total_syp, notes, status,
    payment_status, payment_method, loyalty_points_earned
  ) VALUES (
    p_order_number, p_customer_id, p_address_snapshot, p_subtotal_syp,
    p_discount_syp, p_discount_code_id, p_loyalty_discount_syp,
    p_loyalty_points_used, p_shipping_syp, p_total_syp, p_notes, 'pending',
    'pending', 'cash_on_delivery', p_points_earned
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_type := COALESCE(v_item->>'item_type', 'variant');

    INSERT INTO public.order_items (
      order_id, variant_id, bundle_id, quantity, unit_price_syp,
      total_price_syp, product_snapshot
    ) VALUES (
      v_order_id,
      CASE WHEN v_item_type = 'variant' THEN (v_item->>'variant_id')::uuid ELSE NULL END,
      CASE WHEN v_item_type = 'bundle' THEN (v_item->>'variant_id')::uuid ELSE NULL END,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price_syp')::integer,
      (v_item->>'total_price_syp')::integer,
      v_item->'product_snapshot'
    );
  END LOOP;

  IF p_discount_code_id IS NOT NULL THEN
    UPDATE public.discount_codes
    SET used_count = used_count + 1
    WHERE id = p_discount_code_id;
  END IF;

  IF p_customer_id IS NOT NULL THEN
    IF p_points_earned > 0 THEN
      INSERT INTO public.loyalty_points_history (
        customer_id, points, type, reference_id, processed_by_id, processed_by_role
      ) VALUES (
        p_customer_id, p_points_earned, 'earned_purchase', v_order_id::text,
        p_customer_id, 'customer'
      );
      UPDATE public.customer_profiles
      SET loyalty_points = loyalty_points + p_points_earned
      WHERE id = p_customer_id;
    END IF;

    IF p_loyalty_points_used > 0 THEN
      INSERT INTO public.loyalty_points_history (
        customer_id, points, type, reference_id, processed_by_id, processed_by_role
      ) VALUES (
        p_customer_id, -p_loyalty_points_used, 'redeemed', v_order_id::text,
        p_customer_id, 'customer'
      );
      UPDATE public.customer_profiles
      SET loyalty_points = loyalty_points - p_loyalty_points_used
      WHERE id = p_customer_id;
    END IF;
  END IF;

  RETURN v_order_id;
END;
$$;
