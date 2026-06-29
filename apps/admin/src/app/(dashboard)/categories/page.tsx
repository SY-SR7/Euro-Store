import { createServerSupabaseClient } from '@/supabase-server';
import { NewCategoryForm } from './NewCategoryForm';

export const dynamic = 'force-dynamic';

type CategoryRow = {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  slug: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

export default async function AdminCategoriesPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name_ar, name_en, slug, sort_order, is_active')
    .order('sort_order');

  const categories = (Array.isArray(data) ? data : []) as CategoryRow[];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]" dir="rtl">
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
          <h1 className="text-3xl font-black text-white">إدارة التصنيفات</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">ترتيب وتصنيف منتجات المتجر.</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
          {categories.length === 0 ? (
            <div className="p-10 text-center text-[#9CA3AF]">لا توجد تصنيفات.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-[#C9A84C]">
                  <tr>
                    <th className="px-4 py-4 text-right font-black">الاسم بالعربية</th>
                    <th className="px-4 py-4 text-right font-black">الاسم بالإنجليزية</th>
                    <th className="px-4 py-4 text-right font-black">الرابط</th>
                    <th className="px-4 py-4 text-right font-black">الترتيب</th>
                    <th className="px-4 py-4 text-right font-black">الحالة</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {categories.map((c) => (
                    <tr key={c.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-bold text-white">{c.name_ar ?? '—'}</td>
                      <td className="px-4 py-4">{c.name_en ?? '—'}</td>
                      <td className="px-4 py-4 font-mono text-xs text-[#9CA3AF]">{c.slug ?? '—'}</td>
                      <td className="px-4 py-4">{c.sort_order ?? 0}</td>
                      <td className="px-4 py-4">
                        <span className={['rounded-full border px-3 py-1 text-xs font-black', c.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-white/10 bg-white/5 text-[#9CA3AF]'].join(' ')}>
                          {c.is_active ? 'مفعّل' : 'غير مفعّل'}
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
        <h2 className="mb-5 text-2xl font-black text-white">تصنيف جديد</h2>
        <NewCategoryForm />
      </aside>
    </div>
  );
}