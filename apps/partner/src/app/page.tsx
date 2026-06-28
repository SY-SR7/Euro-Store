import { redirect } from 'next/navigation';
import { getPartnerAccess } from '../auth';
import { createServerSupabaseClient } from '../supabase-server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerSupabaseClient();
  const access = await getPartnerAccess(supabase);

  if (!access) {
    redirect('/login');
  }

  const exchangeQueue = await supabase
    .from('exchange_requests')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', access.userId)
    .in('status', ['approved', 'qr_generated', 'qr_scanned']);

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="border-b border-[#2E2E2E] pb-6">
          <p className="text-sm text-[#C9A84C]">{access.governorate}</p>
          <h1 className="mt-3 text-4xl font-semibold">{access.businessName}</h1>
          <p className="mt-3 text-sm text-[#9CA3AF]">{access.contactName}</p>
        </header>

        <article className="rounded border border-[#2E2E2E] p-5">
          <p className="text-sm text-[#9CA3AF]">طلبات التبديل في الانتظار</p>
          <strong className="mt-3 block text-3xl">{exchangeQueue.count ?? 0}</strong>
        </article>
      </section>
    </main>
  );
}
