CREATE OR REPLACE FUNCTION public.clear_bundle_cart_after_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    DELETE FROM public.cart_bundle_items WHERE customer_id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_bundle_cart_after_order ON public.orders;
CREATE TRIGGER trg_clear_bundle_cart_after_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_bundle_cart_after_order();

REVOKE ALL ON FUNCTION public.clear_bundle_cart_after_order() FROM PUBLIC, anon, authenticated;
