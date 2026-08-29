/* eslint-disable */
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLocale, useTranslations } from 'next-intl';
import { safeInternalPath } from '@eurostore/shared';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const nextUrl = safeInternalPath(searchParams.get('next'), '/account');

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [referral, setReferral] = useState(searchParams.get('ref')?.toUpperCase() ?? '');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const locale = useLocale();
  const t = useTranslations('auth');
  const isAr = locale === 'ar';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: name,
        email,
        password,
        phone,
        preferred_language: isAr ? 'ar' : 'en',
        referral_code: referral.trim().toUpperCase(),
      }),
    });
    if (!response.ok) {
      setError(t('registerError', { fallback: 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مجدداً.' }));
      setLoading(false);
      return;
    }
    window.location.assign(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-background-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <Link href="/" className="flex justify-center">
              <img src="/images/logo.png" alt="Euro Store" className="h-16 w-auto object-contain" />
            </Link>
            <h1 className="mt-2 text-xl font-black text-text-primary">{t('registerTitle')}</h1>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">{t('fullName')}</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary placeholder:text-text-muted"
                placeholder={t('namePlaceholder')} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">{t('email')}</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary placeholder:text-text-muted"
                placeholder="you@example.com" dir="ltr" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">{t('phone', { fallback: 'رقم الهاتف' })}</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required minLength={6} maxLength={32}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary placeholder:text-text-muted"
                placeholder="09XXXXXXXX" dir="ltr" autoComplete="tel" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">{t('password')}</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={12} maxLength={128}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,128}"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                placeholder={t('passwordPlaceholder')} dir="ltr" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">{t('referralCode', { fallback: 'كود الإحالة (اختياري)' })}</label>
              <input aria-label={t('referralCode', { fallback: 'كود الإحالة (اختياري)' })} type="text" value={referral} onChange={e=>setReferral(e.target.value.toUpperCase())} minLength={8} maxLength={12}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm uppercase text-text-primary outline-none transition focus:border-primary placeholder:text-text-muted"
                dir="ltr" autoComplete="off" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors">
              {loading ? t('creatingAccount') : t('createAccount')}
            </button>
          </form>

          <div className="mt-4 flex items-center">
            <div className="flex-grow border-t border-border" />
            <span className="mx-2 text-xs text-text-muted">{t('or', { fallback: 'أو' })}</span>
            <div className="flex-grow border-t border-border" />
          </div>
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}` } })}
            className="mt-4 flex w-full items-center justify-center rounded-xl border border-border bg-background py-3 text-sm font-semibold text-text-primary hover:bg-background-card transition-colors"
          >
            {t('continueWithGoogle', { fallback: 'المتابعة باستخدام Google' })}
          </button>

          <p className="mt-5 text-center text-sm text-text-muted">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/auth/login" className="font-bold text-primary hover:underline">{t('login')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
