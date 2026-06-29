'use client';
/* eslint-disable */
// @ts-nocheck
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export const dynamic = 'force-dynamic';

export default async function LoyaltyPage() {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createSupabaseAdminClientFromEnv();

  const [profileResult, txResult] = await Promise.all([
    admin.from('customer_profiles').select('loyalty_points, referral_code').eq('user_id', user.id).maybeSingle(),
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
        <Link href="/" className="text-[#C9A84C] text-sm hover:underline">â† {t('common.appName')}</Link>

        <h1 className="mt-6 text-2xl font-semibold">{t('loyalty.title')}</h1>

        {/* Points balance */}
        <div className="mt-6 rounded-md border border-[#2E2E2E] bg-[#151515] p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#9CA3AF]">{t('loyalty.balance')}</p>
            <p className="mt-1 text-4xl font-bold text-[#C9A84C]">{profile?.loyalty_points ?? 0}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{t('loyalty.pointsUnit')}</p>
          </div>
        </div>

        {/* Referral */}
        {profile?.referral_code && (
          <div className="mt-4 rounded-md border border-[#2E2E2E] bg-[#151515] p-6">
            <p className="text-sm font-semibold text-[#E2E2E2]">{t('loyalty.referralTitle')}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">{t('loyalty.referralDescription')}</p>
            <div className="mt-4 flex items-center gap-3">
              <code className="flex-1 rounded-md border border-[#2E2E2E] bg-[#0F0F0F] px-4 py-2 text-[#C9A84C] font-mono text-lg tracking-widest">
                {profile.referral_code}
              </code>
              <button
                onClick={() => (navigator as any).clipboard.writeText(String(profile.referral_code))}
                className="rounded-md bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-2 text-sm text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors"
              >
                {t('loyalty.copyCode')}
              </button>
            </div>
          </div>
        )}

        {/* Transactions */}
        <h2 className="mt-8 text-lg font-semibold">{t('loyalty.history')}</h2>
        {txs.length === 0 ? (
          <p className="mt-4 text-sm text-[#9CA3AF]">{t('common.noData')}</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-md border border-[#2E2E2E]">
            <table className="w-full text-sm">
              <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
                <tr>
                  <th className="px-4 py-3 text-start">{t('loyalty.txDescription')}</th>
                  <th className="px-4 py-3 text-start">{t('common.date')}</th>
                  <th className="px-4 py-3 text-end">{t('loyalty.txPoints')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]">
                {txs.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 text-[#D6D3C7]">{String(tx.description)}</td>
                    <td className="px-4 py-3 text-[#9CA3AF] text-xs">{new Date(tx.created_at as string).toLocaleDateString('ar-SY')}</td>
                    <td className={`px-4 py-3 text-end font-semibold ${Number(tx.points) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(tx.points) > 0 ? '+' : ''}{String(tx.points)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

