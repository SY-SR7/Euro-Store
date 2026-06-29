/// <reference lib="dom" />
'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';

interface ShippingRate {
  id: string;
  governorate: string;
  base_rate_syp: number;
  free_shipping_threshold_syp: number | null;
  is_active: boolean;
}

export default function AdminShippingRatesPage() {
  const t = useTranslations();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ShippingRate>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void fetch('/api/shipping-rates').then(r => r.json()).then((d: ShippingRate[]) => {
      setRates(d);
      setLoading(false);
    });
  }, []);

  function startEdit(rate: ShippingRate) {
    setEditId(rate.id);
    setEditValues({ base_rate_syp: rate.base_rate_syp, free_shipping_threshold_syp: rate.free_shipping_threshold_syp ?? null, is_active: rate.is_active });
    setMsg('');
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    const res = await fetch(`/api/shipping-rates/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editValues),
    });
    if (res.ok) {
      const updated = await res.json() as ShippingRate;
      setRates(prev => prev.map(r => r.id === editId ? updated : r));
      setMsg('ØªÙ… Ø§Ù„Ø­ÙØ¸ Ø¨Ù†Ø¬Ø§Ø­ âœ“');
      setEditId(null);
    } else {
      setMsg('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø­ÙØ¸');
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('admin.shippingRates')}</h1>
        {msg && <p className="text-sm text-green-400">{msg}</p>}
      </div>

      <p className="text-sm text-[#9CA3AF]">
        ØªØ¹Ø¯ÙŠÙ„ Ø£Ø³Ø¹Ø§Ø± Ø§Ù„Ø´Ø­Ù† Ù„ÙƒÙ„ Ù…Ø­Ø§ÙØ¸Ø©. Ø§Ø¶ØºØ· ØªØ¹Ø¯ÙŠÙ„ØŒ ØºÙŠÙ‘Ø± Ø§Ù„Ù‚ÙŠÙ…Ø©ØŒ Ø«Ù… Ø§Ø­ÙØ¸.
      </p>

      {loading ? (
        <p className="text-[#9CA3AF]">{t('common.loading')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#2E2E2E]">
          <table className="w-full text-sm text-[#E2E2E2]">
            <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-3 text-start">Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©</th>
                <th className="px-4 py-3 text-start">Ø³Ø¹Ø± Ø§Ù„Ø´Ø­Ù† (Ù„.Ø³)</th>
                <th className="px-4 py-3 text-start">Ø­Ø¯ Ø§Ù„Ø´Ø­Ù† Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠ (Ù„.Ø³)</th>
                <th className="px-4 py-3 text-start">Ø§Ù„Ø­Ø§Ù„Ø©</th>
                <th className="px-4 py-3 text-start"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {rates.map((rate) => (
                <tr key={rate.id} className="hover:bg-[#161616] transition-colors">
                  <td className="px-4 py-3 font-medium">{rate.governorate}</td>

                  {/* base rate */}
                  <td className="px-4 py-3">
                    {editId === rate.id ? (
                      <input
                        type="number"
                        value={editValues.base_rate_syp ?? ''}
                        onChange={e => setEditValues(v => ({ ...v, base_rate_syp: Number((e.target as unknown as HTMLInputElement).value) }))}
                        className="w-32 rounded border border-[#C9A84C] bg-[#0F0F0F] px-2 py-1 text-sm text-[#E2E2E2] outline-none"
                      />
                    ) : (
                      <span>{formatSYP(rate.base_rate_syp)}</span>
                    )}
                  </td>

                  {/* free shipping threshold */}
                  <td className="px-4 py-3">
                    {editId === rate.id ? (
                      <input
                        type="number"
                        value={editValues.free_shipping_threshold_syp ?? ''}
                        onChange={e => setEditValues(v => ({ ...v, free_shipping_threshold_syp: (e.target as unknown as HTMLInputElement).value ? Number((e.target as unknown as HTMLInputElement).value) : null }))}
                        className="w-36 rounded border border-[#C9A84C] bg-[#0F0F0F] px-2 py-1 text-sm text-[#E2E2E2] outline-none"
                        placeholder="0 = Ù…Ø¹Ø·Ù„"
                      />
                    ) : (
                      <span>{rate.free_shipping_threshold_syp ? formatSYP(rate.free_shipping_threshold_syp) : 'â€”'}</span>
                    )}
                  </td>

                  {/* is_active */}
                  <td className="px-4 py-3">
                    {editId === rate.id ? (
                      <select
                        value={editValues.is_active ? '1' : '0'}
                        onChange={e => setEditValues(v => ({ ...v, is_active: (e.target as unknown as HTMLInputElement).value === '1' }))}
                        className="rounded border border-[#C9A84C] bg-[#0F0F0F] px-2 py-1 text-sm text-[#E2E2E2]"
                      >
                        <option value="1">Ù†Ø´Ø·</option>
                        <option value="0">Ù…ØªÙˆÙ‚Ù</option>
                      </select>
                    ) : (
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${rate.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {rate.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    )}
                  </td>

                  {/* actions */}
                  <td className="px-4 py-3">
                    {editId === rate.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => void saveEdit()}
                          disabled={saving}
                          className="rounded bg-[#C9A84C] px-3 py-1 text-xs font-semibold text-[#111] hover:bg-[#D8B95F] disabled:opacity-50"
                        >
                          {saving ? '...' : t('common.save')}
                        </button>
                        <button
                          onClick={() => { setEditId(null); setMsg(''); }}
                          className="rounded border border-[#2E2E2E] px-3 py-1 text-xs text-[#9CA3AF] hover:text-[#E2E2E2]"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(rate)}
                        className="text-xs text-[#C9A84C] hover:underline"
                      >
                        {t('common.edit')}
                      </button>
                    )}
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

