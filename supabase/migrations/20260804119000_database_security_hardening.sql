ALTER TABLE public.discount_code_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own discount usages" ON public.discount_code_usages;
CREATE POLICY "Customers read own discount usages"
  ON public.discount_code_usages
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON TABLE public.discount_code_usages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.discount_code_usages TO authenticated;
GRANT ALL ON TABLE public.discount_code_usages TO service_role;

ALTER FUNCTION public.log_discount_code_usage()
  SET search_path = pg_catalog, public, pg_temp;
REVOKE ALL ON FUNCTION public.log_discount_code_usage() FROM PUBLIC, anon, authenticated;

-- Superseded by the service-only atomic order placement transaction.
DROP FUNCTION IF EXISTS public.decrement_stock(JSONB);
DROP FUNCTION IF EXISTS public.increment_discount_usage(UUID);

REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;
