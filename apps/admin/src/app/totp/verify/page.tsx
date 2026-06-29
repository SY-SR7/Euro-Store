import { getTranslations } from 'next-intl/server';
import { verifyTotpAction } from '../actions';

export default async function TotpVerifyPage({ searchParams }: { searchParams: { error?: string } }) {
  const t = await getTranslations('totp');
  const errorMap: Record<string, string> = {
    invalid: t('errors.invalid'),
    failed:  t('errors.failed'),
  };
  const errorMsg = searchParams.error ? (errorMap[searchParams.error] ?? '') : '';

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-xs text-[#C9A84C] uppercase tracking-widest">EuroStore</p>
        <h1 className="mt-3 text-3xl font-semibold">{t('verifyTitle')}</h1>
        {errorMsg && <p className="mt-4 rounded border border-[#2E2E2E] p-4 text-sm text-red-400">{errorMsg}</p>}
        <form action={verifyTotpAction} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('codeLabel')}
            <input name="token" type="text" inputMode="numeric" maxLength={6} required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-[#C9A84C]" />
          </label>
          <button type="submit" className="mt-2 rounded-sm bg-[#C9A84C] py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">
            {t('enterBtn')}
          </button>
        </form>
      </div>
    </main>
  );
}
