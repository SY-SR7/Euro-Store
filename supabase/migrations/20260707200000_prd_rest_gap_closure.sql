-- Remaining PRD gap closure after the strict handoff audit.

-- TOTP lockout support (3 failed attempts -> 30 minute lock in the app layer).
ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS totp_failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (totp_failed_attempts >= 0),
  ADD COLUMN IF NOT EXISTS totp_locked_until TIMESTAMPTZ;

ALTER TABLE public.sub_admin_profiles
  ADD COLUMN IF NOT EXISTS totp_failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (totp_failed_attempts >= 0),
  ADD COLUMN IF NOT EXISTS totp_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Partner profiles must be auth extension profiles, not standalone mock rows.
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS geographic_area TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.partner_profiles
SET full_name = COALESCE(NULLIF(full_name, ''), NULLIF(contact_name, ''), business_name)
WHERE full_name IS NULL OR full_name = '';

UPDATE public.partner_profiles
SET geographic_area = COALESCE(NULLIF(geographic_area, ''), governorate)
WHERE geographic_area IS NULL OR geographic_area = '';

UPDATE public.partner_profiles
SET address = COALESCE(NULLIF(address, ''), NULLIF(address_en, ''), address_ar)
WHERE address IS NULL OR address = '';

UPDATE public.partner_profiles
SET created_by = (SELECT id FROM public.admin_profiles ORDER BY created_at ASC LIMIT 1)
WHERE created_by IS NULL
  AND EXISTS (SELECT 1 FROM public.admin_profiles);

DELETE FROM public.partner_profiles
WHERE id NOT IN (SELECT id FROM auth.users)
   OR full_name IS NULL
   OR geographic_area IS NULL
   OR address IS NULL
   OR created_by IS NULL;

ALTER TABLE public.partner_profiles
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN geographic_area SET NOT NULL,
  ALTER COLUMN address SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'partner_profiles_id_fkey'
      AND conrelid = 'public.partner_profiles'::regclass
  ) THEN
    ALTER TABLE public.partner_profiles
      ADD CONSTRAINT partner_profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Exchange requests: keep backwards-compatible columns, but enforce the PRD fields.
ALTER TABLE public.exchange_requests
  ADD COLUMN IF NOT EXISTS order_item_id UUID,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS resolution_path TEXT CHECK (resolution_path IN ('helper', 'partner')),
  ADD COLUMN IF NOT EXISTS replacement_variant_id UUID REFERENCES public.product_variants(id),
  ADD COLUMN IF NOT EXISTS replacement_order_id UUID REFERENCES public.orders(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exchange_requests_order_item_id_fkey'
      AND conrelid = 'public.exchange_requests'::regclass
  ) THEN
    ALTER TABLE public.exchange_requests
      ADD CONSTRAINT exchange_requests_order_item_id_fkey
      FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE RESTRICT;
  END IF;
END $$;

UPDATE public.exchange_requests
SET reason = COALESCE(NULLIF(reason, ''), NULLIF(reason_ar, ''), NULLIF(reason_en, ''))
WHERE reason IS NULL OR reason = '';

UPDATE public.exchange_requests er
SET order_item_id = ei.original_order_item_id
FROM public.exchange_items ei
WHERE er.order_item_id IS NULL
  AND ei.exchange_request_id = er.id
  AND ei.original_order_item_id IS NOT NULL;

UPDATE public.exchange_requests er
SET order_item_id = (
  SELECT oi.id
  FROM public.order_items oi
  WHERE oi.order_id = er.order_id
  ORDER BY oi.created_at ASC
  LIMIT 1
)
WHERE er.order_item_id IS NULL;

UPDATE public.exchange_requests er
SET customer_whatsapp = COALESCE(NULLIF(er.customer_whatsapp, ''), cp.phone, 'unknown')
FROM public.customer_profiles cp
WHERE er.customer_id = cp.id
  AND (er.customer_whatsapp IS NULL OR er.customer_whatsapp = '');

DELETE FROM public.exchange_requests
WHERE order_id IS NULL
   OR customer_id IS NULL
   OR order_item_id IS NULL
   OR reason IS NULL
   OR reason = ''
   OR customer_whatsapp IS NULL
   OR customer_whatsapp = '';

ALTER TABLE public.exchange_requests
  ALTER COLUMN order_id SET NOT NULL,
  ALTER COLUMN order_item_id SET NOT NULL,
  ALTER COLUMN customer_id SET NOT NULL,
  ALTER COLUMN reason SET NOT NULL,
  ALTER COLUMN customer_whatsapp SET NOT NULL;

-- Exchange request images table and customer insert policy.
CREATE TABLE IF NOT EXISTS public.exchange_request_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.exchange_request_images
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.exchange_request_images
SET uploaded_at = COALESCE(uploaded_at, created_at, NOW())
WHERE uploaded_at IS NULL;

ALTER TABLE public.exchange_request_images
  ALTER COLUMN exchange_request_id SET NOT NULL,
  ALTER COLUMN uploaded_at SET NOT NULL;

ALTER TABLE public.exchange_request_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer insert own exchange_request_images" ON public.exchange_request_images;
CREATE POLICY "Customer insert own exchange_request_images"
  ON public.exchange_request_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.exchange_requests er
      WHERE er.id = exchange_request_images.exchange_request_id
        AND er.customer_id = auth.uid()
    )
  );
