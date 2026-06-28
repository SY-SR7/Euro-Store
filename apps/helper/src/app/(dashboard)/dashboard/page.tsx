import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function HelperDashboard() {
  const t = await getTranslations('helper');
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] p-8">
      <h1 className="mt-3 text-4xl font-semibold font-playfair">{t('dashboardTitle')}</h1>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded border border-[#2E2E2E] bg-[#151515] p-4">
          <p className="text-2xl font-semibold">—</p>
          <p className="text-sm text-[#9CA3AF]">{t('pendingOrders')}</p>
        </div>
        <div className="rounded border border-[#2E2E2E] bg-[#151515] p-4">
          <p className="text-2xl font-semibold">—</p>
          <p className="text-sm text-[#9CA3AF]">{t('pendingLoyalty')}</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold">{t('quickLinks')}</h2>
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/orders"   className="text-[#C9A84C] hover:underline text-sm">{t('orders')}</Link>
          <Link href="/loyalty"  className="text-[#C9A84C] hover:underline text-sm">{t('grantLoyalty')}</Link>
          <Link href="/exchange" className="text-[#C9A84C] hover:underline text-sm">{t('generateExchange')}</Link>
        </div>
      </div>
    </main>
  );
}
