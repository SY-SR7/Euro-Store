CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  source TEXT NOT NULL DEFAULT 'storefront' CHECK (source IN ('web', 'mobile', 'storefront')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscriptions_email_lower_idx ON public.newsletter_subscriptions(lower(email));
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_subscriptions FROM anon, authenticated;

COMMENT ON TABLE public.newsletter_subscriptions IS 'VIP newsletter subscriptions written only through the server API.';
