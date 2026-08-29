'use client';

import type { FormEvent} from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

function safeNext(value: string | null) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

type SetupState = {
  account_name: string;
  issuer: string;
  secret: string;
  uri: string;
};

export default function TotpSetupPage() {
  const t = useTranslations('totp');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNext(searchParams.get('next')), [searchParams]);
  const isAr = locale === 'ar';

  const [setup, setSetup] = useState<SetupState | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth/setup-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null) as (SetupState & { error?: string }) | null;
        if (!res.ok || !payload) throw new Error(payload?.error || 'setup_failed');
        setSetup(payload);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'setup_failed'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== 6) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/setup-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totp_code: code }),
      });
      const payload = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) {
        setError(payload?.error || 'invalid_totp');
        setSubmitting(false);
        return;
      }
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'setup_failed');
      setSubmitting(false);
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
            <h1 className="mt-1 text-2xl font-black">{t('setupTitle')}</h1>
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
        {loading ? (
          <p className="mt-6 text-sm text-[#6F6658]">{t('loading', { fallback: 'جار التحميل...' })}</p>
        ) : setup ? (
          <div className="mt-6 flex flex-col gap-4 text-sm">
            <p className="text-sm text-[#6F6658]">{t('accountLabel')}</p>
            <p className="font-mono text-[#1F1B16]">{setup.account_name}</p>
            <p className="mt-6 text-sm text-[#6F6658]">{t('manualKey')}</p>
            <p className="font-mono text-xs break-all text-[#1F1B16]">{setup.secret}</p>
            <p className="mt-6 text-sm text-[#6F6658]">{t('setupLink')}</p>
            <p className="font-mono text-xs break-all text-[#1F1B16]">{setup.uri}</p>
          </div>
        ) : null}
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('codeInput')}
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} type="text" inputMode="numeric" maxLength={6} required className="rounded-lg border border-border bg-background-card px-3 py-2 outline-none focus:border-primary" />
          </label>
          <button type="submit" disabled={submitting || !setup || code.length !== 6} className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-black text-text-primary transition-colors hover:bg-[#D8B95F] disabled:opacity-50">
            {submitting ? t('loading', { fallback: 'جار التحقق...' }) : t('activateBtn')}
          </button>
        </form>
      </div>
    </main>
  );
}


