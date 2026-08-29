-- =============================================
-- MISSING PRD TABLES MIGRATION
-- =============================================

-- 1. Size Guides
CREATE TABLE IF NOT EXISTS public.size_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: In the PRD, `categories` and `products` tables had a `size_guide_id` column.
-- We must alter existing `categories` and `products` to add this column.
ALTER TABLE public.categories ADD COLUMN size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL;

-- 2. Product Bundles
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  bundle_price BIGINT NOT NULL CHECK (bundle_price >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

-- 3. Collections
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  is_featured_on_homepage BOOLEAN NOT NULL DEFAULT FALSE,
  has_standalone_page BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

-- 4. Notify Me Subscriptions
CREATE TABLE IF NOT EXISTS public.notify_me_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  is_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, product_variant_id)
);

-- 5. Search Analytics
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Product Helper Requests
CREATE TABLE IF NOT EXISTS public.product_helper_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id UUID NOT NULL REFERENCES public.helper_profiles(id) ON DELETE CASCADE,
  product_name_ar TEXT NOT NULL,
  product_name_en TEXT,
  description TEXT,
  suggested_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Payment Transactions (Sham Cash placeholder)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'sham_cash',
  transaction_ref TEXT,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Push Notification Tokens
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, token)
);

-- =============================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================

-- Size Guides (Public Read)
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public size_guides read" ON public.size_guides FOR SELECT USING (true);

-- Product Bundles (Public Read Published)
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public product_bundles read" ON public.product_bundles FOR SELECT USING (status = 'published');

ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bundle_items read" ON public.bundle_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.product_bundles pb WHERE pb.id = bundle_id AND pb.status = 'published')
);

-- Collections (Public Read Active)
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public collections read" ON public.collections FOR SELECT USING (is_active = true);

ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public collection_products read" ON public.collection_products FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.is_active = true)
);

-- Notify Me (Customer Own Read/Write)
ALTER TABLE public.notify_me_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer notify_me own" ON public.notify_me_subscriptions FOR ALL TO authenticated USING (auth.uid() = customer_id);

-- Search Analytics (Customer Can Insert, Admin Can View)
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert search analytics" ON public.search_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view search analytics" ON public.search_analytics FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM sub_admin_profiles WHERE id = auth.uid())
);

-- Helper Product Requests (Helper Own Read/Write, Admin Read/Write)
ALTER TABLE public.product_helper_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Helper own product requests" ON public.product_helper_requests FOR ALL TO authenticated USING (
  helper_id = auth.uid() OR
  EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM sub_admin_profiles WHERE id = auth.uid())
);

-- Payment Transactions (Customer Own Read)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer own payment transactions read" ON public.payment_transactions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);

-- Push Notification Tokens (Customer Own Read/Write)
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer own push tokens" ON public.push_notification_tokens FOR ALL TO authenticated USING (auth.uid() = customer_id);
