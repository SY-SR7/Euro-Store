import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHelperAccess } from '../../../auth';
import { createServerSupabaseClient } from '../../../supabase-server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerSupabaseClient();
  const access = await getHelperAccess(supabase);

  if (!access) {
    redirect('/login');
  }

  const { count: pendingOrdersCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['confirmed', 'processing', 'picked_up']);

  const { count: pendingLoyaltyCount } = await supabase
    .from('loyalty_points_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('is_pending', true)
    .eq('type', 'earned_offline');

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2] font-manrope">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="border-b border-[#2E2E2E] pb-6">
          <p className="text-sm text-[#C9A84C]">{access.branchName}</p>
          <h1 className="mt-3 text-4xl font-semibold font-playfair">بوابة المندوب</h1>
          <p className="mt-3 text-sm text-[#9CA3AF]">{access.fullName}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="rounded border border-[#2E2E2E] p-5">
            <p className="text-sm text-[#9CA3AF]">طلبات تحتاج متابعة</p>
            <strong className="mt-3 block text-3xl">{pendingOrdersCount ?? 0}</strong>
          </article>
          <article className="rounded border border-[#2E2E2E] p-5">
            <p className="text-sm text-[#9CA3AF]">طلبات نقاط الولاء (بانتظار الموافقة)</p>
            <strong className="mt-3 block text-3xl">{pendingLoyaltyCount ?? 0}</strong>
          </article>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">روابط سريعة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/orders" className="rounded bg-[#2E2E2E] p-4 text-center hover:bg-[#3E3E3E] transition-colors">
              الطلبات
            </Link>
            <Link href="/loyalty/award" className="rounded bg-[#2E2E2E] p-4 text-center hover:bg-[#3E3E3E] transition-colors">
              منح نقاط الولاء
            </Link>
            <Link href="/exchange/qr" className="rounded bg-[#2E2E2E] p-4 text-center hover:bg-[#3E3E3E] transition-colors">
              توليد رمز استبدال
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
