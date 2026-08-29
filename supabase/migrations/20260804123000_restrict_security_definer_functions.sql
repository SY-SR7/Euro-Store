ALTER FUNCTION public.complete_helper_exchange(UUID, UUID, UUID)
  SET search_path = pg_catalog, public, pg_temp;
REVOKE ALL ON FUNCTION public.complete_helper_exchange(UUID, UUID, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_helper_exchange(UUID, UUID, UUID)
  TO service_role;

ALTER FUNCTION public.audit_table_change()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.resolve_audit_actor_role(UUID)
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.notify_admins_on_low_stock()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.update_product_search_vector()
  SET search_path = pg_catalog, public, pg_temp;

REVOKE ALL ON FUNCTION public.audit_table_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resolve_audit_actor_role(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_on_low_stock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_product_search_vector() FROM PUBLIC, anon, authenticated;
