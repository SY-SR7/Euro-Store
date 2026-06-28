import { redirect } from 'next/navigation';
import { getAdminAccess } from '../auth';
import { createServerSupabaseClient } from '../supabase-server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerSupabaseClient();
  const access = await getAdminAccess(supabase);

  if (!access) {
    redirect('/login');
  }

  const [orders, products, customers] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
  ]);

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="border-b border-[#2E2E2E] pb-6">
          <p className="text-sm text-[#C9A84C]">{access.role}</p>
          <h1 className="mt-3 text-4xl font-semibold">لوحة الإدارة</h1>
          <p className="mt-3 text-sm text-[#9CA3AF]">{access.fullName}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded border border-[#2E2E2E] p-5">
            <p className="text-sm text-[#9CA3AF]">الطلبات</p>
            <strong className="mt-3 block text-3xl">{orders.count ?? 0}</strong>
          </article>
          <article className="rounded border border-[#2E2E2E] p-5">
            <p className="text-sm text-[#9CA3AF]">المنتجات</p>
            <strong className="mt-3 block text-3xl">{products.count ?? 0}</strong>
          </article>
          <article className="rounded border border-[#2E2E2E] p-5">
            <p className="text-sm text-[#9CA3AF]">العملاء</p>
            <strong className="mt-3 block text-3xl">{customers.count ?? 0}</strong>
          </article>
        </section>
      </section>
    </main>
  );
}
