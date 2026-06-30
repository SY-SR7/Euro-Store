-- Adds Wishlist (PRD 6.13) and Product Reviews (PRD 6.2.9 / 6.15.3) — both were
-- listed as "Still open" in Session 046 of _handoff/PROGRESS.md: no DB table,
-- no API, no UI existed anywhere for either feature.
--
-- Design notes / deviations from the PRD's early schema draft (kept intentional
-- and documented, matching the same pattern used by 20260630000012_customer_blocking.sql):
--
--   * wishlist_items references products(id) directly, NOT product_variants(id)
--     as the PRD draft schema suggested. The live product grid/cards only carry
--     product-level data (no variant context in listing views), and a per-product
--     wishlist is the standard, simpler UX. "Out of stock" display (PRD 6.13) is
--     computed at read time from the product's variants, not stored.
--
--   * product_reviews.order_id references orders(id) (UUID FK), not a bare
--     order_number string — consistent with every other FK in the live schema.

CREATE TABLE IF NOT EXISTS wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_customer ON wishlist_items (customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product  ON wishlist_items (product_id);

CREATE TABLE IF NOT EXISTS product_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by  UUID REFERENCES admin_profiles(id),
  moderated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews (product_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_product_reviews_status  ON product_reviews (status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer ON product_reviews (customer_id);

ALTER TABLE wishlist_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews  ENABLE ROW LEVEL SECURITY;

-- wishlist_items: customer manages only their own rows. No public/anon access —
-- wishlist is private by default per PRD 6.13 ("Private by default").
CREATE POLICY "customers_select_own_wishlist" ON wishlist_items FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "customers_insert_own_wishlist" ON wishlist_items FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "customers_delete_own_wishlist" ON wishlist_items FOR DELETE USING (customer_id = auth.uid());
CREATE POLICY "admins_all_wishlist" ON wishlist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true)
);

-- product_reviews: public can read only approved reviews (PRD 6.2.9 — "Only
-- approved reviews visible to customers"). Customers can read/insert their own
-- (any status, so they see their own pending/rejected reviews). Admins manage all.
CREATE POLICY "public_select_approved_reviews" ON product_reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "customers_select_own_reviews" ON product_reviews FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "customers_insert_own_reviews" ON product_reviews FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "admins_all_reviews" ON product_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true)
);

COMMENT ON TABLE wishlist_items IS 'Customer wishlist (PRD 6.13). One row per customer+product. Private by default; sharing is read-only via a future share_token if implemented.';
COMMENT ON TABLE product_reviews IS 'Product reviews (PRD 6.2.9). One review per product per order. Starts pending; only admin-approved reviews are publicly visible.';
