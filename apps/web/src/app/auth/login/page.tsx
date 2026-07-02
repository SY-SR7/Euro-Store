// @ts-nocheck
/* eslint-disable */
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/account';
  
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const locale = useLocale();
  const t = useTranslations('auth');
  const isAr = locale === 'ar';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    
    router.refresh();
    router.replace(nextUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-background-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <Link href="/" className="text-lg font-black tracking-widest text-primary">EURO STORE</Link>
            <h1 className="mt-2 text-xl font-black text-text-primary">{t('loginTitle')}</h1>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">{t('email')}</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary placeholder:text-text-muted"
                placeholder="you@example.com" dir="ltr" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">{t('password')}</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                placeholder="••••••••" dir="ltr" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors">
              {loading ? t('loggingIn') : t('login')}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            {t('noAccount')}{' '}
            <Link href="/auth/register" className="font-bold text-primary hover:underline">{t('createAccount')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}