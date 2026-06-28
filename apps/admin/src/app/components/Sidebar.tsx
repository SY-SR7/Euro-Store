'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  // Do not show sidebar on auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/totp')) {
    return null;
  }

  const navItems = [
    { name: 'لوحة القيادة', href: '/dashboard', icon: LayoutDashboard },
    { name: 'المنتجات', href: '/products', icon: Package },
    { name: 'الطلبات', href: '/orders', icon: ShoppingCart },
    { name: 'فريق العمل (Helpers)', href: '/team/helpers', icon: Users },
    { name: 'الشركاء (Partners)', href: '/team/partners', icon: Users },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#1A1D24] border-l border-[#252830] h-screen flex flex-col fixed right-0 top-0 z-50">
      <div className="p-6 border-b border-[#252830]">
        <h1 className="text-xl font-bold text-white tracking-wide">EUROSTORE<span className="text-[#C9A84C] text-sm ml-2">ADMIN</span></h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-[#252830] text-white' 
                  : 'text-gray-400 hover:bg-[#252830]/50 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#252830]">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 w-full transition-colors">
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
