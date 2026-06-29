'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void fetch('/api/customers')
      .then(r => r.json())
      .then((d: Customer[]) => { setCustomers(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = customers.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('admin.customers')} ({customers.length})</h1>
        <input
          value={search}
          onChange={(e) => setSearch((e.target as unknown as HTMLInputElement).value)}
          placeholder="ابحث بالاسم أو الهاتف..."
          className="rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 text-sm text-[#E2E2E2] outline-none focus:border-[#C9A84C] w-64"
        />
      </div>

      {loading ? (
        <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#2E2E2E]">
          <table className="w-full text-sm text-[#E2E2E2]">
            <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
              <tr>
                {['الاسم', 'الهاتف', 'نقاط الولاء', 'كود الإحالة', t('common.date')].map(h => (
                  <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="px-4 py-3 font-medium">{c.full_name || '—'}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] font-mono text-xs">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-[#C9A84C] font-semibold">{c.loyalty_points}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{c.referral_code || '—'}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs">
                    {new Date(c.created_at).toLocaleDateString('ar-SY')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9CA3AF]">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
