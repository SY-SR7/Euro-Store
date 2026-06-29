'use client';

import Link from 'next/link';
import {
  Bell,
  Globe,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export default function Navbar() {
  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E0D8] bg-white/95 backdrop-blur-xl" dir="rtl">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="القائمة"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard">
            <p className="text-sm font-black text-[#1C1917]">EUROSTORE</p>
            <p className="text-[11px] font-semibold text-[#A8A29E]">لوحة الإدارة</p>
          </Link>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
            <input
              placeholder="بحث في الطلبات، المنتجات، العملاء..."
              className="h-10 w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] pr-10 pl-4 text-sm outline-none focus:border-[#B8860B]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="تحديث"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="اللغة"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E5E0D8] px-3 text-xs font-black text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]"
          >
            <Globe className="h-4 w-4" />
            AR
          </button>

          <Link
            href="/settings"
            aria-label="الإعدادات"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <Link
            href="/notifications"
            aria-label="الإشعارات"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
          </Link>

          <div className="hidden h-10 items-center gap-2 rounded-xl border border-[#E5E0D8] bg-[#FFFBEB] px-3 lg:flex">
            <ShieldCheck className="h-4 w-4 text-[#B8860B]" />
            <div className="leading-tight">
              <p className="text-xs font-black text-[#1C1917]">Admin</p>
              <p className="text-[10px] text-[#A8A29E]">آمن</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            aria-label="تسجيل الخروج"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E0D8] text-[#57534E] hover:border-red-300 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}