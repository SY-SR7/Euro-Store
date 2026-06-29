import Link from 'next/link';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

type ProductRow = {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  slug: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
};

export default async function AdminProductsPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('products')
    .select('id, name_ar, name_en, slug, is_featured, is_active, created_at')
    .order('created_at', { ascending: false });

  const products = (Array.isArray(data) ? data : []) as ProductRow[];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-[#101010] p-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black text-white">إدارة المنتجات</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">عرض وإدارة منتجات المتجر.</p>
        </div>

        <Link href="/products/new" className="rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#111111] hover:bg-[#D8B95F]">
          منتج جديد +
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {products.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد منتجات.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الاسم بالعربية</th>
                  <th className="px-4 py-4 text-right font-black">الاسم بالإنجليزية</th>
                  <th className="px-4 py-4 text-right font-black">الرابط</th>
                  <th className="px-4 py-4 text-right font-black">مميز</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-left font-black">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {products.map((p) => (
                  <tr key={p.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-bold text-white">{p.name_ar ?? '—'}</td>
                    <td className="px-4 py-4">{p.name_en ?? '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-[#9CA3AF]">{p.slug ?? '—'}</td>
                    <td className="px-4 py-4">{p.is_featured ? '✓' : '—'}</td>
                    <td className="px-4 py-4">
                      <span className={['rounded-full border px-3 py-1 text-xs font-black', p.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-white/10 bg-white/5 text-[#9CA3AF]'].join(' ')}>
                        {p.is_active ? 'مفعّل' : 'غير مفعّل'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <Link href={`/products/${p.id}`} className="font-black text-[#C9A84C] hover:text-[#D8B95F]">
                        تعديل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}