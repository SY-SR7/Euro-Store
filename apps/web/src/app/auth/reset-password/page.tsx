'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { resetPasswordAction } from '../actions';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const locale = useLocale();
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
            <h1 className="mt-4 text-xl font-black text-text-primary">كلمة مرور جديدة</h1>
            <p className="mt-2 text-sm text-text-secondary">يرجى إدخال كلمة مرور جديدة وقوية.</p>
          </div>

          {searchParams.status === 'failed' && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              فشل تعيين كلمة المرور. قد يكون الرابط منتهياً.
            </div>
          )}
          {searchParams.status === 'invalid' && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              يرجى إدخال كلمة مرور صالحة (12 حرفاً على الأقل).
            </div>
          )}

          <form action={resetPasswordAction} onSubmit={() => setLoading(true)} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-text-primary">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                minLength={12}
                maxLength={128}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,128}"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary"
                placeholder="••••••••••••"
                dir="ltr"
              />
              <p className="mt-2 text-xs font-semibold text-text-muted">
                يجب أن تكون 12 حرفاً على الأقل، وتحتوي على حرف كبير وصغير ورقم ورمز.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors"
            >
              {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
