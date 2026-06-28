import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function PartnerHomePage() {
  const t = await getTranslations();
  return (
    <main className="p-10 text-[#E2E2E2]">
      <h1 className="text-2xl font-semibold mb-8">{t('partner.welcome')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <Link href="/exchange" className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-6 hover:border-[#C9A84C] transition-colors">
          <p className="font-semibold text-[#C9A84C]">{t('partner.exchangeScanner')}</p>
          <p className="mt-2 text-sm text-[#9CA3AF]">{t('partner.exchangeScannerDesc')}</p>
        </Link>
        <Link href="/exchange/history" className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-6 hover:border-[#C9A84C] transition-colors">
          <p className="font-semibold text-[#C9A84C]">{t('partner.exchangeHistory')}</p>
          <p className="mt-2 text-sm text-[#9CA3AF]">{t('common.date')}</p>
        </Link>
      </div>
    </main>
  );
}