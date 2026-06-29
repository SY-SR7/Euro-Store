'use client';
import { useEffect, useState, useCallback } from 'react';

interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  loyalty_points?: number;
  order_count?: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/customers?${params}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => setError('تعذر تحميل بيانات العملاء'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#101010] p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">العملاء</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">{customers.length} عميل مسجّل</p>
        </div>
        <button onClick={load}
          className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#EDE7DD] transition-colors">
          تحديث ↻
        </button>
      </div>

      {/* Search */}
      <div className="rounded-3xl border border-white/10 bg-[#101010] p-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف أو البريد..."
          className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-2.5 text-sm text-[#EDE7DD] outline-none focus:border-[#C9A84C] transition-colors"
        />
      </div>

      {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm text-red-300">{error}</p>}

      {/* Table */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010]">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">
            {search ? 'لا نتائج للبحث' : 'لا يوجد عملاء مسجّلون'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-4 text-right font-black text-[#C9A84C]">الاسم</th>
                  <th className="px-5 py-4 text-right font-black text-[#C9A84C] hidden sm:table-cell">الهاتف</th>
                  <th className="px-5 py-4 text-right font-black text-[#C9A84C] hidden md:table-cell">البريد الإلكتروني</th>
                  <th className="px-5 py-4 text-right font-black text-[#C9A84C] hidden md:table-cell">النقاط</th>
                  <th className="px-5 py-4 text-right font-black text-[#C9A84C] hidden lg:table-cell">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {customers.map(c => (
                  <tr key={c.id} className="text-[#EDE7DD] hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4 font-bold text-white">{c.full_name ?? '—'}</td>
                    <td className="px-5 py-4 font-mono text-sm text-[#9CA3AF] hidden sm:table-cell">{c.phone ?? '—'}</td>
                    <td className="px-5 py-4 text-xs text-[#9CA3AF] hidden md:table-cell">{c.email ?? '—'}</td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {c.loyalty_points !== undefined ? (
                        <span className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-xs font-black text-[#C9A84C]">
                          {c.loyalty_points} نقطة
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#9CA3AF] hidden lg:table-cell">
                      {new Date(c.created_at).toLocaleDateString('ar-SY')}
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
