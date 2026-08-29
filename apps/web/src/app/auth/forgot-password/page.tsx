'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { forgotPasswordAction } from '../actions';

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const locale = useLocale();
  const t = useTranslations('auth');
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(false);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-background-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <Link href="/" className="flex justify-center">
              <img src="/images/logo.png" alt="Euro Store" className="h-16 w-auto object-contain" />
            </Link>
            <h1 className="mt-4 text-xl font-black text-text-primary">إعادة تعيين كلمة المرور</h1>
            <p className="mt-2 text-sm text-text-secondary">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين.</p>
          </div>

          {searchParams.status === 'sent' && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.
            </div>
          )}
          {searchParams.status === 'failed' && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              فشل إرسال الرابط. يرجى المحاولة مرة أخرى.
            </div>
          )}
          {searchParams.status === 'invalid' && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              يرجى إدخال بريد إلكتروني صحيح.
            </div>
          )}

          <form action={forgotPasswordAction} onSubmit={() => setLoading(true)} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-text-primary">
                {t('email')}
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary placeholder:text-text-muted"
                placeholder="you@example.com"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-text-secondary">
            تذكرت كلمة المرور؟{' '}
            <Link href="/auth/login" className="font-bold text-primary hover:underline">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
