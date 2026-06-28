INSERT INTO categories (name_ar, name_en, slug, sort_order, is_active)
VALUES
  ('فساتين نسائية', 'Women Dresses', 'women-dresses', 10, true),
  ('قمصان رجالية', 'Men Shirts', 'men-shirts', 20, true),
  ('أحذية', 'Shoes', 'shoes', 30, true),
  ('حقائب', 'Bags', 'bags', 40, true),
  ('إكسسوارات', 'Accessories', 'accessories', 50, true),
  ('أزياء محتشمة', 'Modest Wear', 'modest-wear', 60, true)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

INSERT INTO brands (name, slug, is_active)
VALUES
  ('Aura Atelier', 'aura-atelier', true),
  ('Milano Line', 'milano-line', true),
  ('Levant Mode', 'levant-mode', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

INSERT INTO attribute_types (name_ar, name_en, slug)
VALUES
  ('المقاس', 'Size', 'size'),
  ('اللون', 'Color', 'color')
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en;

WITH size_type AS (
  SELECT id FROM attribute_types WHERE slug = 'size'
), color_type AS (
  SELECT id FROM attribute_types WHERE slug = 'color'
)
INSERT INTO attribute_values (attribute_type_id, value_ar, value_en, hex_color, sort_order)
SELECT size_type.id, 'صغير', 'S', NULL, 10 FROM size_type
UNION ALL SELECT size_type.id, 'متوسط', 'M', NULL, 20 FROM size_type
UNION ALL SELECT size_type.id, 'كبير', 'L', NULL, 30 FROM size_type
UNION ALL SELECT size_type.id, 'كبير جداً', 'XL', NULL, 40 FROM size_type
UNION ALL SELECT color_type.id, 'أسود', 'Black', '#111111', 10 FROM color_type
UNION ALL SELECT color_type.id, 'ذهبي', 'Gold', '#C9A84C', 20 FROM color_type
UNION ALL SELECT color_type.id, 'عاجي', 'Ivory', '#F7F0DF', 30 FROM color_type
UNION ALL SELECT color_type.id, 'كحلي', 'Navy', '#1D2A44', 40 FROM color_type;

INSERT INTO products (
  name_ar,
  name_en,
  slug,
  description_ar,
  description_en,
  category_id,
  brand_id,
  is_active,
  is_featured,
  tags
)
VALUES
  (
    'فستان سهرة Aura',
    'Aura Evening Dress',
    'aura-evening-dress',
    'فستان سهرة بقصة انسيابية ولمعة هادئة للمناسبات الخاصة.',
    'An evening dress with a fluid silhouette and refined shimmer for special occasions.',
    (SELECT id FROM categories WHERE slug = 'women-dresses'),
    (SELECT id FROM brands WHERE slug = 'aura-atelier'),
    true,
    true,
    ARRAY['evening', 'featured', 'dress']
  ),
  (
    'حذاء Milano الجلدي',
    'Milano Leather Heels',
    'milano-leather-heels',
    'حذاء جلدي بكعب مريح ولمسة ذهبية تناسب الإطلالات الرسمية.',
    'Leather heels with a comfortable lift and gold accent for polished outfits.',
    (SELECT id FROM categories WHERE slug = 'shoes'),
    (SELECT id FROM brands WHERE slug = 'milano-line'),
    true,
    true,
    ARRAY['shoes', 'leather', 'featured']
  ),
  (
    'عباية Levant الراقية',
    'Levant Modest Abaya',
    'levant-modest-abaya',
    'عباية محتشمة بتفاصيل ناعمة وقماش عملي للاستخدام اليومي والمناسبات.',
    'A refined modest abaya with soft details and practical fabric for daily wear and occasions.',
    (SELECT id FROM categories WHERE slug = 'modest-wear'),
    (SELECT id FROM brands WHERE slug = 'levant-mode'),
    true,
    true,
    ARRAY['modest', 'abaya', 'featured']
  ),
  (
    'حقيبة Aura المنظمة',
    'Aura Structured Bag',
    'aura-structured-bag',
    'حقيبة منظمة بتقسيم داخلي عملي وتشطيب أنيق للاستخدام اليومي.',
    'A structured bag with practical inner compartments and an elegant finish.',
    (SELECT id FROM categories WHERE slug = 'bags'),
    (SELECT id FROM brands WHERE slug = 'aura-atelier'),
    true,
    true,
    ARRAY['bag', 'daily', 'featured']
  ),
  (
    'قميص Milano الكتاني',
    'Milano Linen Shirt',
    'milano-linen-shirt',
    'قميص كتاني خفيف بقصة مريحة يناسب الأيام الدافئة والإطلالات العملية.',
    'A lightweight linen shirt with a relaxed fit for warm days and practical styling.',
    (SELECT id FROM categories WHERE slug = 'men-shirts'),
    (SELECT id FROM brands WHERE slug = 'milano-line'),
    true,
    false,
    ARRAY['shirt', 'linen']
  ),
  (
    'نظارة بإطار ذهبي',
    'Gold Accent Sunglasses',
    'gold-accent-sunglasses',
    'نظارة أنيقة بإطار ذهبي خفيف وعدسات داكنة للحضور اليومي.',
    'Elegant sunglasses with a light gold frame and dark lenses for daily presence.',
    (SELECT id FROM categories WHERE slug = 'accessories'),
    (SELECT id FROM brands WHERE slug = 'aura-atelier'),
    true,
    false,
    ARRAY['accessories', 'sunglasses']
  )
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  tags = EXCLUDED.tags,
  updated_at = NOW();

INSERT INTO product_variants (
  product_id,
  sku,
  price_syp,
  compare_price_syp,
  stock_quantity,
  weight_grams,
  is_active
)
VALUES
  ((SELECT id FROM products WHERE slug = 'aura-evening-dress'), 'AURA-DRESS-BLK-M', 450000, 520000, 8, 650, true),
  ((SELECT id FROM products WHERE slug = 'aura-evening-dress'), 'AURA-DRESS-BLK-L', 450000, 520000, 5, 680, true),
  ((SELECT id FROM products WHERE slug = 'milano-leather-heels'), 'MILANO-HEEL-GOLD-38', 185000, 210000, 12, 760, true),
  ((SELECT id FROM products WHERE slug = 'milano-leather-heels'), 'MILANO-HEEL-GOLD-39', 185000, 210000, 9, 780, true),
  ((SELECT id FROM products WHERE slug = 'levant-modest-abaya'), 'LEVANT-ABAYA-NAVY-M', 390000, 450000, 7, 720, true),
  ((SELECT id FROM products WHERE slug = 'levant-modest-abaya'), 'LEVANT-ABAYA-NAVY-L', 390000, 450000, 6, 760, true),
  ((SELECT id FROM products WHERE slug = 'aura-structured-bag'), 'AURA-BAG-IVORY-STD', 220000, NULL, 15, 900, true),
  ((SELECT id FROM products WHERE slug = 'milano-linen-shirt'), 'MILANO-SHIRT-IVORY-L', 160000, 190000, 18, 360, true),
  ((SELECT id FROM products WHERE slug = 'gold-accent-sunglasses'), 'AURA-SUN-GOLD-STD', 120000, NULL, 20, 180, true)
ON CONFLICT (sku) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  price_syp = EXCLUDED.price_syp,
  compare_price_syp = EXCLUDED.compare_price_syp,
  stock_quantity = EXCLUDED.stock_quantity,
  weight_grams = EXCLUDED.weight_grams,
  is_active = EXCLUDED.is_active;

WITH mappings AS (
  SELECT 'AURA-DRESS-BLK-M' AS sku, 'M' AS value_en
  UNION ALL SELECT 'AURA-DRESS-BLK-M', 'Black'
  UNION ALL SELECT 'AURA-DRESS-BLK-L', 'L'
  UNION ALL SELECT 'AURA-DRESS-BLK-L', 'Black'
  UNION ALL SELECT 'MILANO-HEEL-GOLD-38', 'Gold'
  UNION ALL SELECT 'MILANO-HEEL-GOLD-39', 'Gold'
  UNION ALL SELECT 'LEVANT-ABAYA-NAVY-M', 'M'
  UNION ALL SELECT 'LEVANT-ABAYA-NAVY-M', 'Navy'
  UNION ALL SELECT 'LEVANT-ABAYA-NAVY-L', 'L'
  UNION ALL SELECT 'LEVANT-ABAYA-NAVY-L', 'Navy'
  UNION ALL SELECT 'AURA-BAG-IVORY-STD', 'Ivory'
  UNION ALL SELECT 'MILANO-SHIRT-IVORY-L', 'L'
  UNION ALL SELECT 'MILANO-SHIRT-IVORY-L', 'Ivory'
  UNION ALL SELECT 'AURA-SUN-GOLD-STD', 'Gold'
)
INSERT INTO variant_attributes (variant_id, attribute_value_id)
SELECT product_variants.id, attribute_values.id
FROM mappings
JOIN product_variants ON product_variants.sku = mappings.sku
JOIN attribute_values ON attribute_values.value_en = mappings.value_en
ON CONFLICT (variant_id, attribute_value_id) DO NOTHING;

INSERT INTO homepage_sections (section_key, title_ar, title_en, content, is_active, sort_order)
VALUES
  (
    'hero',
    'اختيارات أوروبية تصل إلى بابك',
    'European fashion delivered to your door',
    '{"type":"hero","source":"featured_products","cta":{"label_ar":"تسوقي الآن","href":"/products"}}'::jsonb,
    true,
    10
  ),
  (
    'featured_products',
    'منتجات مختارة',
    'Featured products',
    '{"type":"product_feed","source":"featured_products","limit":4}'::jsonb,
    true,
    20
  ),
  (
    'category_grid',
    'تسوق حسب التصنيف',
    'Shop by category',
    '{"type":"category_grid","limit":6}'::jsonb,
    true,
    30
  )
ON CONFLICT (section_key) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  content = EXCLUDED.content,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
