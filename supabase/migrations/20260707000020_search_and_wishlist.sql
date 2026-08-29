-- ============================================================
-- Migration 20: Phase 7 Features (Search Analytics & Wishlist Share)
-- Date: 2026-07-07
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Search Analytics
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_analytics (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  query        TEXT        NOT NULL,
  result_count INT         NOT NULL DEFAULT 0,
  customer_id  UUID        REFERENCES customer_profiles(id) ON DELETE SET NULL,
  session_id   TEXT,       -- To track anonymous users' search sessions
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Only service role (admin/API) can insert/view
CREATE POLICY "service_role_search_analytics"
  ON search_analytics FOR ALL USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────
-- 2. Public Shared Wishlist Token
-- ──────────────────────────────────────────────────────────────
ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS wishlist_share_token UUID UNIQUE DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_customer_profiles_wishlist_token
  ON customer_profiles(wishlist_share_token);

-- Update RLS for wishlist_items to allow public read if they have the token
-- Since wishlist_items doesn't have the token, we must join customer_profiles.
-- But Supabase RLS with joins can be tricky. We create a secure view or use a subquery.

-- We drop the existing "customers_select_own_wishlist" and replace it with a broader one.
DROP POLICY IF EXISTS "customers_select_own_wishlist" ON wishlist_items;

CREATE POLICY "select_wishlist_items" ON wishlist_items
  FOR SELECT USING (
    -- 1. Customer owns it
    customer_id = auth.uid()
    OR
    -- 2. They are an admin
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true)
    OR
    -- 3. We are calling it from a public API that passes the token via a custom server route.
    -- To keep RLS secure and performant, we'll actually fetch the customer_id via the token 
    -- in the Next.js API/Server Component, and use the service_role or just fetch by customer_id 
    -- directly if we bypass RLS for that specific public endpoint.
    -- So for RLS itself, we don't strictly need a public policy if the web backend handles the public route
    -- via a privileged fetch, or we can just allow public select on the table (since UUIDs are unguessable).
    -- Wait, if it's public, anyone could query all wishlist items if they knew the customer_id.
    -- We should NOT allow public access to the table itself. The web server will use service_role to fetch the public wishlist using the token.
    false
  );

-- Restore the own_wishlist select to avoid breaking existing things
CREATE POLICY "customers_select_own_wishlist" ON wishlist_items
  FOR SELECT USING (customer_id = auth.uid());
