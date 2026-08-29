CREATE OR REPLACE FUNCTION public.catalog_search_with_facets(
  p_category_ids UUID[] DEFAULT '{}',
  p_brand_ids UUID[] DEFAULT '{}',
  p_attributes JSONB DEFAULT '{}'::jsonb,
  p_min_price BIGINT DEFAULT NULL,
  p_max_price BIGINT DEFAULT NULL,
  p_discount_min NUMERIC DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT FALSE,
  p_sort TEXT DEFAULT 'newest',
  p_page INTEGER DEFAULT 1,
  p_per_page INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH variant_prices AS (
  SELECT p.id AS product_id,
         MIN(COALESCE(v.price_override, p.base_price, v.price_syp))::BIGINT AS min_price,
         MAX(COALESCE(v.price_override, p.base_price, v.price_syp))::BIGINT AS max_price,
         COUNT(v.id)::INTEGER AS variant_count,
         COALESCE(SUM(v.stock_quantity), 0)::INTEGER AS total_stock
  FROM products p
  JOIN product_variants v ON v.product_id = p.id AND v.is_active = TRUE
  GROUP BY p.id
), sales AS (
  SELECT v.product_id, COALESCE(SUM(oi.quantity), 0)::BIGINT AS sold_count
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status IN ('delivered', 'completed')
  JOIN product_variants v ON v.id = oi.variant_id
  GROUP BY v.product_id
), foundation_no_price AS (
  SELECT p.*, vp.min_price, vp.max_price, vp.variant_count, vp.total_stock,
         COALESCE(s.sold_count, 0) AS sold_count,
         CASE WHEN p.discount_percentage IS NOT NULL
                    AND (p.discount_start_at IS NULL OR p.discount_start_at <= NOW())
                    AND (p.discount_end_at IS NULL OR p.discount_end_at >= NOW())
              THEN p.discount_percentage ELSE NULL END AS active_discount
  FROM products p
  JOIN variant_prices vp ON vp.product_id = p.id
  LEFT JOIN sales s ON s.product_id = p.id
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.status = 'published' AND p.is_active = TRUE
    AND (NOT p_featured_only OR p.is_featured = TRUE)
    AND (p_discount_min IS NULL OR (
      p.discount_percentage >= p_discount_min
      AND (p.discount_start_at IS NULL OR p.discount_start_at <= NOW())
      AND (p.discount_end_at IS NULL OR p.discount_end_at >= NOW())
    ))
    AND (NULLIF(trim(p_search), '') IS NULL OR
      p.search_vector @@ plainto_tsquery('simple', trim(p_search)) OR
      p.name_ar ILIKE '%' || trim(p_search) || '%' OR p.name_en ILIKE '%' || trim(p_search) || '%' OR
      COALESCE(p.description_ar, '') ILIKE '%' || trim(p_search) || '%' OR
      COALESCE(p.description_en, '') ILIKE '%' || trim(p_search) || '%' OR
      COALESCE(b.name, '') ILIKE '%' || trim(p_search) || '%' OR
      COALESCE(c.name_ar, '') ILIKE '%' || trim(p_search) || '%' OR COALESCE(c.name_en, '') ILIKE '%' || trim(p_search) || '%')
), foundation AS (
  SELECT * FROM foundation_no_price
  WHERE (p_min_price IS NULL OR max_price >= p_min_price)
    AND (p_max_price IS NULL OR min_price <= p_max_price)
), attribute_filtered AS (
  SELECT f.* FROM foundation f
  WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_each(COALESCE(p_attributes, '{}'::jsonb)) selected
    WHERE jsonb_array_length(selected.value) > 0
      AND NOT EXISTS (
        SELECT 1 FROM product_variants pv
        JOIN variant_attributes va ON va.variant_id = pv.id
        WHERE pv.product_id = f.id AND pv.is_active = TRUE
          AND va.attribute_value_id IN (SELECT jsonb_array_elements_text(selected.value)::UUID)
      )
  )
), filtered AS (
  SELECT * FROM attribute_filtered f
  WHERE (COALESCE(array_length(p_category_ids, 1), 0) = 0 OR f.category_id = ANY(p_category_ids))
    AND (COALESCE(array_length(p_brand_ids, 1), 0) = 0 OR f.brand_id = ANY(p_brand_ids))
), ordered AS (
  SELECT * FROM filtered
  ORDER BY
    CASE WHEN p_sort = 'price_asc' THEN min_price END ASC,
    CASE WHEN p_sort = 'price_desc' THEN min_price END DESC,
    CASE WHEN p_sort = 'popular' THEN sold_count END DESC,
    created_at DESC
), paged AS (
  SELECT * FROM ordered
  OFFSET (GREATEST(p_page, 1) - 1) * LEAST(GREATEST(p_per_page, 1), 60)
  LIMIT LEAST(GREATEST(p_per_page, 1), 60)
), category_base AS (
  SELECT * FROM attribute_filtered f
  WHERE (COALESCE(array_length(p_brand_ids, 1), 0) = 0 OR f.brand_id = ANY(p_brand_ids))
), brand_base AS (
  SELECT * FROM attribute_filtered f
  WHERE (COALESCE(array_length(p_category_ids, 1), 0) = 0 OR f.category_id = ANY(p_category_ids))
), attribute_base AS (
  SELECT * FROM foundation f
  WHERE (COALESCE(array_length(p_category_ids, 1), 0) = 0 OR f.category_id = ANY(p_category_ids))
    AND (COALESCE(array_length(p_brand_ids, 1), 0) = 0 OR f.brand_id = ANY(p_brand_ids))
), price_base AS (
  SELECT f.* FROM foundation_no_price f
  WHERE (COALESCE(array_length(p_category_ids, 1), 0) = 0 OR f.category_id = ANY(p_category_ids))
    AND (COALESCE(array_length(p_brand_ids, 1), 0) = 0 OR f.brand_id = ANY(p_brand_ids))
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_each(COALESCE(p_attributes, '{}'::jsonb)) selected
      WHERE jsonb_array_length(selected.value) > 0
        AND NOT EXISTS (
          SELECT 1 FROM product_variants pv JOIN variant_attributes va ON va.variant_id = pv.id
          WHERE pv.product_id = f.id AND pv.is_active = TRUE
            AND va.attribute_value_id IN (SELECT jsonb_array_elements_text(selected.value)::UUID)
        )
    )
)
SELECT jsonb_build_object(
  'data', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'id', p.id, 'name_ar', p.name_ar, 'name_en', p.name_en, 'slug', p.slug,
    'description_ar', p.description_ar, 'description_en', p.description_en,
    'category_id', p.category_id, 'brand_id', p.brand_id, 'is_featured', p.is_featured,
    'base_price', p.base_price, 'discount_percentage', p.active_discount,
    'created_at', p.created_at, 'minPrice', ROUND(p.min_price * (1 - COALESCE(p.active_discount, 0) / 100.0)),
    'raw_min_price', p.min_price, 'maxPrice', p.max_price, 'variants_count', p.variant_count,
    'total_stock', p.total_stock, 'sold_count', p.sold_count,
    'image_url', COALESCE((SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order, pi.created_at LIMIT 1), '')
  )) FROM paged p), '[]'::jsonb),
  'total', (SELECT COUNT(*) FROM filtered),
  'page', GREATEST(p_page, 1),
  'per_page', LEAST(GREATEST(p_per_page, 1), 60),
  'filters', jsonb_build_object(
    'categories', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', c.id, 'name_ar', c.name_ar, 'name_en', c.name_en, 'slug', c.slug,
      'count', (SELECT COUNT(*) FROM category_base cb WHERE cb.category_id = c.id),
      'selected', c.id = ANY(COALESCE(p_category_ids, '{}'::UUID[]))
    ) ORDER BY c.sort_order) FROM categories c WHERE c.is_active = TRUE AND (EXISTS (SELECT 1 FROM category_base cb WHERE cb.category_id = c.id) OR c.id = ANY(COALESCE(p_category_ids, '{}'::UUID[])))), '[]'::jsonb),
    'brands', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug,
      'count', (SELECT COUNT(*) FROM brand_base bb WHERE bb.brand_id = b.id),
      'selected', b.id = ANY(COALESCE(p_brand_ids, '{}'::UUID[]))
    ) ORDER BY b.name) FROM brands b WHERE b.is_active = TRUE AND (EXISTS (SELECT 1 FROM brand_base bb WHERE bb.brand_id = b.id) OR b.id = ANY(COALESCE(p_brand_ids, '{}'::UUID[])))), '[]'::jsonb),
    'attributes', COALESCE((SELECT jsonb_agg(attribute_row ORDER BY attribute_order) FROM (
      SELECT at.slug AS attribute_order, jsonb_build_object(
        'id', at.id, 'slug', at.slug, 'name_ar', at.name_ar, 'name_en', at.name_en,
        'values', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'id', av.id, 'slug', lower(regexp_replace(av.value_en, '\\s+', '-', 'g')),
          'value_ar', av.value_ar, 'value_en', av.value_en, 'hex_color', av.hex_color,
          'count', (SELECT COUNT(DISTINCT candidate.id) FROM attribute_base candidate
            WHERE NOT EXISTS (
              SELECT 1 FROM jsonb_each(COALESCE(p_attributes, '{}'::jsonb)) selected
              WHERE selected.key <> at.slug AND jsonb_array_length(selected.value) > 0
                AND NOT EXISTS (
                  SELECT 1 FROM product_variants pv2 JOIN variant_attributes va2 ON va2.variant_id = pv2.id
                  WHERE pv2.product_id = candidate.id AND pv2.is_active = TRUE
                    AND va2.attribute_value_id IN (SELECT jsonb_array_elements_text(selected.value)::UUID)
                )
            )
            AND EXISTS (
              SELECT 1 FROM product_variants pv3 JOIN variant_attributes va3 ON va3.variant_id = pv3.id
              WHERE pv3.product_id = candidate.id AND pv3.is_active = TRUE AND va3.attribute_value_id = av.id
            )),
          'selected', COALESCE(p_attributes -> at.slug, '[]'::jsonb) ? av.id::TEXT
        ) ORDER BY av.sort_order) FROM attribute_values av WHERE av.attribute_type_id = at.id
          AND (EXISTS (SELECT 1 FROM attribute_base candidate JOIN product_variants pv ON pv.product_id = candidate.id AND pv.is_active = TRUE JOIN variant_attributes va ON va.variant_id = pv.id WHERE va.attribute_value_id = av.id)
            OR COALESCE(p_attributes -> at.slug, '[]'::jsonb) ? av.id::TEXT)), '[]'::jsonb)
      ) AS attribute_row
      FROM attribute_types at
      WHERE EXISTS (SELECT 1 FROM attribute_values av WHERE av.attribute_type_id = at.id)
    ) attribute_rows), '[]'::jsonb),
    'priceRange', jsonb_build_object('min', COALESCE((SELECT MIN(min_price) FROM price_base), 0), 'max', COALESCE((SELECT MAX(max_price) FROM price_base), 0))
  )
);
$$;

REVOKE ALL ON FUNCTION public.catalog_search_with_facets(UUID[], UUID[], JSONB, BIGINT, BIGINT, NUMERIC, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_search_with_facets(UUID[], UUID[], JSONB, BIGINT, BIGINT, NUMERIC, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;
