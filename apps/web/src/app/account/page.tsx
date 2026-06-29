/* eslint-disable */
// @ts-nocheck
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';

export const dynamic = 'force-dynamic';

export default async function AccountPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('full_name, phone, preferred_language, loyalty_points, referral_code')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] px-6 py-12">
      <div className="mx-auto max-w-lg">
        <nav className="mb-8">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">
            ← {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold mb-8">{t('nav.account')}</h1>

        {/* Profile info */}
        <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-6 mb-4">
          <h2 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">المعلومات الشخصية</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">{t('auth.fullName')}</span>
              <span className="text-[#E2E2E2]">{profile?.full_name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">{t('auth.email')}</span>
              <span className="text-[#E2E2E2] font-mono text-xs">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">{t('auth.phone')}</span>
              <span className="text-[#E2E2E2]">{profile?.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">{t('auth.preferredLanguage')}</span>
              <span className="text-[#E2E2E2]">{profile?.preferred_language === 'ar' ? t('auth.langAr') : t('auth.langEn')}</span>
            </div>
          </div>
        </div>

        {/* Loyalty points quick view */}
        <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#9CA3AF]">{t('loyalty.balance')}</p>
              <p className="text-3xl font-bold text-[#C9A84C] mt-1">{profile?.loyalty_points ?? 0}</p>
              <p className="text-xs text-[#6B7280]">{t('loyalty.pointsUnit')}</p>
            </div>
            <Link
              href="/loyalty"
              className="rounded-md border border-[#2E2E2E] px-4 py-2 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              {t('common.viewAll')}
            </Link>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/orders"
            className="flex items-center gap-3 rounded-md border border-[#2E2E2E] bg-[#151515] p-4 hover:border-[#C9A84C]/30 transition-colors"
          >
            <span className="text-xl">📦</span>
            <span className="text-sm text-[#E2E2E2]">{t('orders.title')}</span>
          </Link>
          <Link
            href="/loyalty"
            className="flex items-center gap-3 rounded-md border border-[#2E2E2E] bg-[#151515] p-4 hover:border-[#C9A84C]/30 transition-colors"
          >
            <span className="text-xl">⭐</span>
            <span className="text-sm text-[#E2E2E2]">{t('loyalty.title')}</span>
          </Link>
          <Link
            href="/exchange"
            className="flex items-center gap-3 rounded-md border border-[#2E2E2E] bg-[#151515] p-4 hover:border-[#C9A84C]/30 transition-colors"
          >
            <span className="text-xl">🔄</span>
            <span className="text-sm text-[#E2E2E2]">{t('exchange.title')}</span>
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-3 rounded-md border border-[#2E2E2E] bg-[#151515] p-4 hover:border-[#C9A84C]/30 transition-colors"
          >
            <span className="text-xl">❓</span>
            <span className="text-sm text-[#E2E2E2]">{t('footer.faq')}</span>
          </Link>
        </div>

        {/* Logout */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-sm border border-[#2E2E2E] py-2.5 text-sm text-red-400 hover:border-red-800 hover:bg-red-950/20 transition-colors"
          >
            {t('nav.logout')}
          </button>
        </form>
      </div>
    </main>
  );
}