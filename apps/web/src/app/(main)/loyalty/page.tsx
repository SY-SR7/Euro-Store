// @ts-nocheck
/* eslint-disable */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/supabase-server';
import { CopyReferralButton } from '@/components/loyalty/CopyReferralButton';

export const dynamic = 'force-dynamic';

const TX_TYPE_LABEL: Record<string, string> = {
  earn: 'مكتسبة',
  redeem: 'مستخدمة',
  referral: 'إحالة',
  grant: 'منحة',
  expire: 'منتهية',
};

const TX_TYPE_COLOR: Record<string, string> = {
  earn: 'text-green-400',
  redeem: 'text-red-400',
  referral: 'text-blue-400',
  grant: 'text-[#C9A84C]',
  expire: 'text-[#9CA3AF]',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export default async function LoyaltyPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const admin = createAdminSupabaseClient();

  const [profileResult, txResult] = await Promise.all([
    admin
      .from('customer_profiles')
      .select('id, loyalty_points, referral_code')
      .eq('user_id', user.id)
      .maybeSingle(),

    admin
      .from('loyalty_points_transactions')
      .select('id, points, type, description, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const profile = profileResult.data;
  const txs = txResult.data ?? [];

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-12 text-[#EDE7DD]" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/" className="text-sm font-bold text-[#C9A84C] hover:underline">
          ← العودة إلى المتجر
        </Link>

        <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
          <p className="text-sm font-black text-[#C9A84C]">Euro Store Loyalty</p>
          <h1 className="mt-2 text-3xl font-black text-white">نقاط الولاء</h1>
          <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
            تابع رصيد نقاطك، انسخ كود الإحالة، وراجع سجل النقاط المكتسبة والمستخدمة.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl md:col-span-2">
            <p className="text-sm text-[#9CA3AF]">رصيدك الحالي</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-black text-[#C9A84C]">
                  {formatNumber(profile?.loyalty_points ?? 0)}
                </p>
                <p className="mt-2 text-sm text-[#9CA3AF]">نقطة متاحة</p>
              </div>
              <div className="text-6xl opacity-20">★</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
            <p className="text-sm text-[#9CA3AF]">عدد العمليات</p>
            <p className="mt-4 text-5xl font-black text-white">{formatNumber(txs.length)}</p>
            <p className="mt-2 text-sm text-[#9CA3AF]">آخر 30 حركة</p>
          </div>
        </section>

        {profile?.referral_code && (
          <section className="rounded-3xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[#C9A84C]">كود الإحالة الخاص بك</h2>
            <p className="mt-2 text-sm leading-7 text-[#EDE7DD]">
              شارك هذا الكود مع أصدقائك لتحصل على مكافآت عند نجاح الإحالة حسب شروط المتجر.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="flex-1 rounded-2xl border border-white/10 bg-[#0F0F0F] px-5 py-3 text-center font-mono text-xl font-black text-[#C9A84C] sm:text-right">
                {profile.referral_code}
              </code>
              <CopyReferralButton code={profile.referral_code} />
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
          <h2 className="text-xl font-black text-white">كيف تعمل نقاط الولاء؟</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-black text-[#C9A84C]">اكسب نقاطاً</p>
              <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                كل عملية شراء مؤهلة تضيف نقاطاً إلى رصيدك حسب قواعد المتجر.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-black text-[#C9A84C]">استبدلها كخصم</p>
              <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                يمكن استخدام النقاط لتخفيض جزء من قيمة الطلب ضمن حد أقصى يحدده المتجر.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-black text-[#C9A84C]">شارك الإحالة</p>
              <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                شارك كودك مع الأصدقاء لتحصل على مكافأة عند نجاح الإحالة.
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
          <div className="border-b border-white/10 p-6">
            <h2 className="text-xl font-black text-white">سجل النقاط</h2>
            <p className="mt-2 text-sm text-[#9CA3AF]">آخر عمليات الكسب والاستخدام والإحالات.</p>
          </div>

          {txs.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#9CA3AF]">
              لا توجد معاملات نقاط بعد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-[#C9A84C]">
                  <tr>
                    <th className="px-4 py-4 text-right font-black">النوع</th>
                    <th className="px-4 py-4 text-right font-black">النقاط</th>
                    <th className="px-4 py-4 text-right font-black">التفاصيل</th>
                    <th className="px-4 py-4 text-right font-black">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {txs.map((tx) => (
                    <tr key={tx.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                      <td className={`px-4 py-4 font-black ${TX_TYPE_COLOR[tx.type] ?? 'text-[#9CA3AF]'}`}>
                        {TX_TYPE_LABEL[tx.type] ?? tx.type}
                      </td>
                      <td className={`px-4 py-4 font-black ${Number(tx.points) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {Number(tx.points) > 0 ? '+' : ''}
                        {formatNumber(tx.points)}
                      </td>
                      <td className="max-w-[280px] truncate px-4 py-4 text-[#9CA3AF]">
                        {tx.description ?? '—'}
                      </td>
                      <td className="px-4 py-4 text-[#9CA3AF]">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString('ar-SY') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="text-center">
          <Link href="/products" className="text-sm font-black text-[#C9A84C] hover:underline">
            تسوّق واكسب المزيد من النقاط ←
          </Link>
        </div>
      </div>
    </main>
  );
}