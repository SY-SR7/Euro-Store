/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { register } from '../actions';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const t = await getTranslations('auth');
  const errorMap: Record<string, string> = {
    invalid: t('errors.registerInvalid'),
    failed:  t('errors.registerFailed'),
  };
  const errorMsg = searchParams.error ? (errorMap[searchParams.error] ?? '') : '';

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-xs text-[#C9A84C] uppercase tracking-widest">EuroStore</p>
        <h1 className="mt-3 text-3xl font-semibold">{t('createAccount')}</h1>
        {errorMsg && <p className="mt-4 rounded border border-[#2E2E2E] p-4 text-sm text-red-400">{errorMsg}</p>}
        <form action={register} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('fullName')}
            <input name="full_name" type="text" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-[#C9A84C]" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('email')}
            <input name="email" type="email" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-[#C9A84C]" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('phone')}
            <input name="phone" type="tel" className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-[#C9A84C]" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('preferredLanguage')}
            <select name="preferred_language" className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-[#C9A84C]">
              <option value="ar">{t('langAr')}</option>
              <option value="en">{t('langEn')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('password')}
            <input name="password" type="password" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-[#C9A84C]" />
          </label>
          <button type="submit" className="mt-2 rounded-sm bg-[#C9A84C] py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">
            {t('registerBtn')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#9CA3AF]">
          <Link href="/auth/login" className="text-[#C9A84C] hover:underline">{t('alreadyHaveAccount')}</Link>
        </p>
      </div>
    </main>
  );
}

