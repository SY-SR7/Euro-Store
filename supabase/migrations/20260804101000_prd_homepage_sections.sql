-- Keep the homepage contract finite and entirely admin-controlled.

UPDATE public.homepage_sections legacy
SET section_key = 'main_banner'
WHERE legacy.section_key = 'hero'
  AND NOT EXISTS (SELECT 1 FROM public.homepage_sections current WHERE current.section_key = 'main_banner');

UPDATE public.homepage_sections legacy
SET section_key = 'new_arrivals'
WHERE legacy.section_key = 'featured_products'
  AND NOT EXISTS (SELECT 1 FROM public.homepage_sections current WHERE current.section_key = 'new_arrivals');

UPDATE public.homepage_sections legacy
SET section_key = 'sales'
WHERE legacy.section_key = 'promotions'
  AND NOT EXISTS (SELECT 1 FROM public.homepage_sections current WHERE current.section_key = 'sales');

DELETE FROM public.homepage_sections
WHERE section_key NOT IN ('main_banner', 'new_arrivals', 'sales', 'featured_brands', 'most_popular');

INSERT INTO public.homepage_sections (section_key, title_ar, title_en, content, is_active, sort_order)
VALUES
  ('main_banner', 'العروض الرئيسية', 'Main offers', '{"banners":[]}'::jsonb, TRUE, 0),
  ('new_arrivals', 'وصل حديثا', 'New arrivals', '{"limit":12}'::jsonb, TRUE, 10),
  ('sales', 'التخفيضات', 'Sale', '{"limit":12}'::jsonb, TRUE, 20),
  ('featured_brands', 'ماركات مختارة', 'Featured brands', '{"brand_ids":[]}'::jsonb, TRUE, 30),
  ('most_popular', 'الأكثر طلبا', 'Most popular', '{"limit":12}'::jsonb, TRUE, 40)
ON CONFLICT (section_key) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homepage_sections_prd_key_check') THEN
    ALTER TABLE public.homepage_sections ADD CONSTRAINT homepage_sections_prd_key_check
      CHECK (section_key IN ('main_banner', 'new_arrivals', 'sales', 'featured_brands', 'most_popular'));
  END IF;
END $$;

