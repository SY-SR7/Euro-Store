import { getTranslations } from 'next-intl/server';
import { loginAction } from './actions';

export default async function PartnerLoginPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const t = await getTranslations('auth');
  const { status } = await searchParams;
  const errorMap: Record<string, string> = { invalid: t('errors.invalidCredentials'), failed: t('errors.loginFailed') };
  const errorMsg = status ? (errorMap[status] ?? '') : '';
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-text-primary">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background-card p-7 shadow-lg sm:p-9">
        <p className="text-xs text-primary uppercase tracking-widest">EuroStore</p>
        <h1 className="mt-3 text-3xl font-semibold">{t('loginTitle')}</h1>
        {errorMsg && <p role="alert" className="mt-4 rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">{errorMsg}</p>}
        <form action={loginAction} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-secondary">{t('email')}<input name="email" type="email" autoComplete="email" spellCheck={false} required className="rounded-lg border border-border bg-background-elevated px-3 py-3 text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-secondary">{t('password')}<input name="password" type="password" autoComplete="current-password" spellCheck={false} required className="rounded-lg border border-border bg-background-elevated px-3 py-3 text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" /></label>
          <button type="submit" className="mt-2 min-h-11 rounded-lg bg-primary py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">{t('loginBtn')}</button>
        </form>
      </div>
    </main>
  );
}


