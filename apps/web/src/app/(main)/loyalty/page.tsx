import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';
import Link from 'next/link';
import { CopyReferralButton } from '@/components/loyalty/CopyReferralButton';
import { LoyaltyQRCode } from '@/components/loyalty/LoyaltyQRCode';
import { getTranslations, getLocale } from 'next-intl/server';
import { createLoyaltyQrObject } from '@/app/api/auth/_lib';
import { BadgeDollarSign, Gift, Lightbulb, ShoppingBag, Users } from 'lucide-react';
import { AuthModalButton } from '@/components/auth/AuthAwareLink';

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

async function fetchSettings(): Promise<Record<string, number>> {
  const result = { ...DEFAULTS };
  try {
    const admin = createAdminSupabaseClient();
    const { data: rows } = await admin.from('system_settings').select('key, value').in('key', [...SETTINGS_KEYS]);
    for (const row of rows ?? []) {
      if (row.key in result) result[row.key] = Number(row.value) || result[row.key];
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
  let qrCodeUrl = '';

  if (user) {
    const { data: profile } = await client
      .from('customer_profiles')
      .select('loyalty_points,referral_code,full_name,qr_code_url,loyalty_qr_version')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      points = profile.loyalty_points ?? 0;
      referral_code = profile.referral_code ?? '';
      fullName = profile.full_name ?? '';
      const admin = createAdminSupabaseClient();
      let qrObjectKey = profile.qr_code_url;
      if (profile.loyalty_qr_version !== 2 || !qrObjectKey) {
        const regenerated = await createLoyaltyQrObject(admin, user.id);
        if (regenerated) {
          qrObjectKey = regenerated;
          await admin.from('customer_profiles').update({ qr_code_url: regenerated, loyalty_qr_version: 2 }).eq('id', user.id);
        } else {
          qrObjectKey = null;
        }
      }
      if (qrObjectKey?.startsWith('loyalty-qr-codes/')) {
        const path = qrObjectKey.replace(/^loyalty-qr-codes\//, '');
        const { data: signed } = await admin.storage.from('loyalty-qr-codes').createSignedUrl(path, 60 * 60);
        qrCodeUrl = signed?.signedUrl ?? '';
      }
    }
  }
  return { user, points, referral_code, fullName, settings, qrCodeUrl };
}

export default async function LoyaltyPage() {
  const t = await getTranslations('loyalty');
  const locale = await getLocale();
  const { user, points, referral_code, fullName, settings, qrCodeUrl } = await getLoyaltyData();
  const pointValueSyp = Math.floor(points * (settings.loyalty_point_value_syp || 10));
  const earnExample = settings.loyalty_earn_amount_syp;
  const earnPts     = settings.loyalty_earn_points;

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/" className="text-xs text-primary hover:underline">{t('home')}</Link>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">{t('rewardsProgram')}</p>
          <h1 className="mt-1 text-3xl font-black text-[#1F1B16]">{t('loyaltyPoints')}</h1>
        </div>

        {user ? (
          <>
            <div className="space-y-3 rounded-lg border border-border bg-background-card p-6 text-center shadow-sm">
              {fullName && <p className="text-sm font-semibold text-[#6F6658]">{t('welcome', { name: fullName })}</p>}
              <p className="text-6xl font-black text-primary">{points.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')}</p>
              <p className="text-sm text-[#6F6658]">{t('pointsYouHave')}</p>
              <p className="text-xs text-text-muted">
                {t('equalsTo')} <strong className="text-primary">{pointValueSyp.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} {t('syp')}</strong> {t('discountWhenShopping')}
              </p>
              <div className="pt-2">
                <Link href="/orders" className="inline-block rounded-lg border border-border px-5 py-2 text-sm font-bold text-text-secondary transition-colors hover:border-primary hover:text-primary">
                  {t('viewOrders')}
                </Link>
              </div>
            </div>

            {qrCodeUrl ? (
              <LoyaltyQRCode qrCodeUrl={qrCodeUrl} customerName={fullName || t('customerFallback')} />
            ) : (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-900">
                {t('qrUnavailable')}
              </div>
            )}

            {referral_code && (
              <div className="space-y-2 rounded-lg border border-border bg-background-card p-6 text-center shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('yourReferralCode')}</p>
                <p className="font-mono font-black text-[#1F1B16] text-2xl tracking-widest">{referral_code}</p>
                <p className="text-xs text-text-muted">
                  {t('shareCodeGet')} <strong>{settings.referral_bonus_points}</strong> {t('pointsPerReferral')}
                </p>
                <CopyReferralButton code={referral_code} />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 rounded-lg border border-border bg-background-card p-8 text-center shadow-sm">
            <Gift className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <p className="text-lg font-bold text-[#1F1B16]">{t('loginToView')}</p>
            <p className="text-sm text-[#6F6658]">{t('loginMsg')}</p>
            <AuthModalButton next="/loyalty" className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-bold text-text-primary transition-colors hover:bg-primary">
              {t('login')}
            </AuthModalButton>
          </div>
        )}

        <div className="space-y-4 rounded-lg border border-border bg-background-card p-6 shadow-sm">
          <h2 className="font-black text-[#1F1B16] text-lg">{t('howItWorks')}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-4 rounded-lg bg-background p-4">
              <ShoppingBag className="mt-0.5 h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-bold text-[#1F1B16]">{t('earnOnPurchase')}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('forEvery')} <strong className="text-primary">{earnExample.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} {t('syp')}</strong> {t('youSpendYouGet')} <strong className="text-primary">{earnPts}</strong> {earnPts === 1 ? t('point') : t('points')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg bg-background p-4">
              <BadgeDollarSign className="mt-0.5 h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-bold text-[#1F1B16]">{t('usePointsAsDiscount')}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('every')} <strong className="text-primary">1</strong> {t('point')} = <strong className="text-primary">{settings.loyalty_point_value_syp}</strong> {t('discountAtCheckout', { percent: settings.loyalty_max_redemption_pct })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg bg-background p-4">
              <Users className="mt-0.5 h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-bold text-[#1F1B16]">{t('getReferralBonus')}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('shareCodeAndGet')} <strong className="text-primary">{settings.referral_bonus_points}</strong> {t('pointsWhenRegistered')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background-card p-5 shadow-sm">
          <p className="flex items-center justify-center gap-2 text-center text-xs leading-6 text-text-muted">
            <Lightbulb className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {t('storeBonusTip')}
          </p>
        </div>
      </div>
    </main>
  );
}
