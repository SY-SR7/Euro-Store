DROP POLICY IF EXISTS "Customer notify_me own" ON public.notify_me_subscriptions;
DROP POLICY IF EXISTS "customers_select_own_notify_me" ON public.notify_me_subscriptions;

CREATE POLICY "customers_select_own_notify_me"
  ON public.notify_me_subscriptions
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Subscriptions are created through the authenticated server endpoint after it
-- verifies that the variant is out of stock and its product is published.
REVOKE INSERT, UPDATE, DELETE ON public.notify_me_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.notify_me_subscriptions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_notify_me_pending_variant
  ON public.notify_me_subscriptions (product_variant_id)
  WHERE is_notified = FALSE;
