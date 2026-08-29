-- Align the live catalog with the PRD while preserving legacy columns used by
-- existing clients during the migration period.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS base_price BIGINT,
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS discount_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discount_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL;

UPDATE public.products p
SET base_price = COALESCE(
  p.base_price,
  (SELECT MIN(v.price_syp) FROM public.product_variants v WHERE v.product_id = p.id),
  0
);

UPDATE public.products
SET status = CASE WHEN is_active THEN 'published' ELSE 'archived' END
WHERE status IS NULL;

ALTER TABLE public.products
  ALTER COLUMN base_price SET DEFAULT 0,
  ALTER COLUMN base_price SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_base_price_nonnegative') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_base_price_nonnegative CHECK (base_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_discount_percentage_range') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_discount_percentage_range
      CHECK (discount_percentage IS NULL OR (discount_percentage > 0 AND discount_percentage <= 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_status_prd_check') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_status_prd_check
      CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_product_publish_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.is_active := NEW.status = 'published';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.is_active := NEW.status = 'published';
  ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    NEW.status := CASE
      WHEN NEW.is_active THEN 'published'
      WHEN OLD.status = 'draft' THEN 'draft'
      ELSE 'archived'
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_sync_publish_state ON public.products;
CREATE TRIGGER products_sync_publish_state
BEFORE INSERT OR UPDATE OF status, is_active ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_product_publish_state();

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS price_override BIGINT;

UPDATE public.product_variants v
SET price_override = CASE WHEN v.price_syp = p.base_price THEN NULL ELSE v.price_syp END
FROM public.products p
WHERE p.id = v.product_id AND v.price_override IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_price_override_nonnegative') THEN
    ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_price_override_nonnegative
      CHECK (price_override IS NULL OR price_override >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_variant_prd_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  inherited_price BIGINT;
BEGIN
  SELECT base_price INTO inherited_price FROM public.products WHERE id = NEW.product_id;

  IF TG_OP = 'INSERT' THEN
    IF NEW.price_override IS NULL AND NEW.price_syp IS NOT NULL AND NEW.price_syp <> inherited_price THEN
      NEW.price_override := NEW.price_syp;
    END IF;
  ELSIF NEW.price_override IS NOT DISTINCT FROM OLD.price_override
    AND NEW.price_syp IS DISTINCT FROM OLD.price_syp THEN
    NEW.price_override := CASE WHEN NEW.price_syp = inherited_price THEN NULL ELSE NEW.price_syp END;
  END IF;

  NEW.price_syp := COALESCE(NEW.price_override, inherited_price, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_variants_sync_prd_price ON public.product_variants;
CREATE TRIGGER product_variants_sync_prd_price
BEFORE INSERT OR UPDATE OF product_id, price_override, price_syp ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.sync_variant_prd_price();

CREATE OR REPLACE FUNCTION public.sync_inherited_variant_prices()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.base_price IS DISTINCT FROM OLD.base_price THEN
    UPDATE public.product_variants
    SET price_syp = NEW.base_price
    WHERE product_id = NEW.id AND price_override IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_sync_inherited_variant_prices ON public.products;
CREATE TRIGGER products_sync_inherited_variant_prices
AFTER UPDATE OF base_price ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_inherited_variant_prices();

CREATE INDEX IF NOT EXISTS idx_products_status_created_at
  ON public.products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_discount
  ON public.products(discount_percentage, discount_start_at, discount_end_at)
  WHERE status = 'published' AND discount_percentage IS NOT NULL;

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS alt_text_ar TEXT,
  ADD COLUMN IF NOT EXISTS alt_text_en TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'upload';

UPDATE public.product_images
SET alt_text_ar = COALESCE(alt_text_ar, alt_ar),
    alt_text_en = COALESCE(alt_text_en, alt_en);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_images_source_prd_check') THEN
    ALTER TABLE public.product_images ADD CONSTRAINT product_images_source_prd_check
      CHECK (source IN ('upload', 'url_import'));
  END IF;
END $$;

ALTER TABLE public.product_videos
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
