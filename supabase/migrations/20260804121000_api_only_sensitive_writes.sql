-- Customer profiles are created by the registration RPC. Customers may only
-- edit non-financial profile fields through their authenticated API session.
DROP POLICY IF EXISTS "customers_insert_own_profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "customers_update_own" ON public.customer_profiles;
CREATE POLICY "customers_update_safe_profile_fields"
  ON public.customer_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON TABLE public.customer_profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone, avatar_url, preferred_language, gender)
  ON TABLE public.customer_profiles TO authenticated;
GRANT SELECT ON TABLE public.customer_profiles TO authenticated;

-- Orders must only be created or changed by the atomic service-role RPCs.
DROP POLICY IF EXISTS "customers_insert_own_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_helpers_all_orders" ON public.orders;
DROP POLICY IF EXISTS "active_helpers_select_orders" ON public.orders;
CREATE POLICY "active_helpers_select_orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.helper_profiles
    WHERE id = auth.uid() AND is_active = TRUE
  ));
REVOKE INSERT, UPDATE, DELETE ON TABLE public.orders FROM anon, authenticated;

-- Review eligibility and moderation are enforced by the server endpoint.
DROP POLICY IF EXISTS "customers_insert_own_reviews" ON public.product_reviews;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.product_reviews FROM anon, authenticated;

-- Helpers submit requests through the validated endpoint and cannot edit their
-- own status or admin notes directly.
DROP POLICY IF EXISTS "Helper own product requests" ON public.product_helper_requests;
DROP POLICY IF EXISTS "helpers_own_product_requests" ON public.product_helper_requests;
DROP POLICY IF EXISTS "helpers_insert_product_requests" ON public.product_helper_requests;
DROP POLICY IF EXISTS "active_helpers_select_own_product_requests" ON public.product_helper_requests;
CREATE POLICY "active_helpers_select_own_product_requests"
  ON public.product_helper_requests
  FOR SELECT
  TO authenticated
  USING (
    helper_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.helper_profiles
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );
REVOKE INSERT, UPDATE, DELETE ON TABLE public.product_helper_requests FROM anon, authenticated;

-- Search analytics are rate-limited and normalized by the web API.
DROP POLICY IF EXISTS "Public can insert search analytics" ON public.search_analytics;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.search_analytics FROM PUBLIC, anon, authenticated;

-- Exchange state changes are only performed by atomic RPCs. Direct users keep
-- least-privilege read access to their own operational queue.
DROP POLICY IF EXISTS "Partners view assigned exchange_requests" ON public.exchange_requests;
DROP POLICY IF EXISTS "Partners update assigned exchange_requests" ON public.exchange_requests;
DROP POLICY IF EXISTS "customers_select_own_exchange_requests" ON public.exchange_requests;
DROP POLICY IF EXISTS "active_helpers_select_exchange_requests" ON public.exchange_requests;
DROP POLICY IF EXISTS "active_partners_select_assigned_exchange_requests" ON public.exchange_requests;

CREATE POLICY "customers_select_own_exchange_requests"
  ON public.exchange_requests
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "active_helpers_select_exchange_requests"
  ON public.exchange_requests
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.helper_profiles
    WHERE id = auth.uid() AND is_active = TRUE
  ));

CREATE POLICY "active_partners_select_assigned_exchange_requests"
  ON public.exchange_requests
  FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    AND resolution_path = 'partner'
    AND EXISTS (
      SELECT 1 FROM public.partner_profiles
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

REVOKE INSERT, UPDATE, DELETE ON TABLE public.exchange_requests FROM anon, authenticated;
