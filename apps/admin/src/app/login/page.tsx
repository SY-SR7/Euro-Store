'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import LanguageSwitcher from '../components/LanguageSwitcher';

function safeNext(value: string | null) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNext(searchParams.get('next')), [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('auth');
  const locale = useLocale();
  const isAr = locale === 'ar';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError(t('errors.missingCredentials', { fallback: 'أدخل البريد الإلكتروني وكلمة المرور' }));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use browser client directly — this sets cookies in the correct format
      // that the SSR middleware can read natively
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError || !data.session) {
        setError(authError?.message || t('errors.loginFailed', { fallback: 'فشل تسجيل الدخول' }));
        setLoading(false);
        return;
      }

      // Navigate to the next page — cookies are already set by createBrowserClient
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.cannotLogin', { fallback: 'تعذر تسجيل الدخول' }));
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 md:py-10 relative" dir={isAr ? "rtl" : "ltr"}>
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <section className="w-full max-w-md rounded-3xl border border-border bg-background-card p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Euro Store" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="mt-4 text-3xl font-black text-[#1F1B16]">{t('adminLogin', { fallback: 'تسجيل دخول الإدارة' })}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-black text-[#1F1B16]">{t('email', { fallback: 'البريد الإلكتروني' })}</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-border bg-background-card px-4 py-3 text-left text-[#1F1B16] outline-none transition focus:border-primary"
              placeholder="admin@example.com"
              dir="ltr"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-black text-[#1F1B16]">{t('password', { fallback: 'كلمة المرور' })}</span>
            <div className="flex overflow-hidden rounded-2xl border border-border bg-background-card focus-within:border-primary">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-left text-[#1F1B16] outline-none"
                placeholder="••••••••"
                dir="ltr"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className={`grid w-12 place-items-center ${isAr ? "border-r" : "border-l"} border-border text-[#6F6658] transition hover:text-primary`}
                title={showPassword ? t('hide', { fallback: 'إخفاء' }) : t('show', { fallback: 'إظهار' })}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-[#1F1B16] transition hover:bg-[#D8B95F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={17} />
            {loading ? t('loggingIn', { fallback: 'جار تسجيل الدخول...' }) : t('loginBtn', { fallback: 'دخول' })}
          </button>
        </form>
      </section>
    </main>
  );
}
