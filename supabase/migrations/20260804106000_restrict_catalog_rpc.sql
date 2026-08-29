REVOKE ALL ON FUNCTION public.catalog_search_with_facets(
  UUID[], UUID[], JSONB, BIGINT, BIGINT, NUMERIC, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.catalog_search_with_facets(
  UUID[], UUID[], JSONB, BIGINT, BIGINT, NUMERIC, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER
) TO service_role;

ALTER FUNCTION public.catalog_search_with_facets(
  UUID[], UUID[], JSONB, BIGINT, BIGINT, NUMERIC, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER
) SET search_path TO pg_catalog, public, pg_temp;
