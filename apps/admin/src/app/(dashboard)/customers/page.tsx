'use client';

import { useEffect, useState } from 'react';

interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  loyalty_points: number;
  referral_code: string | null;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/customers')
      .then(r => r.json())
      .then((d: Customer[] | { error?: string }) => {
        if (Array.isArray(d)) setCustomers(d);
        else setError((d as { error?: string }).error ?? 'تعذر تحميل العملاء');
        setLoading(false);
      })
      .catch(() => { setError('تعذر الاتصال'); setLoading(false); });
  }, []);

  const filtered = customers.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-[#101010] p-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black text-white">العملاء ({customers.length})</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">قائمة العملاء المسجّلين في المتجر.</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الهاتف..."
          className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-sm text-white outline-none focus:border-[#C9A84C] w-64"
        />
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">{search ? 'لا توجد نتائج للبحث.' : 'لا يوجد عملاء بعد.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الاسم</th>
                  <th className="px-4 py-4 text-right font-black">الهاتف</th>
                  <th className="px-4 py-4 text-right font-black">نقاط الولاء</th>
                  <th className="px-4 py-4 text-right font-black">كود الإحالة</th>
                  <th className="px-4 py-4 text-right font-black">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map(c => (
                  <tr key={c.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-bold text-white">{c.full_name || '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-[#9CA3AF]">{c.phone || '—'}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/10 px-3 py-1 text-xs font-black text-[#C9A84C]">
                        ★ {c.loyalty_points}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-[#6B7280]">{c.referral_code || '—'}</td>
                    <td className="px-4 py-4 text-xs text-[#9CA3AF]">
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