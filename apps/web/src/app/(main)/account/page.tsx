'use client';
/* eslint-disable */
// @ts-nocheck
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { User, ShoppingBag, Star, RefreshCw, LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('loyalty_points, referral_code')
    .eq('user_id', user.id)
    .maybeSingle();

  const { count: orderCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', user.id);

  const quickLinks = [
    { href: '/orders',   icon: ShoppingBag, label: t('orders.title'),   badge: String(orderCount ?? 0) },
    { href: '/loyalty',  icon: Star,        label: t('loyalty.title'),   badge: String(profile?.loyalty_points ?? 0) + ' ' + t('loyalty.pointsUnit') },
    { href: '/exchange', icon: RefreshCw,   label: t('exchange.title'),  badge: null },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Profile card */}
      <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-6 flex items-center gap-5 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A84C]/10 text-[#C9A84C] flex-shrink-0">
          <User className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#E2E2E2] truncate">{user.email}</p>
          {profile?.referral_code && (
            <p className="mt-1 text-xs text-[#6B7280] font-mono">
              {t('loyalty.referralCode')}: {profile.referral_code}
            </p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        {quickLinks.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-lg border border-[#2E2E2E] bg-[#151515] p-5 hover:border-[#C9A84C] transition-colors"
          >
            <Icon className="w-5 h-5 text-[#C9A84C]" />
            <div>
              <p className="text-sm font-medium text-[#E2E2E2] group-hover:text-[#C9A84C] transition-colors">{label}</p>
              {badge && (
                <p className="mt-1 text-xs text-[#9CA3AF]">{badge}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('auth.logout')}
        </button>
      </form>
    </div>
  );
}
