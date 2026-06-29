'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Product = {
  id: string; name_ar: string; name_en: string;
  slug: string; is_featured: boolean; is_active: boolean; created_at: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all'|'active'|'inactive'|'featured'>('all');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/catalog/products')
      .then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = products.filter(p => {
    const q = search.toLowerCase();
    const m = !q || p.name_ar?.toLowerCase().includes(q) || p.name_en?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q);
    const f = filter === 'all' ? true : filter === 'active' ? p.is_active : filter === 'inactive' ? !p.is_active : p.is_featured;
    return m && f;
  });

  const filters = [
    { key: 'all' as const, label: 'الكل' },
    { key: 'active' as const, label: 'مفعّل' },
    { key: 'inactive' as const, label: 'غير مفعّل' },
    { key: 'featured' as const, label: 'مميز' },
  ];

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">إدارة المنتجات</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{products.length} منتج إجمالاً</p>
        </div>
        <Link href="/products/new" className="inline-flex items-center gap-2 rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-white hover:bg-[#9A7209] transition-colors whitespace-nowrap">
          + منتج جديد
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الرابط..." className="input-field flex-1" />
        <div className="flex flex-wrap gap-2">
          {filters.map(btn => (
            <button key={btn.key} onClick={() => setFilter(btn.key)}
              className={['rounded-lg px-4 py-2 text-xs font-black transition-colors border', filter === btn.key ? 'bg-[#B8860B] text-white border-[#B8860B]' : 'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]'].join(' ')}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        ) : visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">{search ? 'لا نتائج للبحث' : 'لا توجد منتجات'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">الاسم بالعربية</th>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E] hidden sm:table-cell">الاسم بالإنجليزية</th>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E] hidden md:table-cell">الرابط</th>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">مميز</th>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">الحالة</th>
                  <th className="px-5 py-3 text-left text-xs font-black text-[#A8A29E]">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {visible.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3 font-bold text-[#1C1917]">{p.name_ar ?? '—'}</td>
                    <td className="px-5 py-3 text-[#57534E] hidden sm:table-cell">{p.name_en ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#A8A29E] hidden md:table-cell">{p.slug ?? '—'}</td>
                    <td className="px-5 py-3 text-center">{p.is_featured ? '⭐' : <span className="text-[#E5E0D8]">—</span>}</td>
                    <td className="px-5 py-3">
                      <span className={p.is_active ? 'badge-green' : 'badge-gray'}>{p.is_active ? 'مفعّل' : 'غير مفعّل'}</span>
                    </td>
                    <td className="px-5 py-3 text-left">
                      <Link href={`/products/${p.id}`} className="font-bold text-[#B8860B] hover:underline">تفاصيل</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}