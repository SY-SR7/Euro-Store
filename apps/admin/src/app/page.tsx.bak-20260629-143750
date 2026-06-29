import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const t = await getTranslations('admin');
  const supabase = createServerSupabaseClient();

  const [{ count: orders }, { count: products }, { count: customers }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('customer_profiles').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div>
      <h1 className="mt-3 text-4xl font-semibold">{t('dashboardTitle')}</h1>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="rounded border border-[#2E2E2E] bg-[#151515] p-4">
          <p className="text-2xl font-semibold">{orders ?? 0}</p>
          <p className="text-sm text-[#9CA3AF]">{t('ordersLabel')}</p>
        </div>
        <div className="rounded border border-[#2E2E2E] bg-[#151515] p-4">
          <p className="text-2xl font-semibold">{products ?? 0}</p>
          <p className="text-sm text-[#9CA3AF]">{t('productsLabel')}</p>
        </div>
        <div className="rounded border border-[#2E2E2E] bg-[#151515] p-4">
          <p className="text-2xl font-semibold">{customers ?? 0}</p>
          <p className="text-sm text-[#9CA3AF]">{t('customersLabel')}</p>
        </div>
      </div>
    </div>
  );
}

