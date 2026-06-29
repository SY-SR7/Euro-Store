'use client';
import { useEffect, useState, useCallback } from 'react';

interface ShippingRate {
  id: string; governorate: string; base_rate_syp: number;
  free_shipping_threshold_syp: number|null; is_active: boolean;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="text-xl text-[#A8A29E] hover:text-[#1C1917]">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function pickArray<T>(p: unknown): T[] {
  if (Array.isArray(p)) return p as T[];
  if (p && typeof p === 'object') {
    const o = p as Record<string,unknown>;
    for (const k of ['data','items','shipping_rates']) { if (Array.isArray(o[k])) return o[k] as T[]; }
  }
  return [];
}

export default function AdminShippingRatesPage() {
  const [rates, setRates]     = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ShippingRate|null>(null);
  const [draft, setDraft]     = useState<{ base_rate_syp: string; free_shipping_threshold_syp: string; is_active: boolean }>({ base_rate_syp: '', free_shipping_threshold_syp: '', is_active: true });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch('/api/shipping-rates', { cache: 'no-store' }).then(r => r.json()).catch(() => []);
    setRates(pickArray<ShippingRate>(d));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openRate = (r: ShippingRate) => {
    setSelected(r);
    setDraft({ base_rate_syp: String(r.base_rate_syp), free_shipping_threshold_syp: r.free_shipping_threshold_syp ? String(r.free_shipping_threshold_syp) : '', is_active: r.is_active });
    setEditing(false); setMsg('');
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const body: Record<string,unknown> = { is_active: draft.is_active };
    const br = parseFloat(draft.base_rate_syp);
    if (!isNaN(br)) body.base_rate_syp = br;
    const ft = parseFloat(draft.free_shipping_threshold_syp);
    if (!isNaN(ft)) body.free_shipping_threshold_syp = ft;
    else if (!draft.free_shipping_threshold_syp) body.free_shipping_threshold_syp = null;
    const res = await fetch(`/api/shipping-rates/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated: ShippingRate = { ...selected, base_rate_syp: br || selected.base_rate_syp, free_shipping_threshold_syp: isNaN(ft) ? null : ft, is_active: draft.is_active };
      setSelected(updated); setRates(rs => rs.map(r => r.id === selected.id ? updated : r));
      setMsg('✓ تم الحفظ'); setEditing(false);
    } else { setMsg('✗ فشل الحفظ'); }
    setSaving(false);
  };

  const toggleActive = async (r: ShippingRate) => {
    await fetch(`/api/shipping-rates/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !r.is_active }) });
    if (selected?.id === r.id) { setSelected({ ...r, is_active: !r.is_active }); setDraft(d => ({ ...d, is_active: !r.is_active })); }
    void load();
  };

  const inp = 'w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]';

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">أسعار الشحن</h1><p className="mt-1 text-sm text-[#A8A29E]">{rates.length} محافظة — اضغط على أي صف للتعديل</p></div>
        <button onClick={load} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">تحديث ↻</button>
      </div>

      {msg && !selected && <div className={`rounded-xl px-5 py-3 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['المحافظة','سعر الشحن (ل.س)','الشحن المجاني من (ل.س)','الحالة'].map((h,i) => (
                  <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===2?'hidden md:table-cell':''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {rates.map(r => (
                  <tr key={r.id} className="hover:bg-[#FAFAF8] cursor-pointer transition-colors" onClick={() => openRate(r)}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917]">{r.governorate}</td>
                    <td className="px-5 py-3 font-bold text-[#B8860B]">{Number(r.base_rate_syp).toLocaleString('ar-SY')}</td>
                    <td className="px-5 py-3 text-xs text-[#57534E] hidden md:table-cell">{r.free_shipping_threshold_syp ? Number(r.free_shipping_threshold_syp).toLocaleString('ar-SY') : '—'}</td>
                    <td className="px-5 py-3" onClick={e => { e.stopPropagation(); void toggleActive(r); }}>
                      <span className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold ${r.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{r.is_active ? 'نشط' : 'معطّل'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={`شحن: ${selected.governorate}`} onClose={() => setSelected(null)}>
          {msg && <div className={`mb-3 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {!editing ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">المحافظة</span><span className="font-semibold">{selected.governorate}</span></div>
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">سعر الشحن</span><span className="font-bold text-[#B8860B]">{Number(selected.base_rate_syp).toLocaleString('ar-SY')} ل.س</span></div>
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">الشحن المجاني من</span><span className="font-semibold">{selected.free_shipping_threshold_syp ? Number(selected.free_shipping_threshold_syp).toLocaleString('ar-SY') + ' ل.س' : '— (لا يوجد)'}</span></div>
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">الحالة</span>
                <button onClick={() => void toggleActive(selected)} className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${selected.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {selected.is_active ? '✓ نشط' : '✗ معطّل'} — اضغط للتبديل
                </button>
              </div>
              <button onClick={() => setEditing(true)} className="mt-3 rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white">تعديل السعر</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">سعر الشحن (ل.س)</label>
              <input type="number" value={draft.base_rate_syp} onChange={e => setDraft(d => ({ ...d, base_rate_syp: e.target.value }))} className={inp} /></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">حد الشحن المجاني (ل.س) — اتركه فارغاً لإلغائه</label>
              <input type="number" value={draft.free_shipping_threshold_syp} onChange={e => setDraft(d => ({ ...d, free_shipping_threshold_syp: e.target.value }))} className={inp} /></div>
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                <input type="checkbox" checked={draft.is_active} onChange={e => setDraft(d => ({ ...d, is_active: e.target.checked }))} className="h-4 w-4 accent-[#B8860B]" />مفعّل
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} disabled={saving} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
                <button onClick={() => setEditing(false)} className="rounded-xl border border-[#E5E0D8] px-5 py-2 text-sm font-bold text-[#57534E]">إلغاء</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}