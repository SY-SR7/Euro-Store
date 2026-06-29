/* eslint-disable */
// @ts-nocheck
import { getSessionClient } from '@/supabase-server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getLoyaltyData() {
  const { client, user } = await getSessionClient();
  const settingsRes = await client.from('system_settings').select('key,value')
    .in('key', ['loyalty_earn_amount_syp','loyalty_earn_points','loyalty_redeem_points_per_syp','loyalty_max_redeem_percent','loyalty_referral_bonus_points']);
  const s: Record<string,number> = { loyalty_earn_amount_syp:1000, loyalty_earn_points:10, loyalty_redeem_points_per_syp:1, loyalty_max_redeem_percent:20, loyalty_referral_bonus_points:50 };
  for (const row of (settingsRes.data ?? [])) { s[row.key] = Number(row.value) || s[row.key]; }

  let points = 0; let referral_code = '';
  if (user) {
    const { data: profile } = await client.from('customer_profiles').select('loyalty_points,referral_code').eq('id', user.id).single();
    points = (profile as any)?.loyalty_points ?? 0;
    referral_code = (profile as any)?.referral_code ?? '';
  }
  return { user, points, referral_code, settings: s };
}

export default async function LoyaltyPage() {
  const { user, points, referral_code, settings } = await getLoyaltyData();
  const pointsValueSyp = Math.floor(points / settings.loyalty_redeem_points_per_syp);

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-4 py-12" dir="rtl">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">برنامج المكافآت</p>
          <h1 className="mt-2 text-3xl font-black text-[#1F1B16]">نقاط الولاء</h1>
        </div>

        {user ? (
          <div className="rounded-3xl border border-[#E8DCC3] bg-white p-6 shadow-sm text-center">
            <p className="text-5xl font-black text-[#C9A84C]">{points.toLocaleString('ar-SY')}</p>
            <p className="mt-1 text-sm text-[#6F6658]">نقطة لديك الآن</p>
            <p className="mt-2 text-xs text-[#A8A29E]">تعادل حوالي {pointsValueSyp.toLocaleString('ar-SY')} ل.س خصم عند التسوق</p>
            {referral_code && (
              <div className="mt-4 rounded-xl bg-[#F3EDE3] px-4 py-3">
                <p className="text-xs text-[#6F6658] mb-1">كود الإحالة الخاص بك</p>
                <p className="font-mono font-black text-[#1F1B16] text-lg">{referral_code}</p>
                <p className="text-xs text-[#A8A29E] mt-1">شارك هذا الكود واحصل على {settings.loyalty_referral_bonus_points} نقطة عند كل إحالة</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#E8DCC3] bg-white p-6 shadow-sm text-center">
            <p className="text-[#6F6658] mb-4">سجّل الدخول لعرض نقاطك</p>
            <Link href="/auth/login" className="rounded-xl bg-[#C9A84C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#B8860B]">تسجيل الدخول</Link>
          </div>
        )}

        <div className="rounded-3xl border border-[#E8DCC3] bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-black text-[#1F1B16]">كيف يعمل البرنامج؟</h2>
          <div className="space-y-3 text-sm text-[#57534E]">
            <div className="flex items-start gap-3 rounded-xl bg-[#FAFAF8] p-4">
              <span className="text-2xl">🛍️</span>
              <div>
                <p className="font-bold text-[#1F1B16]">اكسب نقاطاً مع كل طلب</p>
                <p>مقابل كل {settings.loyalty_earn_amount_syp.toLocaleString('ar-SY')} ل.س تشتري بها، تحصل على {settings.loyalty_earn_points} نقطة</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#FAFAF8] p-4">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-bold text-[#1F1B16]">استبدل نقاطك بخصومات</p>
                <p>كل {settings.loyalty_redeem_points_per_syp} نقطة = 1 ل.س خصم على طلباتك القادمة</p>
                <p className="text-xs text-[#A8A29E] mt-1">الحد الأقصى: {settings.loyalty_max_redeem_percent}% من قيمة الطلب</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#FAFAF8] p-4">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="font-bold text-[#1F1B16]">مكافأة الإحالة</p>
                <p>ادعُ أصدقاءك وعندما يسجّلون واشتروا، تحصل على {settings.loyalty_referral_bonus_points} نقطة</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/products" className="rounded-xl bg-[#C9A84C] px-8 py-3 text-sm font-black text-white hover:bg-[#B8860B] transition-colors">تسوق الآن واكسب نقاطاً</Link>
        </div>
      </div>
    </main>
  );
}