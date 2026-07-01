-- supabase/migrations/20260701000016_checkout_race_conditions.sql

-- 1. Atomic Stock Decrement function using JSONB array of items
-- Expected format: '[{"variant_id": "...", "quantity": 2}, ...]'
CREATE OR REPLACE FUNCTION decrement_stock(p_items JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
  v_current_stock INT;
BEGIN
  -- We order by variant_id to avoid deadlocks during concurrent multi-item checkouts
  FOR v_item IN 
    SELECT value FROM jsonb_array_elements(p_items) 
    ORDER BY (value->>'variant_id')::UUID
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    -- Lock the row to prevent race conditions
    SELECT stock_quantity INTO v_current_stock 
    FROM product_variants 
    WHERE id = v_variant_id 
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'VARIANT_NOT_FOUND:%', v_variant_id;
    END IF;

    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_variant_id;
    END IF;

    -- Deduct stock safely
    UPDATE product_variants
    SET stock_quantity = stock_quantity - v_qty
    WHERE id = v_variant_id;
  END LOOP;
END;
$$;


-- 2. Atomic increment of discount code usage
CREATE OR REPLACE FUNCTION increment_discount_usage(p_discount_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- UPDATE naturally holds a row-exclusive lock in PostgreSQL, preventing race conditions.
  UPDATE discount_codes
  SET used_count = COALESCE(used_count, 0) + 1,
      updated_at = NOW()
  WHERE id = p_discount_id;
END;
$$;
