// @ts-nocheck
/* eslint-disable */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionClient } from '@/supabase-server';
import { ShoppingBag, Star, RefreshCw, User, LogOut, ChevronLeft, ChevronRight, Phone, ShieldCheck, FileText, Info } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { LogoutButton } from '@/components/common/LogoutButton';
import { AccountLanguageButton } from '@/components/account/AccountLanguageButton';

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

  const infoLinks = [
    { href:'/contact', icon:Phone, label: isAr ? 'تواصل معنا' : 'Contact Us' },
    { href:'/about',   icon:Info, label: isAr ? 'عن المتجر' : 'About Us' },
    { href:'/privacy', icon:ShieldCheck, label: isAr ? 'سياسة الخصوصية' : 'Privacy Policy' },
    { href:'/terms',   icon:FileText, label: isAr ? 'الشروط والأحكام' : 'Terms & Conditions' },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg space-y-5">
        <h1 className="text-2xl font-black text-text-primary">{t('myAccount')}</h1>

        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-background-card p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7] text-primary shrink-0">
            <User className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-text-primary truncate">{profile?.full_name ?? user.email}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
            {profile?.phone && <p className="text-xs text-text-muted mt-0.5">{profile.phone}</p>}
            {profile?.referral_code && (
              <p className="mt-1 font-mono text-xs text-text-muted">{t('referralCode')}: <span className="text-primary font-bold">{profile.referral_code}</span></p>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid gap-3">
          {quickLinks.map(({ href, icon: Icon, label, badge, badgeColor }) => (
            <Link key={href} href={href}
              className="flex items-center justify-between rounded-2xl border border-border bg-background-card p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7] text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-text-primary">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {badge && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>{badge}</span>}
                {isAr ? <ChevronLeft className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}
              </div>
            </Link>
          ))}
        </div>

        {/* Preferences */}
        <div className="grid gap-3">
          <h2 className="text-sm font-bold text-text-muted px-2 mt-2">{isAr ? 'التفضيلات' : 'Preferences'}</h2>
          <AccountLanguageButton />
        </div>

        {/* Info links */}
        <div className="grid gap-3">
          <h2 className="text-sm font-bold text-text-muted px-2 mt-2">{isAr ? 'المعلومات والدعم' : 'Information & Support'}</h2>
          {infoLinks.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center justify-between rounded-2xl border border-border bg-background-card p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated text-text-secondary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-text-primary">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {isAr ? <ChevronLeft className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}
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
