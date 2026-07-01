'use client';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LogoutButton() {
  const t = useTranslations('auth');
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    // Clear cookies
    document.cookie = 'sb-access-token=; Max-Age=0; path=/';
    document.cookie = 'sb-refresh-token=; Max-Age=0; path=/';
    router.push('/');
    router.refresh();
  }

  return (
    <button onClick={handleLogout}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-background-card py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors shadow-sm">
      <LogOut className="h-4 w-4" />
      {t('logout')}
    </button>
  );
}