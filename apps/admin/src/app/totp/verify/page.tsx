import { getTranslations } from 'next-intl/server';
import { ShieldCheck } from 'lucide-react';
import { verifyTotpAction } from '../actions';

export default async function TotpVerifyPage({ searchParams }: { searchParams: { error?: string } }) {
  const t = await getTranslations('totp');
  const errorMap: Record<string, string> = {
    invalid: t('errors.invalid'),
    failed:  t('errors.failed'),
  };
  const errorMsg = searchParams.error ? (errorMap[searchParams.error] ?? '') : '';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF7EF] px-4 py-10 text-[#1F1B16]" dir="rtl">
      <div className="w-full max-w-md rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#E8DCC3] bg-white text-[#C9A84C]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="text-xs font-black tracking-[0.28em] text-[#C9A84C]">EUROSTORE</p>
            <h1 className="mt-1 text-2xl font-black">{t('verifyTitle')}</h1>
          </div>
        </div>
        {errorMsg && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{errorMsg}</p>}
        <form action={verifyTotpAction} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('codeLabel')}
            <input name="code" type="text" inputMode="numeric" maxLength={6} required className="rounded-lg border border-[#E8DCC3] bg-white px-3 py-2 outline-none focus:border-[#C9A84C]" />
          </label>
          <button type="submit" className="mt-2 rounded-lg bg-[#C9A84C] py-2.5 text-sm font-black text-[#111] transition-colors hover:bg-[#D8B95F]">
            {t('enterBtn')}
          </button>
        </form>
      </div>
    </main>
  );
}

