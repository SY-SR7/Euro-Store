-- Migration: 20260702000018_place_order_atomic.sql

CREATE OR REPLACE FUNCTION place_order_atomic(
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
) RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_variant_id uuid;
  v_qty integer;
  v_stock integer;
BEGIN
  -- 1. Deduct Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    
    SELECT stock_quantity INTO v_stock
    FROM product_variants
    WHERE id = v_variant_id
    FOR UPDATE;
    
    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'out_of_stock:%', v_variant_id;
    END IF;
    
    UPDATE product_variants
    SET stock_quantity = stock_quantity - v_qty
    WHERE id = v_variant_id;
  END LOOP;
  
  -- 2. Insert Order
  INSERT INTO orders (
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
  
  -- 3. Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, variant_id, quantity, unit_price_syp, total_price_syp, product_snapshot
    ) VALUES (
      v_order_id,
      (v_item->>'variant_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price_syp')::integer,
      (v_item->>'total_price_syp')::integer,
      v_item->'product_snapshot'
    );
  END LOOP;
  
  -- 4. Increment Discount Usage
  IF p_discount_code_id IS NOT NULL THEN
    UPDATE discount_codes
    SET used_count = used_count + 1
    WHERE id = p_discount_code_id;
  END IF;
  
  -- 5. Process Loyalty Points
  IF p_customer_id IS NOT NULL THEN
    IF p_points_earned > 0 THEN
      INSERT INTO loyalty_points_history (
        customer_id, points, type, reference_id, processed_by_id, processed_by_role
      ) VALUES (
        p_customer_id, p_points_earned, 'earned_purchase', v_order_id::text, p_customer_id, 'customer'
      );
      UPDATE customer_profiles SET loyalty_points = loyalty_points + p_points_earned WHERE id = p_customer_id;
    END IF;
    IF p_loyalty_points_used > 0 THEN
      INSERT INTO loyalty_points_history (
        customer_id, points, type, reference_id, processed_by_id, processed_by_role
      ) VALUES (
        p_customer_id, -p_loyalty_points_used, 'redeemed', v_order_id::text, p_customer_id, 'customer'
      );
      UPDATE customer_profiles SET loyalty_points = loyalty_points - p_loyalty_points_used WHERE id = p_customer_id;
    END IF;
  END IF;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
