'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Product = {
  id: string; name_ar: string; name_en: string;
  slug: string; is_featured: boolean; is_active: boolean; created_at: string;
};

export default function AdminProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [filter,   setFilter]     = useState<'all'|'active'|'inactive'|'featured'>('all');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/catalog/products')
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name_ar?.toLowerCase().includes(q) || p.name_en?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? p.is_active :
      filter === 'inactive' ? !p.is_active :
      filter === 'featured' ? p.is_featured : true;
    return matchSearch && matchFilter;
  });

  const filterBtns: Array<{ key: typeof filter; label: string }> = [
    { key: 'all',      label: 'الكل' },
    { key: 'active',   label: 'مفعّل' },
    { key: 'inactive', label: 'غير مفعّل' },
    { key: 'featured', label: 'مميز' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-[#101010] p-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black text-white">إدارة المنتجات</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">{products.length} منتج إجمالاً</p>
        </div>
        <Link href="/products/new"
          className="rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#111] hover:bg-[#D8B95F] transition-colors whitespace-nowrap">
          + منتج جديد
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#101010] p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الرابط..."
          className="flex-1 rounded-xl border border-white/10 bg-[#151515] px-4 py-2.5 text-sm text-[#EDE7DD] outline-none focus:border-[#C9A84C] transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          {filterBtns.map(btn => (
            <button key={btn.key} onClick={() => setFilter(btn.key)}
              className={['rounded-xl px-4 py-2 text-xs font-black transition-colors',
                filter === btn.key
                  ? 'bg-[#C9A84C] text-[#111]'
                  : 'border border-white/10 text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#EDE7DD]'
              ].join(' ')}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010]">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جاري التحميل...</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">
            {search ? 'لا نتائج للبحث' : 'لا توجد منتجات'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الاسم بالعربية</th>
                  <th className="px-4 py-4 text-right font-black">الاسم بالإنجليزية</th>
                  <th className="px-4 py-4 text-right font-black hidden sm:table-cell">الرابط</th>
                  <th className="px-4 py-4 text-right font-black">مميز</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-left font-black">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {visible.map(p => (
                  <tr key={p.id} className="text-[#EDE7DD] hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-4 font-bold text-white">{p.name_ar ?? '—'}</td>
                    <td className="px-4 py-4 text-[#9CA3AF]">{p.name_en ?? '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-[#9CA3AF] hidden sm:table-cell">{p.slug ?? '—'}</td>
                    <td className="px-4 py-4 text-center">{p.is_featured ? '⭐' : '—'}</td>
                    <td className="px-4 py-4">
                      <span className={['rounded-full border px-3 py-1 text-xs font-black',
                        p.is_active
                          ? 'border-green-400/20 bg-green-400/10 text-green-300'
                          : 'border-white/10 bg-white/5 text-[#9CA3AF]'
                      ].join(' ')}>
                        {p.is_active ? 'مفعّل' : 'غير مفعّل'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <Link href={`/products/${p.id}`}
                        className="font-black text-[#C9A84C] hover:text-[#D8B95F] transition-colors">
                        تفاصيل
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