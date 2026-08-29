-- PRD §10.8: audit financial, admin, helper, partner, and system operations.
-- Depends on 20260707213900_add_system_user_role.sql.

CREATE OR REPLACE FUNCTION public.resolve_audit_actor_role(p_actor_id UUID)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_actor_id IS NULL THEN
    RETURN 'system'::public.user_role;
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = p_actor_id) THEN
    RETURN 'admin'::public.user_role;
  END IF;

  IF EXISTS (SELECT 1 FROM public.sub_admin_profiles WHERE id = p_actor_id) THEN
    RETURN 'sub_admin'::public.user_role;
  END IF;

  IF EXISTS (SELECT 1 FROM public.helper_profiles WHERE id = p_actor_id) THEN
    RETURN 'helper'::public.user_role;
  END IF;

  IF EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = p_actor_id) THEN
    RETURN 'partner'::public.user_role;
  END IF;

  IF EXISTS (SELECT 1 FROM public.customer_profiles WHERE id = p_actor_id) THEN
    RETURN 'customer'::public.user_role;
  END IF;

  RETURN 'system'::public.user_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_table_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);
  v_entity_id UUID;
  v_action TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_entity_id := COALESCE((to_jsonb(OLD)->>'id')::UUID, '00000000-0000-0000-0000-000000000000'::UUID);
  ELSE
    v_entity_id := COALESCE((to_jsonb(NEW)->>'id')::UUID, '00000000-0000-0000-0000-000000000000'::UUID);
  END IF;

  v_action := lower(TG_TABLE_NAME || '.' || TG_OP);

  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state,
    ip_address,
    user_agent
  )
  VALUES (
    v_actor_id,
    public.resolve_audit_actor_role(NULLIF(v_actor_id, '00000000-0000-0000-0000-000000000000'::UUID)),
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    NULL,
    NULL
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'orders',
    'order_items',
    'exchange_requests',
    'loyalty_points_transactions',
    'payment_transactions',
    'discount_codes',
    'products',
    'product_variants',
    'categories',
    'brands',
    'customer_profiles',
    'helper_profiles',
    'partner_profiles',
    'sub_admin_permissions',
    'system_settings',
    'shipping_rates',
    'homepage_sections'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', table_name, table_name);
      EXECUTE format(
        'CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_table_change()',
        table_name,
        table_name
      );
    END IF;
  END LOOP;
END $$;
