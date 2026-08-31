'use client';

import type { FormEvent} from 'react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

function safeNext(value: string | null) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

export default function TotpVerifyPage() {
  const t = useTranslations('totp');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNext(searchParams.get('next')), [searchParams]);
  const isAr = locale === 'ar';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totp_code: code }),
      });
      const payload = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) {
        if (payload?.error === 'totp_setup_required') {
          window.location.assign(`/totp/setup?next=${encodeURIComponent(next)}`);
          return;
        }
        setError(payload?.error || t('errors.failed'));
        setLoading(false);
        return;
      }

      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.failed'));
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 md:py-10 text-[#1F1B16]" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-background-card p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-background-card text-primary">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="text-xs font-black tracking-[0.28em] text-primary">EUROSTORE</p>
            <h1 className="mt-1 text-2xl font-black">{t('verifyTitle')}</h1>
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('codeLabel')}
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} type="text" inputMode="numeric" maxLength={6} required className="rounded-lg border border-border bg-background-card px-3 py-2 outline-none focus:border-primary" />
          </label>
          <button type="submit" disabled={loading || code.length !== 6} className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-black text-text-primary transition-colors hover:bg-primary-dark disabled:opacity-50">
            {loading ? t('loading', { fallback: 'جار التحقق...' }) : t('enterBtn')}
          </button>
        </form>
      </div>
    </main>
  );
}

