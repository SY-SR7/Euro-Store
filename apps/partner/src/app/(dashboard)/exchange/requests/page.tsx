import { PartnerExchangeRequestsClient } from './PartnerExchangeRequestsClient';

export const dynamic = 'force-dynamic';

export default function PartnerExchangeRequestsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-text-primary">
      <div className="mx-auto max-w-5xl">
        <PartnerExchangeRequestsClient />
      </div>
    </main>
  );
}
