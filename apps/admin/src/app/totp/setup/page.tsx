import { getTranslations } from 'next-intl/server';
import { getOrCreateTotpSetup, verifyTotpAction } from '../actions';

export default async function TotpSetupPage({ searchParams }: { searchParams: { error?: string } }) {
  const t = await getTranslations('totp');
  const hasError = searchParams.error === 'invalid';
  const { accountName, secret, uri } = await getOrCreateTotpSetup();

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-xs text-[#C9A84C] uppercase">EuroStore</p>
        <h1 className="mt-3 text-3xl font-semibold">{t('setupTitle')}</h1>
        {hasError && <p className="mt-4 rounded border border-[#2E2E2E] p-4 text-sm">{t('errors.wrongCode')}</p>}
        <div className="mt-8 flex flex-col gap-4 text-sm">
          <p className="text-sm text-[#9CA3AF]">{t('accountLabel')}</p>
          <p className="font-mono text-[#E2E2E2]">{accountName}</p>
          <p className="mt-6 text-sm text-[#9CA3AF]">{t('manualKey')}</p>
          <p className="font-mono text-xs break-all text-[#E2E2E2]">{secret}</p>
          <p className="mt-6 text-sm text-[#9CA3AF]">{t('setupLink')}</p>
          <p className="font-mono text-xs break-all text-[#E2E2E2]">{uri}</p>
        </div>
        <form action={verifyTotpAction} className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="uri" value={uri} />
          <input type="hidden" name="secret" value={secret} />
          <label className="flex flex-col gap-1 text-sm">
            {t('codeInput')}
            <input name="code" type="text" inputMode="numeric" maxLength={6} required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-[#C9A84C]" />
          </label>
          <button type="submit" className="mt-2 rounded-sm bg-[#C9A84C] py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">
            {t('activateBtn')}
          </button>
        </form>
      </div>
    </main>
  );
}


