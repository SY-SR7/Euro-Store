'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { safeInternalPath } from '@eurostore/shared';

type AuthMode = 'login' | 'register';
type AuthModalContextValue = {
  isAuthenticated: boolean;
  openAuth: (next?: string, mode?: AuthMode) => void;
  closeAuth: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider');
  return context;
}

export function AuthModalProvider({
  children,
  isAuthenticated,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [nextPath, setNextPath] = useState('/account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const t = useTranslations('auth');
  const isAr = locale === 'ar';

  const closeAuth = useCallback(() => {
    if (!pending) setOpen(false);
  }, [pending]);

  const openAuth = useCallback((next = '/account', initialMode: AuthMode = 'login') => {
    const safeNext = safeInternalPath(next, '/account');
    if (isAuthenticated) {
      window.location.assign(safeNext);
      return;
    }
    setNextPath(safeNext);
    setMode(initialMode);
    setError('');
    setSuccess('');
    setOpen(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    firstInputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuth();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeAuth, open]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        if (!response.ok) throw new Error(payload?.error?.message || t('errors.loginFailed'));
        window.location.assign(nextPath);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone,
          preferred_language: isAr ? 'ar' : 'en',
          referral_code: referralCode.trim().toUpperCase() || undefined,
        }),
      });
      if (!response.ok) throw new Error(t('errors.loginFailed'));
      setSuccess(isAr ? 'تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتفعيله.' : 'Account created. Check your email to activate it.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('errors.loginFailed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthModalContext.Provider value={{ isAuthenticated, openAuth, closeAuth }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeAuth();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-background-card p-6 shadow-2xl"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="auth-modal-title" className="text-lg font-black text-text-primary">
                {mode === 'login' ? t('loginTitle') : t('registerTitle')}
              </h2>
              <button type="button" onClick={closeAuth} disabled={pending} className="rounded-full p-2 text-text-muted hover:bg-background" aria-label={isAr ? 'إغلاق' : 'Close'}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 border-b border-border" role="tablist">
              <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${mode === 'login' ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}>
                <LogIn className="h-4 w-4" /> {t('login')}
              </button>
              <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${mode === 'register' ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}>
                <UserPlus className="h-4 w-4" /> {t('createAccount')}
              </button>
            </div>

            {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            {success && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{success}</p>}

            <form onSubmit={(event) => { void submit(event); }} className="mt-5 space-y-4">
              {mode === 'register' && (
                <>
                  <label className="block text-sm font-semibold text-text-primary">
                    {t('fullName')}
                    <input ref={firstInputRef} value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} autoComplete="name" className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
                  </label>
                  <label className="block text-sm font-semibold text-text-primary">
                    {t('phone')}
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} required minLength={6} maxLength={32} autoComplete="tel" dir="ltr" className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
                  </label>
                </>
              )}
              <label className="block text-sm font-semibold text-text-primary">
                {t('email')}
                <input ref={mode === 'login' ? firstInputRef : undefined} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" dir="ltr" className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
              </label>
              <label className="block text-sm font-semibold text-text-primary">
                {t('password')}
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === 'register' ? 12 : 1} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
              </label>
              {mode === 'register' && (
                <label className="block text-sm font-semibold text-text-primary">
                  {isAr ? 'كود الإحالة (اختياري)' : 'Referral code (optional)'}
                  <input value={referralCode} onChange={(event) => setReferralCode(event.target.value.toUpperCase())} maxLength={12} autoComplete="off" dir="ltr" className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 uppercase outline-none focus:border-primary" />
                </label>
              )}
              <button type="submit" disabled={pending || Boolean(success)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50">
                {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {pending ? (mode === 'login' ? t('loggingIn') : t('creatingAccount')) : (mode === 'login' ? t('login') : t('createAccount'))}
              </button>
            </form>

            {mode === 'login' && (
              <Link href="/auth/forgot-password" onClick={closeAuth} className="mt-4 block text-center text-sm font-semibold text-primary hover:underline">
                {t('forgotPassword')}
              </Link>
            )}
          </section>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
