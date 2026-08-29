-- ============================================================
-- Migration 19: Missing tables & columns for full feature set
-- Date: 2026-07-07
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. exchange_requests — أعمدة ناقصة
-- ──────────────────────────────────────────────────────────────
ALTER TABLE exchange_requests
  ADD COLUMN IF NOT EXISTS reason           TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS resolution_path  TEXT CHECK (resolution_path IN ('helper', 'partner')),
  ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT;

-- نسخ reason من reason_ar إن كان فارغاً (backward compat)
UPDATE exchange_requests
  SET reason = COALESCE(reason, reason_ar)
  WHERE reason IS NULL AND reason_ar IS NOT NULL;

-- تأكد أن exchange_status يشمل الحالات الجديدة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'item_received_by_shipping'
    AND enumtypid = 'exchange_status'::regtype
  ) THEN
    ALTER TYPE exchange_status ADD VALUE 'item_received_by_shipping';
  END IF;
END$$;

-- ──────────────────────────────────────────────────────────────
-- 2. customer_profiles — أعمدة ناقصة
-- ──────────────────────────────────────────────────────────────
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- ──────────────────────────────────────────────────────────────
-- 3. product_helper_requests — جدول جديد
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_helper_requests (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id               UUID        NOT NULL REFERENCES helper_profiles(id) ON DELETE CASCADE,
  product_name_ar         TEXT        NOT NULL,
  product_name_en         TEXT,
  description             TEXT,
  suggested_category_id   UUID        REFERENCES categories(id),
  image_urls              TEXT[]      DEFAULT '{}',
  status                  TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes             TEXT,
  reviewed_by             UUID        REFERENCES admin_profiles(id),
  reviewed_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_helper_requests ENABLE ROW LEVEL SECURITY;

-- Helpers يقرأون طلباتهم فقط
CREATE POLICY "helpers_own_product_requests"
  ON product_helper_requests
  FOR SELECT
  USING (helper_id = auth.uid());

-- Helpers يُنشئون
CREATE POLICY "helpers_insert_product_requests"
  ON product_helper_requests
  FOR INSERT
  WITH CHECK (helper_id = auth.uid());

-- Service role يملك كل شيء (admin uses service role)
CREATE POLICY "service_role_product_requests"
  ON product_helper_requests
  FOR ALL
  USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────
-- 4. award_loyalty_points — تحديث الـ RPC لدعم نوع redeemed_offline
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_customer_id  UUID,
  p_points       INT,         -- سالب = خصم
  p_type         TEXT,        -- loyalty_tx_type value
  p_description  TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current INT;
  v_new     INT;
BEGIN
  -- SELECT FOR UPDATE لمنع race conditions
  SELECT loyalty_points INTO v_current
  FROM customer_profiles
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  v_new := v_current + p_points;

  IF v_new < 0 THEN
    RAISE EXCEPTION 'Insufficient loyalty points. Current: %, Requested: %', v_current, ABS(p_points);
  END IF;

  UPDATE customer_profiles
  SET loyalty_points = v_new, updated_at = NOW()
  WHERE id = p_customer_id;

  INSERT INTO loyalty_points_transactions (
    customer_id, type, points, balance_after, reference_id, notes
  ) VALUES (
    p_customer_id,
    p_type::loyalty_tx_type,
    p_points,
    v_new,
    p_reference_id,
    p_description
  );
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 5. helper_profiles — إضافة sort_order لاحتمال التوسع
-- ──────────────────────────────────────────────────────────────
ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ──────────────────────────────────────────────────────────────
-- 6. loyalty_tx_type — إضافة قيم جديدة للاستخدام من الـ helper
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'redeemed_offline'
    AND enumtypid = 'loyalty_tx_type'::regtype
  ) THEN
    ALTER TYPE loyalty_tx_type ADD VALUE 'redeemed_offline';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'earned_offline'
    AND enumtypid = 'loyalty_tx_type'::regtype
  ) THEN
    ALTER TYPE loyalty_tx_type ADD VALUE 'earned_offline';
  END IF;
END$$;

-- ──────────────────────────────────────────────────────────────
-- 7. Index على product_helper_requests
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_helper_requests_helper_id
  ON product_helper_requests (helper_id);

CREATE INDEX IF NOT EXISTS idx_product_helper_requests_status
  ON product_helper_requests (status);

CREATE INDEX IF NOT EXISTS idx_exchange_requests_partner_id
  ON exchange_requests (partner_id)
  WHERE partner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exchange_requests_status
  ON exchange_requests (status);
