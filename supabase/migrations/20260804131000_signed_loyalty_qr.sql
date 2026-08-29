ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS loyalty_qr_version INTEGER;

UPDATE public.customer_profiles
SET loyalty_qr_version = 1
WHERE loyalty_qr_version IS NULL;

ALTER TABLE public.customer_profiles
  ALTER COLUMN loyalty_qr_version SET DEFAULT 2,
  ALTER COLUMN loyalty_qr_version SET NOT NULL;

ALTER TABLE public.customer_profiles
  DROP CONSTRAINT IF EXISTS customer_profiles_loyalty_qr_version_check;
ALTER TABLE public.customer_profiles
  ADD CONSTRAINT customer_profiles_loyalty_qr_version_check
  CHECK (loyalty_qr_version IN (1, 2));
