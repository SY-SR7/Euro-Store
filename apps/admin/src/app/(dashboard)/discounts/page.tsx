'use client';

import { useEffect, useState } from 'react';

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | string;
  value: number;
  min_order_syp?: number | null;
  valid_until?: string | null;
  max_uses?: number | null;
  used_count?: number | null;
  is_active: boolean;
}

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    for (const key of ['data', 'items', 'discounts', 'rows']) {
      const candidate = obj[key];
      if (Array.isArray(candidate)) return candidate as T[];

      if (candidate && typeof candidate === 'object') {
        const nested = candidate as Record<string, unknown>;
        for (const nestedKey of ['data', 'items', 'discounts', 'rows']) {
          if (Array.isArray(nested[nestedKey])) return nested[nestedKey] as T[];
        }
      }
    }
  }

  return [];
}

function money(value: number) {
  return new Intl.NumberFormat('ar-SY', {
    style: 'currency',
    currency: 'SYP',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [creating, setCreating] = useState(false);

  async function fetchDiscounts() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/discounts', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل الخصومات');
        setDiscounts([]);
      } else {
        setDiscounts(pickArray<Discount>(payload));
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDiscounts();
  }, []);

  async function handleCreate() {
    setError('');
    setCreating(true);

    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          type,
          value: Number.parseFloat(value),
          min_order_syp: minOrder ? Number.parseFloat(minOrder) : 0,
          valid_until: validUntil || null,
          max_uses: maxUses ? Number.parseInt(maxUses, 10) : null
        })
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'فشل إنشاء الخصم');
      } else {
        setCode('');
        setType('percentage');
        setValue('');
        setMinOrder('');
        setValidUntil('');
        setMaxUses('');
        void fetchDiscounts();
      }
    } catch {
      setError('تعذر إنشاء الخصم');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/discounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current })
    });

    void fetchDiscounts();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('هل تريد حذف هذا الخصم؟')) return;

    await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
    void fetchDiscounts();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h1 className="text-3xl font-black text-white">الخصومات</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          إنشاء وإدارة أكواد الخصم في المتجر.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h2 className="mb-5 text-xl font-black text-white">خصم جديد</h2>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">كود الخصم</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SUMMER20"
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">نوع الخصم</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            >
              <option value="percentage">نسبة مئوية</option>
              <option value="fixed">مبلغ ثابت</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">القيمة</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="20"
              type="number"
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">حد الطلب الأدنى</span>
            <input
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="0"
              type="number"
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">صالح حتى</span>
            <input
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              type="date"
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">عدد الاستخدامات</span>
            <input
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="∞"
              type="number"
              className="w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={creating || !code || !value}
          onClick={handleCreate}
          className="mt-5 rounded-2xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-[#111111] transition hover:bg-[#D8B95F] disabled:opacity-50"
        >
          {creating ? 'جار الحفظ...' : 'إنشاء الخصم'}
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : discounts.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد خصومات.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الكود</th>
                  <th className="px-4 py-4 text-right font-black">النوع</th>
                  <th className="px-4 py-4 text-right font-black">القيمة</th>
                  <th className="px-4 py-4 text-right font-black">الاستخدام</th>
                  <th className="px-4 py-4 text-right font-black">صالح حتى</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-left font-black">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {discounts.map((d) => (
                  <tr key={d.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-mono font-black text-[#C9A84C]">
                      {d.code}
                    </td>
                    <td className="px-4 py-4">
                      {d.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                    </td>
                    <td className="px-4 py-4">
                      {d.type === 'percentage' ? `${d.value}%` : money(d.value)}
                    </td>
                    <td className="px-4 py-4">
                      {d.used_count ?? 0}
                      {d.max_uses ? ` / ${d.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-4">
                      {d.valid_until ? new Date(d.valid_until).toLocaleDateString('ar-SY') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(d.id, d.is_active)}
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-black',
                          d.is_active
                            ? 'border-green-400/20 bg-green-400/10 text-green-200'
                            : 'border-white/10 bg-white/5 text-[#9CA3AF]'
                        ].join(' ')}
                      >
                        {d.is_active ? 'مفعّل' : 'غير مفعّل'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        className="text-xs font-black text-red-300 hover:text-red-200"
                      >
                        حذف
                      </button>
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