CREATE OR REPLACE FUNCTION public.admin_save_collection(
  p_collection_id UUID,
  p_name_ar TEXT,
  p_name_en TEXT,
  p_slug TEXT,
  p_description_ar TEXT,
  p_description_en TEXT,
  p_is_featured_on_homepage BOOLEAN,
  p_has_standalone_page BOOLEAN,
  p_is_active BOOLEAN,
  p_sort_order INTEGER,
  p_product_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_collection_id IS NULL THEN
    INSERT INTO public.collections (
      name_ar, name_en, slug, description_ar, description_en,
      is_featured_on_homepage, has_standalone_page, is_active, sort_order
    ) VALUES (
      p_name_ar, p_name_en, p_slug, p_description_ar, p_description_en,
      p_is_featured_on_homepage, p_has_standalone_page, p_is_active, p_sort_order
    ) RETURNING id INTO v_id;
  ELSE
    UPDATE public.collections SET
      name_ar = p_name_ar,
      name_en = p_name_en,
      slug = p_slug,
      description_ar = p_description_ar,
      description_en = p_description_en,
      is_featured_on_homepage = p_is_featured_on_homepage,
      has_standalone_page = p_has_standalone_page,
      is_active = p_is_active,
      sort_order = p_sort_order,
      updated_at = NOW()
    WHERE id = p_collection_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN RAISE EXCEPTION 'collection_not_found'; END IF;
  END IF;

  DELETE FROM public.collection_products WHERE collection_id = v_id;
  INSERT INTO public.collection_products (collection_id, product_id, sort_order)
  SELECT v_id, product_id, ordinality - 1
  FROM unnest(COALESCE(p_product_ids, ARRAY[]::UUID[])) WITH ORDINALITY AS selected(product_id, ordinality);

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_product_bundle(
  p_bundle_id UUID,
  p_name_ar TEXT,
  p_name_en TEXT,
  p_slug TEXT,
  p_description_ar TEXT,
  p_description_en TEXT,
  p_bundle_price BIGINT,
  p_status TEXT,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_bundle_id IS NULL THEN
    INSERT INTO public.product_bundles (
      name_ar, name_en, slug, description_ar, description_en, bundle_price, status
    ) VALUES (
      p_name_ar, p_name_en, p_slug, p_description_ar, p_description_en, p_bundle_price, p_status
    ) RETURNING id INTO v_id;
  ELSE
    UPDATE public.product_bundles SET
      name_ar = p_name_ar,
      name_en = p_name_en,
      slug = p_slug,
      description_ar = p_description_ar,
      description_en = p_description_en,
      bundle_price = p_bundle_price,
      status = p_status,
      updated_at = NOW()
    WHERE id = p_bundle_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN RAISE EXCEPTION 'bundle_not_found'; END IF;
  END IF;

  DELETE FROM public.bundle_items WHERE bundle_id = v_id;
  INSERT INTO public.bundle_items (bundle_id, product_variant_id, quantity)
  SELECT v_id, item.product_variant_id, item.quantity
  FROM jsonb_to_recordset(COALESCE(p_items, '[]'::JSONB)) AS item(product_variant_id UUID, quantity INTEGER);

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_collection(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, UUID[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_save_product_bundle(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_collection(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_product_bundle(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, JSONB) TO service_role;
