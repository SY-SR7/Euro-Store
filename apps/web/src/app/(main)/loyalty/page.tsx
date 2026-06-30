/* eslint-disable */
// @ts-nocheck
import { getSessionClient } from '@/supabase-server';
import Link from 'next/link';
import { CopyReferralButton } from '@/components/loyalty/CopyReferralButton';
import { getTranslations, getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

async function getLoyaltyData() {
  const { client, user } = await getSessionClient();

  // Load settings
  const settingsRes = await client.from('system_settings').select('key,value')
    .in('key', ['loyalty_earn_amount_syp','loyalty_earn_points','loyalty_redeem_points_per_syp','loyalty_max_redeem_percent','loyalty_referral_bonus_points']);
  const s: Record<string,number> = {
    loyalty_earn_amount_syp: 1000,
    loyalty_earn_points: 10,
    loyalty_redeem_points_per_syp: 1,
    loyalty_max_redeem_percent: 20,
    loyalty_referral_bonus_points: 50,
  };
  for (const row of (settingsRes.data ?? [])) {
    s[row.key] = Number(row.value) || s[row.key];
  }

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
  return { user, points, referral_code, fullName, settings: s };
}

export default async function LoyaltyPage() {
  const t = await getTranslations('loyalty');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const { user, points, referral_code, fullName, settings } = await getLoyaltyData();
  const pointValueSyp = Math.floor(points / (settings.loyalty_redeem_points_per_syp || 1));
  const earnExample = settings.loyalty_earn_amount_syp;
  const earnPts     = settings.loyalty_earn_points;

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-4 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/" className="text-xs text-[#C9A84C] hover:underline">{t('home', { fallback: 'الرئيسية' })}</Link>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#C9A84C]">{t('rewardsProgram', { fallback: 'برنامج المكافآت' })}</p>
          <h1 className="mt-1 text-3xl font-black text-[#1F1B16]">{t('loyaltyPoints', { fallback: 'نقاط الولاء' })}</h1>
        </div>

        {user ? (
          <div className="rounded-3xl border border-[#E8DCC3] bg-white p-6 shadow-sm text-center space-y-3">
            {fullName && <p className="text-sm font-semibold text-[#6F6658]">{t('welcome', { name: fullName, fallback: `أهلاً ${fullName}` })}</p>}
            <p className="text-6xl font-black text-[#C9A84C]">{points.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')}</p>
            <p className="text-sm text-[#6F6658]">{t('pointsYouHave', { fallback: 'نقطة لديك الآن' })}</p>
            <p className="text-xs text-[#A8A29E]">
              {t('equalsTo', { fallback: 'تعادل حوالي' })} <strong className="text-[#C9A84C]">{pointValueSyp.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} {t('syp', { fallback: 'ل.س' })}</strong> {t('discountWhenShopping', { fallback: 'خصم عند التسوق' })}
            </p>
            {referral_code && (
              <div className="mt-4 rounded-2xl bg-[#F3EDE3] px-4 py-4 space-y-2">
                <p className="text-xs text-[#6F6658]">{t('yourReferralCode', { fallback: 'كود الإحالة الخاص بك' })}</p>
                <p className="font-mono font-black text-[#1F1B16] text-2xl tracking-widest">{referral_code}</p>
                <p className="text-xs text-[#A8A29E]">
                  {t('shareCodeGet', { fallback: 'شارك هذا الكود واحصل على' })} <strong>{settings.loyalty_referral_bonus_points}</strong> {t('pointsPerReferral', { fallback: 'نقطة عند كل إحالة' })}
                </p>
                <CopyReferralButton code={referral_code} />
              </div>
            )}
            <div className="pt-2">
              <Link href="/orders" className="inline-block rounded-xl border border-[#E8DCC3] px-5 py-2 text-sm font-bold text-[#57534E] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
                {t('viewOrders', { fallback: 'عرض طلباتي' })}
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#E8DCC3] bg-white p-8 shadow-sm text-center space-y-4">
            <div className="text-4xl">⭐</div>
            <p className="text-lg font-bold text-[#1F1B16]">{t('loginToView', { fallback: 'سجّل الدخول لعرض نقاطك' })}</p>
            <p className="text-sm text-[#6F6658]">{t('loginMsg', { fallback: 'اشترِ وأكسب نقاطاً واسترجعها كخصم في طلباتك القادمة' })}</p>
            <Link href="/auth/login" className="inline-block rounded-xl bg-[#C9A84C] px-8 py-3 text-sm font-bold text-white hover:bg-[#B8860B] transition-colors">
              {t('login', { fallback: 'تسجيل الدخول' })}
            </Link>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-3xl border border-[#E8DCC3] bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-black text-[#1F1B16] text-lg">{t('howItWorks', { fallback: 'كيف يعمل البرنامج؟' })}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-4 rounded-2xl bg-[#FAFAF8] p-4">
              <span className="text-3xl">🛍️</span>
              <div>
                <p className="font-bold text-[#1F1B16]">{t('earnOnPurchase', { fallback: 'اكسب نقاطاً عند كل شراء' })}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('forEvery', { fallback: 'لكل' })} <strong className="text-[#C9A84C]">{earnExample.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} {t('syp', { fallback: 'ل.س' })}</strong> {t('youSpendYouGet', { fallback: 'تنفقها، تحصل على' })} <strong className="text-[#C9A84C]">{earnPts}</strong> {earnPts === 1 ? t('point', { fallback: 'نقطة' }) : t('points', { fallback: 'نقاط' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl bg-[#FAFAF8] p-4">
              <span className="text-3xl">💰</span>
              <div>
                <p className="font-bold text-[#1F1B16]">{t('usePointsAsDiscount', { fallback: 'استخدم نقاطك كخصم' })}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('every', { fallback: 'كل' })} <strong className="text-[#C9A84C]">{settings.loyalty_redeem_points_per_syp}</strong> {settings.loyalty_redeem_points_per_syp === 1 ? t('point', { fallback: 'نقطة' }) : t('points', { fallback: 'نقاط' })} = 1 {t('syp', { fallback: 'ل.س' })} {t('discountAtCheckout', { percent: settings.loyalty_max_redeem_percent, fallback: `خصم عند الدفع (بحد أقصى ${settings.loyalty_max_redeem_percent}% من قيمة الطلب)` })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl bg-[#FAFAF8] p-4">
              <span className="text-3xl">👥</span>
              <div>
                <p className="font-bold text-[#1F1B16]">{t('getReferralBonus', { fallback: 'احصل على مكافأة الإحالة' })}</p>
                <p className="text-[#6F6658] mt-1">
                  {t('shareCodeAndGet', { fallback: 'شارك كودك مع أصدقائك وأحصل على' })} <strong className="text-[#C9A84C]">{settings.loyalty_referral_bonus_points}</strong> {t('pointsWhenRegistered', { fallback: 'نقطة عند تسجيل كل شخص' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E8DCC3] bg-white p-5 shadow-sm">
          <p className="text-xs text-[#A8A29E] leading-6 text-center">
            💡 {t('storeBonusTip', { fallback: 'يمكنك أيضاً كسب النقاط في الفروع — اطلب من الموظف مسح كود QR الخاص بك عند الدفع' })}
          </p>
        </div>
      </div>
    </main>
  );
}