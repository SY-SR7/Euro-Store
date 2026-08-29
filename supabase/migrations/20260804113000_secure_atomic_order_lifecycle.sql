CREATE OR REPLACE FUNCTION public.place_order_secure_atomic(
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
  p_idempotency_key TEXT,
  p_payment_method TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
  v_used_count INTEGER;
  v_max_uses INTEGER;
  v_max_per_user INTEGER;
  v_user_uses INTEGER;
BEGIN
  IF p_customer_id IS NULL
     OR p_payment_method NOT IN ('cash_on_delivery', 'sham_cash')
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100
     OR p_subtotal_syp < 0 OR p_discount_syp < 0 OR p_loyalty_discount_syp < 0
     OR p_loyalty_points_used < 0 OR p_shipping_syp < 0 OR p_total_syp < 0 THEN
    RAISE EXCEPTION 'invalid_order';
  END IF;

  IF p_discount_code_id IS NOT NULL THEN
    SELECT used_count, max_uses, max_uses_per_user
    INTO v_used_count, v_max_uses, v_max_per_user
    FROM public.discount_codes
    WHERE id = p_discount_code_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND OR (v_max_uses IS NOT NULL AND v_used_count >= v_max_uses) THEN
      RAISE EXCEPTION 'discount_usage_limit_reached';
    END IF;

    IF v_max_per_user IS NOT NULL AND v_max_per_user > 0 THEN
      SELECT COUNT(*) INTO v_user_uses
      FROM public.discount_code_usages
      WHERE discount_code_id = p_discount_code_id AND customer_id = p_customer_id;
      IF v_user_uses >= v_max_per_user THEN
        RAISE EXCEPTION 'discount_user_usage_limit_reached';
      END IF;
    END IF;
  END IF;

  v_order_id := public.place_order_atomic(
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
    p_items,
    p_points_earned,
    p_idempotency_key
  );

  UPDATE public.orders
  SET payment_method = p_payment_method::public.payment_method,
      updated_at = NOW()
  WHERE id = v_order_id AND customer_id = p_customer_id;

  DELETE FROM public.cart_items WHERE customer_id = p_customer_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_atomic(TEXT, UUID, JSONB, INTEGER, INTEGER, UUID, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, JSONB, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_atomic(TEXT, UUID, JSONB, INTEGER, INTEGER, UUID, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, JSONB, INTEGER, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.place_order_secure_atomic(TEXT, UUID, JSONB, INTEGER, INTEGER, UUID, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, JSONB, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_secure_atomic(TEXT, UUID, JSONB, INTEGER, INTEGER, UUID, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, JSONB, INTEGER, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.terminate_order_atomic(
  p_order_id UUID,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_target_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_updated public.orders;
  v_deleted_usages INTEGER := 0;
  v_earned_points INTEGER := 0;
  v_current_balance INTEGER := 0;
BEGIN
  IF p_actor_role NOT IN ('customer', 'admin', 'sub_admin', 'helper')
     OR p_target_status NOT IN ('cancelled', 'rejected')
     OR (p_target_status = 'rejected' AND CHAR_LENGTH(BTRIM(COALESCE(p_reason, ''))) < 3) THEN
    RAISE EXCEPTION 'invalid_termination_request';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  IF p_actor_role = 'customer' THEN
    IF v_order.customer_id <> p_actor_id OR v_order.status <> 'pending' OR p_target_status <> 'cancelled' THEN
      RAISE EXCEPTION 'forbidden_order_transition';
    END IF;
  ELSIF p_actor_role IN ('admin', 'sub_admin') THEN
    IF v_order.status NOT IN ('pending', 'confirmed', 'processing') THEN
      RAISE EXCEPTION 'forbidden_order_transition';
    END IF;
  ELSIF p_actor_role = 'helper' THEN
    IF p_target_status <> 'rejected' OR v_order.status NOT IN ('pending', 'confirmed', 'processing') THEN
      RAISE EXCEPTION 'forbidden_order_transition';
    END IF;
  END IF;

  IF v_order.payment_method = 'sham_cash' AND v_order.payment_status = 'paid' THEN
    RAISE EXCEPTION 'refund_required';
  END IF;

  UPDATE public.product_variants pv
  SET stock_quantity = pv.stock_quantity + restored.quantity,
      updated_at = NOW()
  FROM (
    SELECT oi.variant_id, SUM(oi.quantity)::INTEGER AS quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id AND oi.variant_id IS NOT NULL
    GROUP BY oi.variant_id
  ) restored
  WHERE pv.id = restored.variant_id;

  UPDATE public.product_variants pv
  SET stock_quantity = pv.stock_quantity + restored.quantity,
      updated_at = NOW()
  FROM (
    SELECT bi.product_variant_id, SUM(bi.quantity * oi.quantity)::INTEGER AS quantity
    FROM public.order_items oi
    JOIN public.bundle_items bi ON bi.bundle_id = oi.bundle_id
    WHERE oi.order_id = p_order_id AND oi.bundle_id IS NOT NULL
    GROUP BY bi.product_variant_id
  ) restored
  WHERE pv.id = restored.product_variant_id;

  IF v_order.customer_id IS NOT NULL AND COALESCE(v_order.loyalty_points_used, 0) > 0 THEN
    PERFORM public.award_loyalty_points(
      v_order.customer_id, v_order.loyalty_points_used, 'adjusted_admin', v_order.id,
      p_actor_id, p_actor_role::public.user_role, 'Restored points after order termination'
    );
  END IF;

  IF v_order.customer_id IS NOT NULL THEN
    SELECT COALESCE(SUM(points), 0) INTO v_earned_points
    FROM public.loyalty_points_transactions
    WHERE customer_id = v_order.customer_id AND reference_id = v_order.id
      AND type = 'earned_purchase' AND points > 0;

    IF v_earned_points > 0 THEN
      SELECT loyalty_points INTO v_current_balance
      FROM public.customer_profiles WHERE id = v_order.customer_id FOR UPDATE;
      IF v_current_balance > 0 THEN
        PERFORM public.award_loyalty_points(
          v_order.customer_id, -LEAST(v_current_balance, v_earned_points), 'adjusted_admin', v_order.id,
          p_actor_id, p_actor_role::public.user_role, 'Reverted earned points after order termination'
        );
      END IF;
    END IF;
  END IF;

  DELETE FROM public.discount_code_usages WHERE order_id = v_order.id;
  GET DIAGNOSTICS v_deleted_usages = ROW_COUNT;
  IF v_deleted_usages > 0 AND v_order.discount_code_id IS NOT NULL THEN
    UPDATE public.discount_codes
    SET used_count = GREATEST(0, used_count - 1)
    WHERE id = v_order.discount_code_id;
  END IF;

  UPDATE public.orders
  SET status = p_target_status::public.order_status,
      rejected_reason = CASE WHEN p_target_status = 'rejected' THEN BTRIM(p_reason) ELSE rejected_reason END,
      cancellation_reason = CASE WHEN p_target_status = 'cancelled' THEN COALESCE(NULLIF(BTRIM(p_reason), ''), 'cancelled') ELSE cancellation_reason END,
      cancelled_by_id = CASE WHEN p_target_status = 'cancelled' THEN p_actor_id ELSE cancelled_by_id END,
      cancelled_by_role = CASE WHEN p_target_status = 'cancelled' THEN p_actor_role::public.user_role ELSE cancelled_by_role END,
      updated_at = NOW()
  WHERE id = v_order.id
  RETURNING * INTO v_updated;

  INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by_id, changed_by_role, notes)
  VALUES (v_order.id, v_order.status, p_target_status::public.order_status, p_actor_id, p_actor_role::public.user_role, NULLIF(BTRIM(COALESCE(p_reason, '')), ''));

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, before_state, after_state)
  VALUES (
    p_actor_id, p_actor_role::public.user_role, 'order.' || p_target_status, 'orders', v_order.id,
    jsonb_build_object('status', v_order.status),
    jsonb_build_object('status', p_target_status, 'reason', NULLIF(BTRIM(COALESCE(p_reason, '')), ''))
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.terminate_order_atomic(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.terminate_order_atomic(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
