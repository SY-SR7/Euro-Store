// @ts-nocheck
/* eslint-disable */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionClient } from '@/supabase-server';
import { ShoppingBag, Star, RefreshCw, User, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { LogoutButton } from '@/components/common/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const t = await getTranslations('auth');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  
  const { client: supabase, user } = await getSessionClient();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('loyalty_points,referral_code,full_name,phone')
    .eq('id', user.id)
    .maybeSingle();

  const { count: orderCount } = await supabase
    .from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', user.id);

  const quickLinks = [
    { href:'/orders',   icon:ShoppingBag, label:t('myOrders'),       badge: String(orderCount ?? 0) + ' ' + t('orderWord'),    badgeColor:'bg-blue-50 text-blue-700' },
    { href:'/loyalty',  icon:Star,        label:t('loyaltyPoints'),  badge: String(profile?.loyalty_points ?? 0) + ' ' + t('pointWord'), badgeColor:'bg-amber-50 text-amber-700' },
    { href:'/exchange', icon:RefreshCw,   label:t('exchangeRequests'), badge: null, badgeColor:'' },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg space-y-5">
        <h1 className="text-2xl font-black text-[#1C1917]">{t('myAccount')}</h1>

        {/* Profile card */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B8860B] shrink-0">
            <User className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#1C1917] truncate">{profile?.full_name ?? user.email}</p>
            <p className="text-xs text-[#A8A29E] truncate">{user.email}</p>
            {profile?.phone && <p className="text-xs text-[#A8A29E] mt-0.5">{profile.phone}</p>}
            {profile?.referral_code && (
              <p className="mt-1 font-mono text-xs text-[#A8A29E]">{t('referralCode')}: <span className="text-[#B8860B] font-bold">{profile.referral_code}</span></p>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid gap-3">
          {quickLinks.map(({ href, icon: Icon, label, badge, badgeColor }) => (
            <Link key={href} href={href}
              className="flex items-center justify-between rounded-2xl border border-[#E7E3DC] bg-white p-4 shadow-sm hover:border-[#C9A84C]/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#B8860B]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-[#1C1917]">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {badge && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>{badge}</span>}
                {isAr ? <ChevronLeft className="h-4 w-4 text-[#A8A29E]" /> : <ChevronRight className="h-4 w-4 text-[#A8A29E]" />}
              </div>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <LogoutButton />
      </div>
    </main>
  );
}
