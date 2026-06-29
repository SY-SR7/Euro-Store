'use client';

import { useEffect, useState } from 'react';

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | string;
  value: number;
  min_order_syp?: number | null;
  valid_from?: string | null;
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
      const c = obj[key];
      if (Array.isArray(c)) return c as T[];
    }
  }
  return [];
}

function syp(v: number) {
  return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(Number(v) || 0);
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [code, setCode]           = useState('');
  const [type, setType]           = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue]         = useState('');
  const [minOrder, setMinOrder]   = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxUses, setMaxUses]     = useState('');
  const [creating, setCreating]   = useState(false);

  async function fetchDiscounts() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/discounts', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);
      if (!res.ok) { setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل الخصومات'); setDiscounts([]); }
      else setDiscounts(pickArray<Discount>(payload));
    } catch { setError('تعذر الاتصال بالخادم'); setDiscounts([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { void fetchDiscounts(); }, []);

  async function handleCreate() {
    if (!code.trim() || !value) { setError('الكود والقيمة مطلوبان'); return; }
    setError(''); setCreating(true);
    try {
      const today = new Date().toISOString().split('T')[0]!;
      const body = {
        code,
        type,
        value: parseFloat(value),
        min_order_syp: minOrder ? parseFloat(minOrder) : 0,
        valid_from:  validFrom  || today,
        valid_until: validUntil || null,
        max_uses:    maxUses ? parseInt(maxUses, 10) : null,
      };
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) { setError((payload as { error?: string } | null)?.error ?? 'فشل إنشاء الخصم'); }
      else { setCode(''); setType('percentage'); setValue(''); setMinOrder(''); setValidFrom(''); setValidUntil(''); setMaxUses(''); void fetchDiscounts(); }
    } catch { setError('تعذر إنشاء الخصم'); }
    finally { setCreating(false); }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/discounts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !current }) });
    void fetchDiscounts();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('هل تريد حذف هذا الخصم؟')) return;
    await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
    void fetchDiscounts();
  }

  const inp = 'w-full rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none focus:border-[#C9A84C]';

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h1 className="text-3xl font-black text-white">الخصومات</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">إنشاء وإدارة أكواد الخصم في المتجر.</p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h2 className="mb-5 text-xl font-black text-white">خصم جديد</h2>
        {error && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">كود الخصم *</span>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="SUMMER20" className={inp} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">نوع الخصم</span>
            <select value={type} onChange={e => setType(e.target.value as 'percentage' | 'fixed')} className={inp}>
              <option value="percentage">نسبة مئوية (%)</option>
              <option value="fixed">مبلغ ثابت (ل.س)</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">القيمة *</span>
            <input value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'percentage' ? '20' : '50000'} type="number" min="0" className={inp} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">حد الطلب الأدنى (ل.س)</span>
            <input value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="0" type="number" min="0" className={inp} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">تاريخ البداية</span>
            <input value={validFrom} onChange={e => setValidFrom(e.target.value)} type="date" className={inp} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">صالح حتى</span>
            <input value={validUntil} onChange={e => setValidUntil(e.target.value)} type="date" className={inp} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-[#B8B1A4]">عدد الاستخدامات (∞ إذا فارغ)</span>
            <input value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="∞" type="number" min="1" className={inp} />
          </label>
        </div>
        <button type="button" disabled={creating || !code.trim() || !value} onClick={handleCreate}
          className="mt-5 rounded-2xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-[#111111] transition hover:bg-[#D8B95F] disabled:opacity-50">
          {creating ? 'جار الحفظ...' : 'إنشاء الخصم'}
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : discounts.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد خصومات بعد. أضف أول خصم من النموذج أعلاه.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الكود</th>
                  <th className="px-4 py-4 text-right font-black">النوع / القيمة</th>
                  <th className="px-4 py-4 text-right font-black">الاستخدام</th>
                  <th className="px-4 py-4 text-right font-black">صالح حتى</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-left font-black">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {discounts.map(d => (
                  <tr key={d.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-mono font-black text-[#C9A84C]">{d.code}</td>
                    <td className="px-4 py-4">
                      {d.type === 'percentage' ? `${d.value}%` : syp(d.value)}
                      <span className="ml-1 text-xs text-[#9CA3AF]">({d.type === 'percentage' ? 'نسبة' : 'ثابت'})</span>
                    </td>
                    <td className="px-4 py-4">{d.used_count ?? 0}{d.max_uses ? ` / ${d.max_uses}` : ' / ∞'}</td>
                    <td className="px-4 py-4">{d.valid_until ? new Date(d.valid_until).toLocaleDateString('ar-SY') : '—'}</td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => void toggleActive(d.id, d.is_active)}
                        className={['rounded-full border px-3 py-1 text-xs font-black', d.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-white/10 bg-white/5 text-[#9CA3AF]'].join(' ')}>
                        {d.is_active ? 'مفعّل' : 'موقوف'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <button type="button" onClick={() => void handleDelete(d.id)} className="text-xs font-black text-red-300 hover:text-red-200">حذف</button>
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