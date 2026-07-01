'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RefreshCw, History, LogOut } from 'lucide-react';

const navItems = [
  { href: '/exchange',         icon: RefreshCw, labelKey: 'partner.exchangeScanner' },
  { href: '/exchange/history', icon: History,   labelKey: 'partner.exchangeHistory' },
];

export function PartnerSidebar() {
  const t       = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col bg-[#111111] border-e border-[#2E2E2E]">
      <div className="flex h-16 items-center px-5 border-b border-[#2E2E2E]">
        <span className="font-semibold text-primary">Partner</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active ? 'bg-primary/10 text-primary' : 'text-[#9CA3AF] hover:bg-[#1A1A1A] hover:text-[#E2E2E2]'
            }`}>
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#2E2E2E]">
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#9CA3AF] hover:text-red-400 transition-colors">
            <LogOut className="h-4 w-4" />
            {t('auth.logout')}
          </button>
        </form>
      </div>
    </aside>
  );
}
