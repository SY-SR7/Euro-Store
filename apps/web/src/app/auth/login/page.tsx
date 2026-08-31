'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';
import { safeInternalPath } from '@eurostore/shared';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const nextUrl = safeInternalPath(searchParams.get('next'), '/account');
  
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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    if (!response.ok) {
      setError(payload?.error?.message || t('loginError', { fallback: 'تعذر تسجيل الدخول' }));
      setLoading(false);
      return;
    }

    window.location.assign(nextUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-background-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <Link href="/" className="flex justify-center">
              <img src="/images/logo.png" alt="Euro Store" className="h-16 w-auto object-contain" />
            </Link>
            <h1 className="mt-2 text-xl font-black text-text-primary">{t('loginTitle')}</h1>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={(event) => { void handleLogin(event); }} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-text-primary">{t('email')}</label>
              <input id="login-email" name="email" autoComplete="email" spellCheck={false} type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary placeholder:text-text-muted"
                placeholder="you@example.com" dir="ltr" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-semibold text-text-primary">{t('password')}</label>
                <Link href="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>
              <input id="login-password" name="password" autoComplete="current-password" spellCheck={false} type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                placeholder="••••••••" dir="ltr" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors">
              {loading ? t('loggingIn') : t('login')}
            </button>
          </form>

          <div className="mt-4 flex flex-col space-y-3">
            <div className="flex items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="mx-2 text-xs text-text-muted">{t('or')}</span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <button
              onClick={() => { void supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}` } }); }}
              className="flex w-full items-center justify-center rounded-xl border border-border bg-background py-3 text-sm font-semibold text-text-primary hover:bg-background-card transition-colors"
            >
              {t('continueWithGoogle')}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-text-muted">
            {t('noAccount')}{' '}
            <Link href="/auth/register" className="font-bold text-primary hover:underline">{t('createAccount')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
