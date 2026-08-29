-- Migration: 20260707180000_audit_gaps_closure.sql
-- Fixes Phase 1 DB mismatches found during strict PRD audit.

-- 1. customer_profiles
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Modify loyalty_points to INTEGER (it was BIGINT or something else)
ALTER TABLE public.customer_profiles
  ALTER COLUMN loyalty_points TYPE INTEGER USING loyalty_points::INTEGER;

-- Update existing rows to have a referral_code before making it NOT NULL
UPDATE public.customer_profiles 
SET referral_code = substring(md5(random()::text) from 1 for 12) 
WHERE referral_code IS NULL;

ALTER TABLE public.customer_profiles
  ALTER COLUMN referral_code SET NOT NULL;

-- 2. exchange_requests
ALTER TABLE public.exchange_requests
  ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES public.order_items(id),
  ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS return_method TEXT DEFAULT 'branch';

-- 3. exchange_request_images
CREATE TABLE IF NOT EXISTS public.exchange_request_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_request_id UUID REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for exchange_request_images
ALTER TABLE public.exchange_request_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view exchange_request_images"
  ON public.exchange_request_images
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()));

CREATE POLICY "Sub-Admin view exchange_request_images"
  ON public.exchange_request_images
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.sub_admin_profiles WHERE id = auth.uid()));

CREATE POLICY "Customer view own exchange_request_images"
  ON public.exchange_request_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exchange_requests er
      WHERE er.id = exchange_request_images.exchange_request_id
      AND er.customer_id = auth.uid()
    )
  );

-- 4. partner_profiles
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS geographic_area TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Try to add missing Foreign Key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'partner_profiles_id_fkey'
    ) THEN
        -- Remove orphaned records before adding foreign key constraint to avoid violation
        DELETE FROM public.partner_profiles WHERE id NOT IN (SELECT id FROM auth.users);
        ALTER TABLE public.partner_profiles
          ADD CONSTRAINT partner_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update full_name using contact_name to avoid data loss
UPDATE public.partner_profiles SET full_name = contact_name WHERE full_name IS NULL;
UPDATE public.partner_profiles SET geographic_area = governorate WHERE geographic_area IS NULL;
UPDATE public.partner_profiles SET address = address_en WHERE address IS NULL;

-- 5. Missing RLS Policies for Partners
-- Drop them if they exist to be safe
DROP POLICY IF EXISTS "Partners view assigned exchange_requests" ON public.exchange_requests;
DROP POLICY IF EXISTS "Partners update assigned exchange_requests" ON public.exchange_requests;

CREATE POLICY "Partners view assigned exchange_requests"
  ON public.exchange_requests
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = auth.uid())
    AND (
      partner_id = auth.uid() OR
      (status = 'approved' AND return_method = 'partner' AND partner_id IS NULL)
    )
  );

CREATE POLICY "Partners update assigned exchange_requests"
  ON public.exchange_requests
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = auth.uid())
    AND partner_id = auth.uid()
  );
