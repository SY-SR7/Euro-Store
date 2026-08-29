ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS cart_data JSONB DEFAULT '[]'::jsonb;
