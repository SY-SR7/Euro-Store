-- PRD §6.9.3 and §6.9.6: exchange status history and atomic helper completion.

CREATE TABLE IF NOT EXISTS public.exchange_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by_id UUID,
  changed_by_role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.exchange_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read exchange_status_history" ON public.exchange_status_history;
CREATE POLICY "Admins read exchange_status_history"
  ON public.exchange_status_history
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Helpers read exchange_status_history" ON public.exchange_status_history;
CREATE POLICY "Helpers read exchange_status_history"
  ON public.exchange_status_history
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.helper_profiles WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "Partners read assigned exchange_status_history" ON public.exchange_status_history;
CREATE POLICY "Partners read assigned exchange_status_history"
  ON public.exchange_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.exchange_requests er
      WHERE er.id = exchange_status_history.exchange_request_id
        AND er.partner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_exchange_status_history_request
  ON public.exchange_status_history(exchange_request_id, created_at DESC);

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
  v_order_item public.order_items%ROWTYPE;
  v_replacement_stock INTEGER;
  v_quantity INTEGER;
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

  v_quantity := GREATEST(COALESCE(v_order_item.quantity, 1), 1);

  IF v_order_item.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity + v_quantity,
        updated_at = NOW()
    WHERE id = v_order_item.variant_id;
  END IF;

  SELECT stock_quantity
  INTO v_replacement_stock
  FROM public.product_variants
  WHERE id = p_replacement_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'replacement_variant_not_found';
  END IF;

  IF v_replacement_stock < 1 THEN
    RAISE EXCEPTION 'replacement_out_of_stock';
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - 1,
      updated_at = NOW()
  WHERE id = p_replacement_variant_id;

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
