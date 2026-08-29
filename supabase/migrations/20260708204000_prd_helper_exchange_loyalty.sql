CREATE OR REPLACE FUNCTION public.complete_helper_exchange(
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
  v_exchange public.exchange_requests%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_order_item public.order_items%ROWTYPE;
  v_replacement_stock INTEGER;
  v_replacement_price INTEGER;
  v_quantity INTEGER;
  v_bundle_item RECORD;
  v_earn_amount INTEGER;
  v_earn_points INTEGER;
  v_original_points_to_reverse INTEGER := 0;
  v_replacement_points_to_award INTEGER := 0;
  v_customer_balance INTEGER := 0;
BEGIN
  SELECT *
  INTO v_exchange
  FROM public.exchange_requests
  WHERE id = p_exchange_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'exchange_not_found';
  END IF;

  IF v_exchange.status::text <> 'approved' THEN
    RAISE EXCEPTION 'invalid_exchange_status';
  END IF;

  IF v_exchange.resolution_path IS DISTINCT FROM 'helper' THEN
    RAISE EXCEPTION 'not_helper_path';
  END IF;

  IF v_exchange.qr_code_used_at IS NULL THEN
    RAISE EXCEPTION 'qr_not_scanned';
  END IF;

  SELECT *
  INTO v_order_item
  FROM public.order_items
  WHERE id = v_exchange.order_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_item_not_found';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = v_exchange.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  v_quantity := GREATEST(COALESCE(v_order_item.quantity, 1), 1);

  IF v_order_item.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity + v_quantity,
        updated_at = NOW()
    WHERE id = v_order_item.variant_id;
  ELSIF v_order_item.bundle_id IS NOT NULL THEN
    FOR v_bundle_item IN
      SELECT product_variant_id, quantity
      FROM public.bundle_items
      WHERE bundle_id = v_order_item.bundle_id
    LOOP
      UPDATE public.product_variants
      SET stock_quantity = stock_quantity + (COALESCE(v_bundle_item.quantity, 1) * v_quantity),
          updated_at = NOW()
      WHERE id = v_bundle_item.product_variant_id;
    END LOOP;
  END IF;

  SELECT stock_quantity, price_syp
  INTO v_replacement_stock, v_replacement_price
  FROM public.product_variants
  WHERE id = p_replacement_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'replacement_variant_not_found';
  END IF;

  IF v_replacement_stock < v_quantity THEN
    RAISE EXCEPTION 'replacement_out_of_stock';
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - v_quantity,
      updated_at = NOW()
  WHERE id = p_replacement_variant_id;

  SELECT COALESCE(MAX(CASE WHEN key = 'loyalty_earn_amount_syp' THEN value::INTEGER END), 1000),
         COALESCE(MAX(CASE WHEN key = 'loyalty_earn_points' THEN value::INTEGER END), 10)
  INTO v_earn_amount, v_earn_points
  FROM public.system_settings
  WHERE key IN ('loyalty_earn_amount_syp', 'loyalty_earn_points');

  IF v_order.customer_id IS NOT NULL THEN
    IF COALESCE(v_order.loyalty_points_earned, 0) > 0 AND COALESCE(v_order.subtotal_syp, 0) > 0 THEN
      v_original_points_to_reverse := FLOOR(
        COALESCE(v_order.loyalty_points_earned, 0)::NUMERIC
        * (COALESCE(v_order_item.total_price_syp, 0)::NUMERIC / NULLIF(v_order.subtotal_syp, 0))
      )::INTEGER;
    END IF;

    IF v_original_points_to_reverse > 0 THEN
      SELECT loyalty_points
      INTO v_customer_balance
      FROM public.customer_profiles
      WHERE id = v_order.customer_id
      FOR UPDATE;

      v_original_points_to_reverse := LEAST(v_original_points_to_reverse, COALESCE(v_customer_balance, 0));

      IF v_original_points_to_reverse > 0 THEN
        PERFORM public.award_loyalty_points(
          v_order.customer_id,
          -v_original_points_to_reverse,
          'adjusted_admin',
          p_exchange_request_id,
          p_helper_id,
          'helper',
          'Reverted original item purchase points for exchange'
        );
      END IF;
    END IF;

    v_replacement_points_to_award := FLOOR(
      ((COALESCE(v_replacement_price, 0) * v_quantity)::NUMERIC / GREATEST(COALESCE(v_earn_amount, 1000), 1))
    )::INTEGER * COALESCE(v_earn_points, 10);

    IF v_replacement_points_to_award > 0 THEN
      PERFORM public.award_loyalty_points(
        v_order.customer_id,
        v_replacement_points_to_award,
        'earned_purchase',
        p_exchange_request_id,
        p_helper_id,
        'helper',
        'Awarded replacement item purchase points for exchange'
      );
    END IF;
  END IF;

  INSERT INTO public.exchange_status_history (
    exchange_request_id, status, changed_by_id, changed_by_role, notes
  )
  VALUES
    (p_exchange_request_id, 'item_received_by_shipping', p_helper_id, 'helper', 'Path A helper completion intermediate state'),
    (p_exchange_request_id, 'completed', p_helper_id, 'helper', 'Path A helper completion');

  UPDATE public.exchange_requests
  SET status = 'completed',
      replacement_variant_id = p_replacement_variant_id,
      processed_by_id = p_helper_id,
      processed_by_role = 'helper',
      updated_at = NOW()
  WHERE id = p_exchange_request_id
  RETURNING * INTO v_exchange;

  RETURN v_exchange;
END;
$$;
