CREATE OR REPLACE FUNCTION public.replace_sub_admin_permissions(
  p_sub_admin_id UUID,
  p_permissions JSONB,
  p_granted_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_allowed_modules CONSTANT TEXT[] := ARRAY[
    'dashboard', 'product_management', 'category_management', 'brand_management',
    'collection_management', 'bundle_management', 'order_management',
    'exchange_management', 'customer_management', 'discount_code_management',
    'loyalty_system_config', 'shipping_configuration', 'homepage_management',
    'reports', 'system_settings', 'audit_log', 'sub_admins', 'helper_management',
    'partner_management'
  ];
  v_count INTEGER;
  v_distinct_count INTEGER;
  v_invalid_count INTEGER;
  v_result JSONB;
BEGIN
  IF p_sub_admin_id IS NULL OR p_granted_by IS NULL OR jsonb_typeof(p_permissions) <> 'array'
     OR jsonb_array_length(p_permissions) > cardinality(v_allowed_modules)
     OR NOT EXISTS (SELECT 1 FROM public.sub_admin_profiles WHERE id = p_sub_admin_id) THEN
    RAISE EXCEPTION 'invalid_permissions';
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT permission.module), COUNT(*) FILTER (
    WHERE permission.module <> ALL(v_allowed_modules)
       OR permission.permission_level NOT IN ('view_only', 'edit', 'full_access')
  )
  INTO v_count, v_distinct_count, v_invalid_count
  FROM jsonb_to_recordset(p_permissions) AS permission(module TEXT, permission_level TEXT);

  IF v_count <> v_distinct_count OR v_invalid_count > 0 THEN
    RAISE EXCEPTION 'invalid_permissions';
  END IF;

  DELETE FROM public.sub_admin_permissions WHERE sub_admin_id = p_sub_admin_id;

  INSERT INTO public.sub_admin_permissions (sub_admin_id, module, permission_level, granted_by)
  SELECT p_sub_admin_id, permission.module, permission.permission_level::public.permission_level, p_granted_by
  FROM jsonb_to_recordset(p_permissions) AS permission(module TEXT, permission_level TEXT);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'module', sap.module,
    'permission_level', sap.permission_level
  ) ORDER BY sap.module), '[]'::JSONB)
  INTO v_result
  FROM public.sub_admin_permissions sap
  WHERE sap.sub_admin_id = p_sub_admin_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_sub_admin_permissions(UUID, JSONB, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_sub_admin_permissions(UUID, JSONB, UUID) TO service_role;

CREATE SEQUENCE IF NOT EXISTS public.order_number_sequence START WITH 1 INCREMENT BY 1;

DO $$
DECLARE
  v_max BIGINT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(order_number FROM '^EUR-([0-9]{8})$')::BIGINT), 0)
  INTO v_max
  FROM public.orders
  WHERE order_number ~ '^EUR-[0-9]{8}$';

  PERFORM setval('public.order_number_sequence', GREATEST(v_max, 1), v_max > 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  RETURN 'EUR-' || LPAD(nextval('public.order_number_sequence')::TEXT, 8, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO authenticated, service_role;
