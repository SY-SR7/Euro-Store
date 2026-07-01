/* eslint-disable */
// @ts-nocheck
import { getSessionClient } from '@/supabase-server';
import Link from 'next/link';
import { CopyReferralButton } from '@/components/loyalty/CopyReferralButton';
import { getTranslations, getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SETTINGS_KEYS = [
  'loyalty_earn_amount_syp',
  'loyalty_earn_points',
  'loyalty_point_value_syp',
  'loyalty_min_redemption_pts',
  'loyalty_max_redemption_pct',
  'referral_bonus_points',
] as const;

const DEFAULTS: Record<string, number> = {
  loyalty_earn_amount_syp: 1000,
  loyalty_earn_points: 10,
  loyalty_point_value_syp: 10,
  loyalty_min_redemption_pts: 100,
  loyalty_max_redemption_pct: 30,
  referral_bonus_points: 50,
};

/** جلب الإعدادات مباشرة من Supabase REST — service role key لتجاوز RLS */
async function fetchSettings(): Promise<Record<string, number>> {
  const result = { ...DEFAULTS };
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // يجب استخدام service role key لأن RLS تمنع anon من قراءة system_settings
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) return result;

    const keysParam = SETTINGS_KEYS.join(',');
    const res = await fetch(
      `${url}/rest/v1/system_settings?key=in.(${keysParam})&select=key,value`,
      {
        cache: 'no-store',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    );
    if (res.ok) {
      const rows: { key: string; value: string }[] = await res.json();
      for (const row of rows) {
        if (row.key in result) result[row.key] = Number(row.value) || result[row.key];
      }
    }
  } catch {}
  return result;
}

async function getLoyaltyData() {
  const [settings, sessionData] = await Promise.all([
    fetchSettings(),
    getSessionClient(),
  ]);

  const { client, user } = sessionData;
  let points = 0;
  let referral_code = '';
  let fullName = '';

  if (user) {
    // customer_profiles.id = auth.uid()
    const { data: profile } = await client
      .from('customer_profiles')
      .select('loyalty_points,referral_code,full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      points = profile.loyalty_points ?? 0;
      referral_code = profile.referral_code ?? '';
      fullName = profile.full_name ?? '';
    }
  }
  return { user, points, referral_code, fullName, settings };
}

export default async function LoyaltyPage() {
  const t = await getTranslations('loyalty');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const { user, points, referral_code, fullName, settings } = await getLoyaltyData();
  // 1 point = loyalty_point_value_syp
  const pointValueSyp = Math.floor(points * (settings.loyalty_point_value_syp || 10));
  const earnExample = settings.loyalty_earn_amount_syp;
  const earnPts     = settings.loyalty_earn_points;

  return (
    <main className="min-h-screen bg-background px-4 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/" className="text-xs text-primary hover:underline">{t('home')}</Link>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">{t('rewardsProgram')}</p>
          <h1 className="mt-1 text-3xl font-black text-[#1F1B16]">{t('loyaltyPoints')}</h1>
        </div>

        {user ? (
          <div className="rounded-3xl border border-border bg-background-card p-6 shadow-sm text-center space-y-3">
            {fullName && <p className="text-sm font-semibold text-[#6F6658]">{t('welcome', { name: fullName, fallback: `أهلاً ${fullName}` })}</p>}
            <p className="text-6xl font-black text-primary">{points.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')}</p>
            <p className="text-sm text-[#6F6658]">{t('pointsYouHave')}</p>
            <p className="text-xs text-text-muted">
              {t('equalsTo')} <strong className="text-primary">{pointValueSyp.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} {t('syp')}</strong> {t('discountWhenShopping')}
            </p>
            {referral_code && (
              <div className="mt-4 rounded-2xl bg-[#F3EDE3] px-4 py-4 space-y-2">
                <p className="text-xs text-[#6F6658]">{t('yourReferralCode')}</p>
                <p className="font-mono font-black text-[#1F1B16] text-2xl tracking-widest">{referral_code}</p>
                <p className="text-xs text-text-muted">
                  {t('shareCodeGet')} <strong>{settings.referral_bonus_points}</strong> {t('pointsPerReferral')}
                </p>
                <CopyReferralButton code={referral_code} />
              </div>
            )}
            <div className="pt-2">
              <Link href="/orders" className="inline-block rounded-xl border border-border px-5 py-2 text-sm font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                {t('viewOrders')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-background-card p-8 shadow-sm text-center space-y-4">
            <div className="text-4xl">⭐</div>
            <p className="text-lg font-bold text-[#1F1B16]">{t('loginToView')}</p>
            <p className="text-sm text-[#6F6658]">{t('loginMsg')}</p>
            <Link href="/auth/login" className="inline-block rounded-xl bg-primary px-8 py-3 text-sm font-bold text-text-primary hover:bg-primary transition-colors">
              {t('login')}
            </Link>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-3xl border border-border bg-background-card p-6 shadow-sm space-y-4">
          <h2 className="font-black text-[#1F1B16] text-lg">{t('howItWorks')}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-4 rounded-2xl bg-background p-4">
              <span className="text-3xl">🛍️</span>
              <div>
                <p className="font-bold text-[#1F1B16]">{t('earnOnPurchase')}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('forEvery')} <strong className="text-primary">{earnExample.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} {t('syp')}</strong> {t('youSpendYouGet')} <strong className="text-primary">{earnPts}</strong> {earnPts === 1 ? t('point') : t('points')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl bg-background p-4">
              <span className="text-3xl">💰</span>
              <div>
                <p className="font-bold text-[#1F1B16]">{t('usePointsAsDiscount')}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('every')} <strong className="text-primary">1</strong> {t('point')} = <strong className="text-primary">{settings.loyalty_point_value_syp}</strong> {t('discountAtCheckout', { percent: settings.loyalty_max_redemption_pct, fallback: `ل.س خصم عند الدفع (بحد أقصى ${settings.loyalty_max_redemption_pct}% من قيمة الطلب)` })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl bg-background p-4">
              <span className="text-3xl">👥</span>
              <div>
                <p className="font-bold text-[#1F1B16]">{t('getReferralBonus')}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('shareCodeAndGet')} <strong className="text-primary">{settings.referral_bonus_points}</strong> {t('pointsWhenRegistered')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-background-card p-5 shadow-sm">
          <p className="text-xs text-text-muted leading-6 text-center">
            💡 {t('storeBonusTip')}
          </p>
        </div>
      </div>
    </main>
  );
}