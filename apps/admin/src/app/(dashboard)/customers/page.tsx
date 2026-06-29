'use client';
import { useEffect, useState, useCallback } from 'react';

interface Customer {
  id: string; full_name: string | null; phone: string | null;
  email: string | null; created_at: string; loyalty_points?: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    fetch(`/api/customers?${p}`, { cache: 'no-store' })
      .then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => setError('تعذر تحميل بيانات العملاء')).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">العملاء</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{customers.length} عميل مسجّل</p>
        </div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B] transition-colors">تحديث ↻</button>
      </div>

      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو البريد..." className="input-field" />
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        ) : customers.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">{search ? 'لا نتائج للبحث' : 'لا يوجد عملاء مسجّلون'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">الاسم</th>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E] hidden sm:table-cell">الهاتف</th>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E] hidden md:table-cell">البريد</th>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">النقاط</th>
                  <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E] hidden lg:table-cell">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#1C1917]">{c.full_name ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#57534E] hidden sm:table-cell">{c.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-[#57534E] hidden md:table-cell">{c.email ?? '—'}</td>
                    <td className="px-5 py-3">
                      {c.loyalty_points !== undefined ? (
                        <span className="badge-gold">{c.loyalty_points} نقطة</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#A8A29E] hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString('ar-SY')}</td>
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