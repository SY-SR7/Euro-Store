import { getTranslations } from 'next-intl/server';
import { loginAction } from './actions';

export default async function HelperLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const t = await getTranslations('auth');
  const errorMap: Record<string, string> = { invalid: t('errors.invalidCredentials'), failed: t('errors.loginFailed') };
  const errorMsg = searchParams.error ? (errorMap[searchParams.error] ?? '') : '';
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-xs text-primary uppercase tracking-widest">EuroStore</p>
        <h1 className="mt-3 text-3xl font-semibold">{t('loginAction')}</h1>
        {errorMsg && <p className="mt-4 rounded border border-[#2E2E2E] p-4 text-sm text-red-400">{errorMsg}</p>}
        <form action={loginAction} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">{t('email')}<input name="email" type="email" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1 text-sm">{t('password')}<input name="password" type="password" required className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 outline-none focus:border-primary" /></label>
          <button type="submit" className="mt-2 rounded-sm bg-primary py-2.5 text-sm font-semibold text-text-primary hover:bg-[#D8B95F] transition-colors">{t('loginBtn')}</button>
        </form>
      </div>
    </main>
  );
}


