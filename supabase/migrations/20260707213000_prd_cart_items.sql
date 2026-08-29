-- PRD §6.4.2: authenticated cart is stored in cart_items.

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, product_variant_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers manage own cart" ON public.cart_items;
CREATE POLICY "Customers manage own cart"
  ON public.cart_items
  FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON public.cart_items(customer_id);
