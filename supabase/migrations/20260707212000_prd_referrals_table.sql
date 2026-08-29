-- PRD §6.11: first-order referral rewards are tracked in referrals.

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  points_awarded INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers view own referrals" ON public.referrals;
CREATE POLICY "Customers view own referrals"
  ON public.referrals
  FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to referrals" ON public.referrals;
CREATE POLICY "Admins full access to referrals"
  ON public.referrals
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
