'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Discount {
  id          : string;
  code        : string;
  type        : string;
  value       : number;
  min_order_syp: number;
  valid_until : string | null;
  max_uses    : number | null;
  used_count  : number;
  is_active   : boolean;
}

export default function AdminDiscountsPage() {
  const t = useTranslations();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading,   setLoading]   = useState(true);

  // New form
  const [code,        setCode]        = useState('');
  const [type,        setType]        = useState<'percentage' | 'fixed'>('percentage');
  const [value,       setValue]       = useState('');
  const [minOrder,    setMinOrder]    = useState('');
  const [validUntil,  setValidUntil]  = useState('');
  const [maxUses,     setMaxUses]     = useState('');
  const [creating,    setCreating]    = useState(false);
  const [createErr,   setCreateErr]   = useState('');

  async function fetchDiscounts() {
    setLoading(true);
    const res = await fetch('/api/discounts');
    const d   = await res.json() as Discount[];
    setDiscounts(d);
    setLoading(false);
  }

  useEffect(() => { void fetchDiscounts(); }, []);

  async function handleCreate() {
    setCreateErr(''); setCreating(true);
    const res  = await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code, type, value: parseFloat(value),
        min_order_syp: minOrder ? parseFloat(minOrder) : 0,
        valid_until  : validUntil || null,
        max_uses     : maxUses ? parseInt(maxUses, 10) : null,
      }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) { setCreateErr(data.error ?? 'خطأ'); }
    else { setCode(''); setValue(''); setMinOrder(''); setValidUntil(''); setMaxUses(''); void fetchDiscounts(); }
    setCreating(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/discounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    void fetchDiscounts();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
    void fetchDiscounts();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#E2E2E2] mb-8">{t('admin.discounts')}</h1>

      {/* Create form */}
      <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('admin.newDiscount')}</h2>
        {createErr && <p className="mb-4 text-sm text-red-400">{createErr}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#9CA3AF]">{t('admin.discountCode')}</label>
            <input className="input-admin" value={code} onChange={(e) => setCode((e.target as HTMLInputElement).value)} placeholder="SUMMER20" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#9CA3AF]">{t('admin.discountType')}</label>
            <select className="input-admin" value={type} onChange={(e) => setType((e.target as HTMLSelectElement).value as 'percentage' | 'fixed')}>
              <option value="percentage">{t('admin.discountPercentage')}</option>
              <option value="fixed">{t('admin.discountFixed')}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#9CA3AF]">{t('admin.discountValue')}</label>
            <input className="input-admin" type="number" value={value} onChange={(e) => setValue((e.target as HTMLInputElement).value)} placeholder="20" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#9CA3AF]">{t('admin.minOrderSyp')}</label>
            <input className="input-admin" type="number" value={minOrder} onChange={(e) => setMinOrder((e.target as HTMLInputElement).value)} placeholder="0" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#9CA3AF]">{t('admin.validUntil')}</label>
            <input className="input-admin" type="date" value={validUntil} onChange={(e) => setValidUntil((e.target as HTMLInputElement).value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#9CA3AF]">{t('admin.maxUses')}</label>
            <input className="input-admin" type="number" value={maxUses} onChange={(e) => setMaxUses((e.target as HTMLInputElement).value)} placeholder="∞" />
          </div>
        </div>
        <button
          onClick={handleCreate} disabled={creating || !code || !value}
          className="mt-4 rounded-md bg-[#C9A84C] px-6 py-2 text-sm font-semibold text-[#0F0F0F] hover:bg-[#A67C2E] disabled:opacity-50"
        >
          {creating ? t('common.loading') : t('admin.createDiscount')}
        </button>
      </div>

      {/* Discounts table */}
      {loading ? <p className="text-[#9CA3AF]">{t('common.loading')}</p> : (
        <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
          <table className="w-full text-sm">
            <thead className="bg-[#1A1A1A] text-[#9CA3AF] text-xs">
              <tr>
                <th className="px-4 py-3 text-start">{t('admin.discountCode')}</th>
                <th className="px-4 py-3 text-start">{t('admin.discountType')}</th>
                <th className="px-4 py-3 text-start">{t('admin.discountValue')}</th>
                <th className="px-4 py-3 text-start">{t('admin.usedCount')}</th>
                <th className="px-4 py-3 text-start">{t('admin.validUntil')}</th>
                <th className="px-4 py-3 text-start">{t('common.status')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {discounts.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-mono text-[#C9A84C] font-semibold">{d.code}</td>
                  <td className="px-4 py-3 text-[#D6D3C7]">{d.type === 'percentage' ? '%' : 'ثابت'}</td>
                  <td className="px-4 py-3 text-[#D6D3C7]">{d.type === 'percentage' ? `${d.value}%` : `${d.value.toLocaleString('ar-SY')} ل.س`}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{d.used_count}{d.max_uses ? ` / ${d.max_uses}` : ''}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs">{d.valid_until ? new Date(d.valid_until).toLocaleDateString('ar-SY') : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(d.id, d.is_active)} className={`text-xs px-2 py-1 rounded-sm ${d.is_active ? 'text-green-400' : 'text-[#9CA3AF]'}`}>
                      {d.is_active ? t('common.active') : t('common.inactive')}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(d.id)} className="text-xs text-red-400 hover:text-red-300">{t('common.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

