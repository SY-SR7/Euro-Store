CREATE OR REPLACE FUNCTION public.transition_order_atomic(
  p_order_id UUID,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_target_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_order public.orders;
  v_updated public.orders;
  v_referral public.referrals;
  v_bonus_points INTEGER := 50;
  v_has_prior_order BOOLEAN := FALSE;
BEGIN
  IF p_actor_role NOT IN ('admin', 'sub_admin', 'helper')
     OR p_target_status NOT IN ('confirmed', 'processing', 'picked_up', 'shipped', 'delivered', 'completed')
     OR p_actor_id IS NULL THEN
    RAISE EXCEPTION 'invalid_transition_request';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.status::TEXT = p_target_status THEN RETURN v_order; END IF;

  IF NOT (
    (v_order.status = 'pending' AND p_target_status = 'confirmed') OR
    (v_order.status = 'confirmed' AND p_target_status = 'processing') OR
    (v_order.status = 'processing' AND p_target_status = 'picked_up') OR
    (v_order.status = 'picked_up' AND p_target_status = 'shipped') OR
    (v_order.status = 'shipped' AND p_target_status = 'delivered') OR
    (v_order.status = 'delivered' AND p_target_status = 'completed')
  ) THEN
    RAISE EXCEPTION 'forbidden_order_transition';
  END IF;

  UPDATE public.orders
  SET status = p_target_status::public.order_status,
      updated_at = NOW()
  WHERE id = v_order.id
  RETURNING * INTO v_updated;

  INSERT INTO public.order_status_history (
    order_id, from_status, to_status, changed_by_id, changed_by_role, notes
  ) VALUES (
    v_order.id, v_order.status, p_target_status::public.order_status,
    p_actor_id, p_actor_role::public.user_role, NULLIF(BTRIM(COALESCE(p_notes, '')), '')
  );

  IF p_target_status = 'confirmed' AND v_order.customer_id IS NOT NULL THEN
    IF COALESCE(v_order.loyalty_points_earned, 0) > 0 AND NOT EXISTS (
      SELECT 1 FROM public.loyalty_points_transactions
      WHERE customer_id = v_order.customer_id AND reference_id = v_order.id AND type = 'earned_purchase'
    ) THEN
      PERFORM public.award_loyalty_points(
        v_order.customer_id, v_order.loyalty_points_earned, 'earned_purchase', v_order.id,
        p_actor_id, p_actor_role::public.user_role,
        'Purchase points for order ' || v_order.order_number
      );
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.orders
      WHERE customer_id = v_order.customer_id AND id <> v_order.id
        AND status IN ('confirmed', 'processing', 'picked_up', 'shipped', 'delivered', 'completed')
    ) INTO v_has_prior_order;

    IF NOT v_has_prior_order THEN
      SELECT * INTO v_referral
      FROM public.referrals
      WHERE referred_id = v_order.customer_id AND status = 'pending'
      FOR UPDATE;

      IF FOUND THEN
        SELECT CASE WHEN value ~ '^[0-9]+$' THEN value::INTEGER ELSE 50 END
        INTO v_bonus_points
        FROM public.system_settings
        WHERE key = 'referral_bonus_points';
        v_bonus_points := COALESCE(v_bonus_points, 50);

        IF v_bonus_points > 0 AND NOT EXISTS (
          SELECT 1 FROM public.loyalty_points_transactions
          WHERE customer_id = v_referral.referrer_id AND reference_id = v_order.id AND type = 'earned_referral'
        ) THEN
          PERFORM public.award_loyalty_points(
            v_referral.referrer_id, v_bonus_points, 'earned_referral', v_order.id,
            p_actor_id, p_actor_role::public.user_role,
            'Referral reward for order ' || v_order.order_number
          );
        END IF;

        UPDATE public.referrals
        SET status = 'completed', points_awarded = v_bonus_points, completed_at = NOW()
        WHERE id = v_referral.id;
      END IF;
    END IF;
  END IF;

  IF p_target_status = 'delivered' THEN
    UPDATE public.orders
    SET status = 'completed', updated_at = NOW()
    WHERE id = v_order.id
    RETURNING * INTO v_updated;

    INSERT INTO public.order_status_history (
      order_id, from_status, to_status, changed_by_id, changed_by_role, notes
    ) VALUES (
      v_order.id, 'delivered', 'completed', p_actor_id, 'system', 'auto_completed_after_delivery'
    );
  END IF;

  INSERT INTO public.audit_logs (
    actor_id, actor_role, action, entity_type, entity_id, before_state, after_state
  ) VALUES (
    p_actor_id, p_actor_role::public.user_role, 'order.status_updated', 'orders', v_order.id,
    jsonb_build_object('status', v_order.status),
    jsonb_build_object('requested_status', p_target_status, 'final_status', v_updated.status)
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_order_atomic(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order_atomic(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
