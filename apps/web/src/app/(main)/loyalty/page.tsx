// @ts-nocheck
/* eslint-disable */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/supabase-server';
import { CopyReferralButton } from '@/components/loyalty/CopyReferralButton';

export const dynamic = 'force-dynamic';

const TX_TYPE_LABEL: Record<string, string> = {
  earn:'مكسوب', redeem:'مستخدم', referral:'إحالة', grant:'منحة', expire:'منتهي',
};
const TX_TYPE_COLOR: Record<string, string> = {
  earn:'text-green-600 bg-green-50', redeem:'text-red-600 bg-red-50',
  referral:'text-blue-600 bg-blue-50', grant:'text-amber-600 bg-amber-50',
  expire:'text-stone-500 bg-stone-100',
};

export default async function LoyaltyPage() {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminSupabaseClient();
  const [profileResult, txResult] = await Promise.all([
    supabase.from('customer_profiles').select('loyalty_points, referral_code').eq('user_id', user.id).maybeSingle(),
    admin.from('loyalty_points_transactions').select('id, points, type, description, created_at')
      .eq('customer_id', user.id).order('created_at', { ascending: false }).limit(30),
  ]);

  const profile = profileResult.data;
  const txs     = txResult.data ?? [];

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/" className="text-sm text-[#B8860B] hover:underline">الرئيسية</Link>
          <h1 className="mt-3 text-2xl font-black text-[#1C1917]">{t('loyalty.title')}</h1>
        </div>

        {/* Points Balance */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#A8A29E]">{t('loyalty.balance')}</p>
              <p className="mt-1 text-4xl font-black text-[#B8860B]">{profile?.loyalty_points ?? 0}</p>
              <p className="mt-1 text-xs text-[#A8A29E]">{t('loyalty.pointsUnit')}</p>
            </div>
            <div className="text-5xl text-[#E7E3DC]">★</div>
          </div>
        </div>

        {/* Referral Code */}
        {profile?.referral_code && (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 shadow-sm">
            <p className="mb-3 font-black text-[#1C1917]">{t('loyalty.referralCode')}</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 rounded-xl border border-[#E7E3DC] bg-[#FAFAF8] px-4 py-3 font-mono text-sm text-[#B8860B]">
                {profile.referral_code}
              </code>
              <CopyReferralButton code={profile.referral_code} />
            </div>
          </div>
        )}

        {/* Transactions */}
        {txs.length > 0 && (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white shadow-sm">
            <h2 className="border-b border-[#E7E3DC] px-5 py-4 font-black text-[#1C1917]">سجل المعاملات</h2>
            <div className="divide-y divide-[#F0ECE6]">
              {txs.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${TX_TYPE_COLOR[tx.type] ?? 'text-stone-500 bg-stone-100'}`}>
                      {TX_TYPE_LABEL[tx.type] ?? tx.type}
                    </span>
                    {tx.description && <p className="mt-1 text-xs text-[#A8A29E]">{tx.description}</p>}
                  </div>
                  <div className="text-left">
                    <p className={`font-black ${tx.type==='redeem'||tx.type==='expire' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type==='redeem'||tx.type==='expire' ? '-' : '+'}{tx.points}
                    </p>
                    <p className="text-xs text-[#A8A29E]">{new Date(tx.created_at).toLocaleDateString('ar-SY')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}