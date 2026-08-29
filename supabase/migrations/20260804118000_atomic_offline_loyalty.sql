CREATE TABLE IF NOT EXISTS public.offline_loyalty_operations (
  id UUID PRIMARY KEY,
  helper_id UUID NOT NULL REFERENCES public.helper_profiles(id),
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('earn', 'redeem')),
  invoice_amount_syp INTEGER NOT NULL CHECK (invoice_amount_syp > 0),
  points INTEGER NOT NULL CHECK (points > 0),
  syp_value INTEGER NOT NULL DEFAULT 0 CHECK (syp_value >= 0),
  balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offline_loyalty_operations_customer_created_idx
  ON public.offline_loyalty_operations(customer_id, created_at DESC);

ALTER TABLE public.offline_loyalty_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.offline_loyalty_operations FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.offline_loyalty_operations TO service_role;

ALTER FUNCTION public.award_loyalty_points(
  UUID, INTEGER, public.loyalty_tx_type, UUID, UUID, public.user_role, TEXT, TEXT
) SET search_path = pg_catalog, public, pg_temp;
REVOKE ALL ON FUNCTION public.award_loyalty_points(
  UUID, INTEGER, public.loyalty_tx_type, UUID, UUID, public.user_role, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_loyalty_points(
  UUID, INTEGER, public.loyalty_tx_type, UUID, UUID, public.user_role, TEXT, TEXT
) TO service_role;

CREATE OR REPLACE FUNCTION public.process_offline_loyalty_atomic(
  p_operation_id UUID,
  p_customer_id UUID,
  p_helper_id UUID,
  p_operation_type TEXT,
  p_invoice_amount_syp INTEGER,
  p_requested_points INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_existing public.offline_loyalty_operations%ROWTYPE;
  v_customer public.customer_profiles%ROWTYPE;
  v_earn_amount INTEGER := 1000;
  v_earn_points INTEGER := 10;
  v_point_value INTEGER := 10;
  v_min_redemption INTEGER := 100;
  v_max_redemption_pct INTEGER := 30;
  v_points INTEGER;
  v_syp_value INTEGER := 0;
  v_balance_after INTEGER;
BEGIN
  IF p_operation_id IS NULL OR p_customer_id IS NULL OR p_helper_id IS NULL
     OR p_operation_type NOT IN ('earn', 'redeem')
     OR p_invoice_amount_syp IS NULL OR p_invoice_amount_syp <= 0 THEN
    RAISE EXCEPTION 'invalid_offline_loyalty_request';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::TEXT, 0));

  SELECT * INTO v_existing
  FROM public.offline_loyalty_operations
  WHERE id = p_operation_id;

  IF FOUND THEN
    IF v_existing.customer_id IS DISTINCT FROM p_customer_id
       OR v_existing.helper_id IS DISTINCT FROM p_helper_id
       OR v_existing.operation_type IS DISTINCT FROM p_operation_type
       OR v_existing.invoice_amount_syp IS DISTINCT FROM p_invoice_amount_syp
       OR (p_operation_type = 'redeem' AND v_existing.points IS DISTINCT FROM p_requested_points) THEN
      RAISE EXCEPTION 'idempotency_key_reused';
    END IF;

    RETURN jsonb_build_object(
      'operation_id', v_existing.id,
      'operation_type', v_existing.operation_type,
      'points', v_existing.points,
      'syp_value', v_existing.syp_value,
      'balance_after', v_existing.balance_after,
      'replayed', TRUE
    );
  END IF;

  PERFORM 1
  FROM public.helper_profiles
  WHERE id = p_helper_id AND is_active = TRUE
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'helper_not_active';
  END IF;

  SELECT * INTO v_customer
  FROM public.customer_profiles
  WHERE id = p_customer_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'customer_not_found';
  END IF;
  IF v_customer.is_blocked THEN
    RAISE EXCEPTION 'customer_blocked';
  END IF;

  SELECT
    COALESCE(MAX(CASE WHEN key = 'loyalty_earn_amount_syp' AND value ~ '^[1-9][0-9]*$' THEN value::INTEGER END), 1000),
    COALESCE(MAX(CASE WHEN key = 'loyalty_earn_points' AND value ~ '^[1-9][0-9]*$' THEN value::INTEGER END), 10),
    COALESCE(MAX(CASE WHEN key = 'loyalty_point_value_syp' AND value ~ '^[1-9][0-9]*$' THEN value::INTEGER END), 10),
    COALESCE(MAX(CASE WHEN key = 'loyalty_min_redemption_pts' AND value ~ '^[1-9][0-9]*$' THEN value::INTEGER END), 100),
    COALESCE(MAX(CASE WHEN key = 'loyalty_max_redemption_pct' AND value ~ '^[1-9][0-9]*$' THEN value::INTEGER END), 30)
  INTO v_earn_amount, v_earn_points, v_point_value, v_min_redemption, v_max_redemption_pct
  FROM public.system_settings
  WHERE key IN (
    'loyalty_earn_amount_syp', 'loyalty_earn_points', 'loyalty_point_value_syp',
    'loyalty_min_redemption_pts', 'loyalty_max_redemption_pct'
  );

  v_max_redemption_pct := LEAST(v_max_redemption_pct, 100);

  IF p_operation_type = 'earn' THEN
    v_points := FLOOR(p_invoice_amount_syp::NUMERIC / v_earn_amount)::INTEGER * v_earn_points;
    IF v_points <= 0 THEN
      RAISE EXCEPTION 'invoice_too_small';
    END IF;
  ELSE
    IF p_requested_points IS NULL OR p_requested_points <= 0 THEN
      RAISE EXCEPTION 'invalid_redemption_points';
    END IF;
    IF p_requested_points < v_min_redemption THEN
      RAISE EXCEPTION 'below_minimum_redemption';
    END IF;
    IF p_requested_points > v_customer.loyalty_points THEN
      RAISE EXCEPTION 'insufficient_points';
    END IF;

    v_points := p_requested_points;
    v_syp_value := v_points * v_point_value;
    IF v_syp_value > FLOOR(p_invoice_amount_syp::NUMERIC * v_max_redemption_pct / 100)::INTEGER THEN
      RAISE EXCEPTION 'redemption_percentage_exceeded';
    END IF;
  END IF;

  PERFORM public.award_loyalty_points(
    p_customer_id,
    CASE WHEN p_operation_type = 'earn' THEN v_points ELSE -v_points END,
    CASE WHEN p_operation_type = 'earn' THEN 'earned_offline' ELSE 'redeemed_offline' END::public.loyalty_tx_type,
    p_operation_id,
    p_helper_id,
    'helper'::public.user_role,
    CASE
      WHEN p_operation_type = 'earn' THEN 'Offline purchase loyalty award'
      ELSE 'Offline purchase loyalty redemption'
    END
  );

  v_balance_after := v_customer.loyalty_points
    + CASE WHEN p_operation_type = 'earn' THEN v_points ELSE -v_points END;

  INSERT INTO public.offline_loyalty_operations (
    id, helper_id, customer_id, operation_type, invoice_amount_syp,
    points, syp_value, balance_before, balance_after
  ) VALUES (
    p_operation_id, p_helper_id, p_customer_id, p_operation_type, p_invoice_amount_syp,
    v_points, v_syp_value, v_customer.loyalty_points, v_balance_after
  );

  INSERT INTO public.audit_logs (
    actor_id, actor_role, action, entity_type, entity_id, before_state, after_state
  ) VALUES (
    p_helper_id,
    'helper',
    CASE WHEN p_operation_type = 'earn' THEN 'loyalty.earn.offline' ELSE 'loyalty.redeem.offline' END,
    'customer_profiles',
    p_customer_id,
    jsonb_build_object('loyalty_points', v_customer.loyalty_points),
    jsonb_build_object(
      'operation_id', p_operation_id,
      'points', v_points,
      'syp_value', v_syp_value,
      'invoice_amount', p_invoice_amount_syp,
      'loyalty_points', v_balance_after
    )
  );

  RETURN jsonb_build_object(
    'operation_id', p_operation_id,
    'operation_type', p_operation_type,
    'points', v_points,
    'syp_value', v_syp_value,
    'balance_after', v_balance_after,
    'replayed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_offline_loyalty_atomic(UUID, UUID, UUID, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_offline_loyalty_atomic(UUID, UUID, UUID, TEXT, INTEGER, INTEGER)
  TO service_role;
