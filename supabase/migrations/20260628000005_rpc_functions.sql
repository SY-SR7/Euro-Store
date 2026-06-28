CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_customer_id UUID,
  p_points INTEGER,
  p_type loyalty_tx_type,
  p_reference_id UUID DEFAULT NULL,
  p_processed_by_id UUID DEFAULT NULL,
  p_processed_by_role user_role DEFAULT 'helper',
  p_notes TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_new_balance INTEGER;
BEGIN
  SELECT loyalty_points INTO v_new_balance FROM customer_profiles WHERE id = p_customer_id FOR UPDATE;
  v_new_balance := v_new_balance + p_points;
  IF v_new_balance < 0 THEN RAISE EXCEPTION 'INSUFFICIENT_POINTS'; END IF;
  UPDATE customer_profiles SET loyalty_points = v_new_balance, updated_at = NOW() WHERE id = p_customer_id;
  INSERT INTO loyalty_points_transactions(customer_id, type, points, balance_after, reference_id, processed_by_id, processed_by_role, notes)
  VALUES(p_customer_id, p_type, p_points, v_new_balance, p_reference_id, p_processed_by_id, p_processed_by_role, p_notes);
END;
$$;

CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_num TEXT; v_exists BOOLEAN;
BEGIN
  LOOP
    v_num := 'EUR-' || upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = v_num) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_num;
END;
$$;

CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_code TEXT; v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM customer_profiles WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION set_referral_code_on_insert() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN NEW.referral_code := generate_referral_code(); END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_referral_code
  BEFORE INSERT ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_referral_code_on_insert();
