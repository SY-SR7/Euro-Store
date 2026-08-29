import { PartnerExchangeRequestsClient } from './PartnerExchangeRequestsClient';

export const dynamic = 'force-dynamic';

export default function PartnerExchangeRequestsPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-12 text-[#E2E2E2]">
      <div className="mx-auto max-w-5xl">
        <PartnerExchangeRequestsClient />
      </div>
    </main>
  );
}
