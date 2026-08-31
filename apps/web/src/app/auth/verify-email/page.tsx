import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const isAr = (await getLocale()) === 'ar';
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background-card p-8 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-black text-text-primary">{isAr ? 'فعّل بريدك الإلكتروني' : 'Verify your email'}</h1>
        <p className="mb-6 text-text-secondary">
          {isAr ? 'أرسلنا رابط التفعيل إلى' : 'We sent a verification link to'} <strong className="text-text-primary">{email || (isAr ? 'بريدك الإلكتروني' : 'your email address')}</strong>.
          <br />
          {isAr ? 'افتح الرابط الموجود في الرسالة لتفعيل الحساب قبل تسجيل الدخول.' : 'Open the link in the email to verify your account before signing in.'}
        </p>
        <Link
          href="/auth/login"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-2 font-bold text-text-primary transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {isAr ? 'العودة إلى تسجيل الدخول' : 'Return to sign in'}
        </Link>
      </div>
    </div>
  );
}
