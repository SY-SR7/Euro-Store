CREATE TABLE IF NOT EXISTS public.discount_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  discount_amount BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS eligibility TEXT DEFAULT 'all_users',
  ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'entire_store',
  ADD COLUMN IF NOT EXISTS category_ids UUID[],
  ADD COLUMN IF NOT EXISTS product_ids UUID[],
  ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.discount_codes
SET eligibility = COALESCE(eligibility, 'all_users'),
    scope = COALESCE(scope, 'entire_store');

ALTER TABLE public.discount_codes
  ALTER COLUMN eligibility SET NOT NULL,
  ALTER COLUMN scope SET NOT NULL;

ALTER TABLE public.discount_codes
  DROP CONSTRAINT IF EXISTS discount_codes_type_check,
  DROP CONSTRAINT IF EXISTS discount_codes_eligibility_check,
  DROP CONSTRAINT IF EXISTS discount_codes_scope_check,
  ADD CONSTRAINT discount_codes_type_check CHECK (type IN ('percentage', 'fixed', 'fixed_amount')),
  ADD CONSTRAINT discount_codes_eligibility_check CHECK (eligibility IN ('all_users', 'first_time_buyers')),
  ADD CONSTRAINT discount_codes_scope_check CHECK (scope IN ('entire_store', 'categories', 'products'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_code_usages_order
  ON public.discount_code_usages(order_id);

CREATE INDEX IF NOT EXISTS idx_discount_code_usages_code
  ON public.discount_code_usages(discount_code_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discount_code_usages_customer
  ON public.discount_code_usages(customer_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'discount_codes'
      AND column_name = 'uses_count'
  ) THEN
    ALTER TABLE public.discount_codes
      ADD COLUMN uses_count INTEGER GENERATED ALWAYS AS (COALESCE(used_count, 0)) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'discount_codes'
      AND column_name = 'min_cart_value'
  ) THEN
    ALTER TABLE public.discount_codes
      ADD COLUMN min_cart_value BIGINT GENERATED ALWAYS AS (COALESCE(min_order_syp, 0)) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'discount_codes'
      AND column_name = 'max_uses_total'
  ) THEN
    ALTER TABLE public.discount_codes
      ADD COLUMN max_uses_total INTEGER GENERATED ALWAYS AS (max_uses) STORED;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.log_discount_code_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.discount_code_id IS NOT NULL AND NEW.customer_id IS NOT NULL THEN
    INSERT INTO public.discount_code_usages (
      discount_code_id,
      customer_id,
      order_id,
      discount_amount
    ) VALUES (
      NEW.discount_code_id,
      NEW.customer_id,
      NEW.id,
      COALESCE(NEW.discount_syp, 0)
    )
    ON CONFLICT (order_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_discount_code_usage ON public.orders;
CREATE TRIGGER trg_log_discount_code_usage
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_discount_code_usage();
