// @ts-nocheck
/* eslint-disable */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { ShoppingBag, Star, RefreshCw, LogOut, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('loyalty_points, referral_code, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const { count: orderCount } = await supabase
    .from('orders').select('id', { count:'exact', head:true }).eq('customer_id', user.id);

  const quickLinks = [
    { href:'/orders',   icon:ShoppingBag, label:t('orders.title'),   badge:String(orderCount??0), badgeColor:'bg-blue-50 text-blue-700' },
    { href:'/loyalty',  icon:Star,        label:t('loyalty.title'),   badge:String(profile?.loyalty_points??0)+' '+t('loyalty.pointsUnit'), badgeColor:'bg-amber-50 text-amber-700' },
    { href:'/exchange', icon:RefreshCw,   label:t('exchange.title'),  badge:null, badgeColor:'' },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-lg space-y-5">
        <h1 className="text-2xl font-black text-[#1C1917]">حسابي</h1>

        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B8860B] shrink-0">
            <User className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#1C1917] truncate">{profile?.full_name ?? user.email}</p>
            <p className="text-xs text-[#A8A29E] truncate">{user.email}</p>
            {profile?.referral_code && (
              <p className="mt-1 font-mono text-xs text-[#A8A29E]">كود الإحالة: {profile.referral_code}</p>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {quickLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="flex items-center justify-between rounded-2xl border border-[#E7E3DC] bg-white p-4 shadow-sm hover:border-[#B8860B] transition-colors">
              <div className="flex items-center gap-3">
                <l.icon className="h-5 w-5 text-[#B8860B]" />
                <span className="font-semibold text-[#1C1917]">{l.label}</span>
              </div>
              {l.badge && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${l.badgeColor}`}>{l.badge}</span>}
            </Link>
          ))}
        </div>

        <form action="/api/auth/logout" method="post">
          <button type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors">
            <LogOut className="h-4 w-4" />
            <span>تسجيل الخروج</span>
          </button>
        </form>
      </div>
    </main>
  );
}