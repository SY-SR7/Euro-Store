// @ts-nocheck
/* eslint-disable */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { CopyReferralButton } from '@/components/loyalty/CopyReferralButton';

export const dynamic = 'force-dynamic';

const TX_TYPE_LABEL: Record<string, string> = {
  earn:     'مكسوب',
  redeem:   'مستخدم',
  referral: 'إحالة',
  grant:    'منحة',
  expire:   'منتهي الصلاحية',
};
const TX_TYPE_COLOR: Record<string, string> = {
  earn:     'text-green-400',
  redeem:   'text-red-400',
  referral: 'text-blue-400',
  grant:    'text-[#C9A84C]',
  expire:   'text-[#9CA3AF]',
};

export default async function LoyaltyPage() {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminSupabaseClient();


    admin.from('loyalty_points_transactions')
      .select('id, points, type, description, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const profile = profileResult.data;
  const txs     = txResult.data ?? [];

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-12 text-[#E2E2E2]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-[#C9A84C] text-sm hover:underline"> {t('common.appName')}</Link>

        <h1 className="mt-6 text-2xl font-semibold">{t('loyalty.title')}</h1>

        {/* Points balance */}
        <div className="mt-6 rounded-md border border-[#2E2E2E] bg-[#151515] p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#9CA3AF]">{t('loyalty.balance')}</p>
            <p className="mt-1 text-4xl font-bold text-[#C9A84C]">{profile?.loyalty_points ?? 0}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{t('loyalty.pointsUnit')}</p>
          </div>
          <div className="text-4xl opacity-20">★</div>
        </div>

        {/* Earn Formula */}
        <div className="mt-4 rounded-md border border-[#2E2E2E] bg-[#151515] p-5">
          <p className="text-sm font-semibold text-[#C9A84C] mb-3">كيف تكسب النقاط؟</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded bg-[#0F0F0F] p-3 text-center">
              <p className="text-[#9CA3AF] text-xs mb-1">كل</p>
              <p className="text-[#E2E2E2] font-bold">{earnAmount.toLocaleString('ar-SA')} ل.س</p>
              <p className="text-[#9CA3AF] text-xs mt-1">تحصل على</p>
              <p className="text-[#C9A84C] font-bold text-lg">{earnPoints} نقطة</p>
            </div>
            <div className="rounded bg-[#0F0F0F] p-3 text-center">
              <p className="text-[#9CA3AF] text-xs mb-1">كل</p>
              <p className="text-[#E2E2E2] font-bold">{redeemRate} نقطة</p>
              <p className="text-[#9CA3AF] text-xs mt-1">تساوي</p>
              <p className="text-[#C9A84C] font-bold text-lg">1 ل.س خصم</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#6B7280] text-center">
            يمكن استخدام النقاط بحد أقصى {maxRedeemPct}% من قيمة الطلب
          </p>
        </div>

        {/* Referral */}
        {profile?.referral_code && (
          <div className="mt-4 rounded-md border border-[#2E2E2E] bg-[#151515] p-6">
            <p className="text-sm font-semibold text-[#E2E2E2]">{t('loyalty.referralTitle')}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">{t('loyalty.referralDescription')}</p>
            <div className="mt-4 flex items-center gap-3">
              <code className="flex-1 rounded-md border border-[#2E2E2E] bg-[#0F0F0F] px-4 py-2 text-[#C9A84C] font-mono text-lg">
                {profile.referral_code}
              </code>
              <CopyReferralButton code={profile.referral_code} />
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-[#9CA3AF]">سجل النقاط</h2>
          {txs.length === 0 ? (
            <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-6 text-center text-sm text-[#9CA3AF]">
              لا توجد معاملات بعد
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
              <table className="w-full text-sm">
                <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
                  <tr>
                    <th className="px-4 py-3 text-start">النوع</th>
                    <th className="px-4 py-3 text-start">النقاط</th>
                    <th className="px-4 py-3 text-start">التفاصيل</th>
                    <th className="px-4 py-3 text-start">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E2E]">
                  {txs.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#1A1A1A]">
                      <td className={`px-4 py-3 text-xs font-semibold ${TX_TYPE_COLOR[tx.type] ?? 'text-[#9CA3AF]'}`}>
                        {TX_TYPE_LABEL[tx.type] ?? tx.type}
                      </td>
                      <td className={`px-4 py-3 font-bold ${tx.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#9CA3AF] max-w-[200px] truncate">{tx.description ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-[#9CA3AF]">{new Date(tx.created_at).toLocaleDateString('ar-SY')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/products" className="text-sm text-[#C9A84C] hover:underline">تسوّق وأكسب المزيد من النقاط →</Link>
        </div>
      </div>
    </main>
  );
}