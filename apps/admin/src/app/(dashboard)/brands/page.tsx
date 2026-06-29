import { createServerSupabaseClient } from '@/supabase-server';
import { NewBrandForm } from './NewBrandForm';

export const dynamic = 'force-dynamic';

type BrandRow = {
  id: string;
  name: string | null;
  slug: string | null;
  is_active: boolean | null;
};

export default async function AdminBrandsPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('brands')
    .select('id, name, slug, is_active')
    .order('name');

  const brands = (Array.isArray(data) ? data : []) as BrandRow[];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]" dir="rtl">
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
          <h1 className="text-3xl font-black text-white">إدارة العلامات التجارية</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">عرض وإضافة العلامات التجارية.</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
          {brands.length === 0 ? (
            <div className="p-10 text-center text-[#9CA3AF]">لا توجد علامات تجارية.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-[#C9A84C]">
                  <tr>
                    <th className="px-4 py-4 text-right font-black">اسم العلامة</th>
                    <th className="px-4 py-4 text-right font-black">الرابط</th>
                    <th className="px-4 py-4 text-right font-black">الحالة</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {brands.map((b) => (
                    <tr key={b.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-bold text-white">{b.name ?? '—'}</td>
                      <td className="px-4 py-4 font-mono text-xs text-[#9CA3AF]">{b.slug ?? '—'}</td>
                      <td className="px-4 py-4">
                        <span className={['rounded-full border px-3 py-1 text-xs font-black', b.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-white/10 bg-white/5 text-[#9CA3AF]'].join(' ')}>
                          {b.is_active ? 'مفعّلة' : 'غير مفعّلة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h2 className="mb-5 text-2xl font-black text-white">علامة تجارية جديدة</h2>
        <NewBrandForm />
      </aside>
    </div>
  );
}