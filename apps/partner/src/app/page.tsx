import { getTranslations } from 'next-intl/server';

export default async function PartnerDashboard() {
  const t = await getTranslations('partner');
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] p-8">
      <div className="rounded border border-[#2E2E2E] bg-[#151515] p-4 w-fit">
        <p className="text-2xl font-semibold">—</p>
        <p className="text-sm text-[#9CA3AF]">{t('pendingExchanges')}</p>
      </div>
    </main>
  );
}
