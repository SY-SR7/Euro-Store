'use client';

import { useEffect, useState } from 'react';

interface ShippingRate {
  id: string;
  governorate: string;
  base_rate_syp: number;
  free_shipping_threshold_syp: number | null;
  is_active: boolean;
}

type DraftValues = {
  base_rate_syp: string;
  free_shipping_threshold_syp: string;
  is_active: boolean;
};

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'rows', 'shipping_rates']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }

  return [];
}

function syp(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return `${new Intl.NumberFormat('ar-SY').format(Number.isFinite(numeric) ? numeric : 0)} ل.س`;
}

export default function AdminShippingRatesPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftValues>({
    base_rate_syp: '',
    free_shipping_threshold_syp: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadRates() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/shipping-rates', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل أسعار الشحن');
        setRates([]);
      } else {
        setRates(pickArray<ShippingRate>(payload));
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setRates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRates();
  }, []);

  function startEdit(rate: ShippingRate) {
    setEditId(rate.id);
    setDraft({
      base_rate_syp: String(rate.base_rate_syp ?? 0),
      free_shipping_threshold_syp: rate.free_shipping_threshold_syp === null ? '' : String(rate.free_shipping_threshold_syp),
      is_active: Boolean(rate.is_active)
    });
    setMessage('');
    setError('');
  }

  function cancelEdit() {
    setEditId(null);
    setDraft({
      base_rate_syp: '',
      free_shipping_threshold_syp: '',
      is_active: true
    });
  }

  async function saveEdit() {
    if (!editId) return;

    setSaving(true);
    setMessage('');
    setError('');

    const body = {
      base_rate_syp: Number(draft.base_rate_syp) || 0,
      free_shipping_threshold_syp: draft.free_shipping_threshold_syp ? Number(draft.free_shipping_threshold_syp) : null,
      is_active: draft.is_active
    };

    try {
      const res = await fetch(`/api/shipping-rates/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'فشل حفظ سعر الشحن');
      } else {
        const updated = payload as ShippingRate;
        setRates((prev) => prev.map((rate) => (rate.id === editId ? updated : rate)));
        setMessage('تم حفظ سعر الشحن بنجاح');
        cancelEdit();
      }
    } catch {
      setError('تعذر حفظ سعر الشحن');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h1 className="text-3xl font-black text-white">أسعار الشحن</h1>
        <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
          تعديل سعر الشحن وحد الشحن المجاني لكل محافظة.
        </p>
      </section>

      {message ? (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div>
        ) : rates.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد أسعار شحن.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">المحافظة</th>
                  <th className="px-4 py-4 text-right font-black">سعر الشحن</th>
                  <th className="px-4 py-4 text-right font-black">حد الشحن المجاني</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-left font-black">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {rates.map((rate) => {
                  const editing = editId === rate.id;

                  return (
                    <tr key={rate.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-black text-white">{rate.governorate}</td>

                      <td className="px-4 py-4">
                        {editing ? (
                          <input
                            type="number"
                            value={draft.base_rate_syp}
                            onChange={(e) => setDraft((v) => ({ ...v, base_rate_syp: e.target.value }))}
                            className="w-36 rounded-2xl border border-[#C9A84C] bg-[#080808] px-3 py-2 text-white outline-none"
                          />
                        ) : (
                          syp(rate.base_rate_syp)
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {editing ? (
                          <input
                            type="number"
                            value={draft.free_shipping_threshold_syp}
                            onChange={(e) => setDraft((v) => ({ ...v, free_shipping_threshold_syp: e.target.value }))}
                            placeholder="اتركه فارغاً للتعطيل"
                            className="w-44 rounded-2xl border border-[#C9A84C] bg-[#080808] px-3 py-2 text-white outline-none"
                          />
                        ) : rate.free_shipping_threshold_syp ? (
                          syp(rate.free_shipping_threshold_syp)
                        ) : (
                          'غير مفعّل'
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {editing ? (
                          <select
                            value={draft.is_active ? '1' : '0'}
                            onChange={(e) => setDraft((v) => ({ ...v, is_active: e.target.value === '1' }))}
                            className="rounded-2xl border border-[#C9A84C] bg-[#080808] px-3 py-2 text-white outline-none"
                          >
                            <option value="1">مفعّل</option>
                            <option value="0">غير مفعّل</option>
                          </select>
                        ) : (
                          <span
                            className={[
                              'rounded-full border px-3 py-1 text-xs font-black',
                              rate.is_active
                                ? 'border-green-400/20 bg-green-400/10 text-green-200'
                                : 'border-white/10 bg-white/5 text-[#9CA3AF]'
                            ].join(' ')}
                          >
                            {rate.is_active ? 'مفعّل' : 'غير مفعّل'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-left">
                        {editing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={saveEdit}
                              className="rounded-xl bg-[#C9A84C] px-4 py-2 text-xs font-black text-[#111111] disabled:opacity-50"
                            >
                              {saving ? 'جار الحفظ...' : 'حفظ'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-[#B8B1A4]"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(rate)}
                            className="text-xs font-black text-[#C9A84C] hover:text-[#D8B95F]"
                          >
                            تعديل
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}