'use client';
import { useEffect, useState } from 'react';

interface ShippingRate {
  id: string; governorate: string; base_rate_syp: number;
  free_shipping_threshold_syp: number|null; is_active: boolean;
}
type Draft = { base_rate_syp: string; free_shipping_threshold_syp: string; is_active: boolean };

function pickArray<T>(p: unknown): T[] {
  if (Array.isArray(p)) return p as T[];
  if (p && typeof p === 'object') {
    const o = p as Record<string,unknown>;
    for (const k of ['data','items','rows','shipping_rates']) { if (Array.isArray(o[k])) return o[k] as T[]; }
  }
  return [];
}

export default function AdminShippingRatesPage() {
  const [rates, setRates]   = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string|null>(null);
  const [draft, setDraft]   = useState<Draft>({ base_rate_syp:'', free_shipping_threshold_syp:'', is_active:true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');
  const [error, setError]   = useState('');

  async function loadRates() {
    setLoading(true);
    try {
      const res = await fetch('/api/shipping-rates', { cache:'no-store' });
      const d = await res.json().catch(()=>null);
      setRates(pickArray<ShippingRate>(d));
    } catch { setError('تعذر تحميل أسعار الشحن'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadRates(); }, []);

  async function handleSave(id: string) {
    setSaving(true); setMsg(''); setError('');
    const body: Record<string,unknown> = { is_active: draft.is_active };
    const br = parseFloat(draft.base_rate_syp);
    const ft = parseFloat(draft.free_shipping_threshold_syp);
    if (!isNaN(br)) body.base_rate_syp = br;
    if (!isNaN(ft)) body.free_shipping_threshold_syp = ft;
    else if (draft.free_shipping_threshold_syp === '') body.free_shipping_threshold_syp = null;
    const res = await fetch(`/api/shipping-rates/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
    });
    if (res.ok) { setMsg('تم الحفظ بنجاح'); setEditId(null); void loadRates(); }
    else { const d = await res.json().catch(()=>null); setError((d as {error?:string}|null)?.error ?? 'فشل الحفظ'); }
    setSaving(false);
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1C1917]">أسعار الشحن</h1>
        <p className="mt-1 text-sm text-[#A8A29E]">{rates.length} محافظة</p>
      </div>
      {msg && <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">{msg}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['المحافظة','سعر الشحن (ل.س)','حد الشحن المجاني','الحالة','إجراء'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===2?'hidden md:table-cell':''} ${i===4?'text-left':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {rates.map(r => (
                  <tr key={r.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#1C1917]">{r.governorate}</td>
                    <td className="px-5 py-3">
                      {editId===r.id ? (
                        <input value={draft.base_rate_syp} onChange={e=>setDraft(d=>({...d,base_rate_syp:e.target.value}))} className="input-field w-28" type="number" />
                      ) : (
                        <span className="font-semibold text-[#B8860B]">{Number(r.base_rate_syp).toLocaleString('ar-SY')} ل.س</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-[#57534E]">
                      {editId===r.id ? (
                        <input value={draft.free_shipping_threshold_syp} onChange={e=>setDraft(d=>({...d,free_shipping_threshold_syp:e.target.value}))} className="input-field w-32" type="number" placeholder="بلا حد" />
                      ) : (
                        r.free_shipping_threshold_syp ? Number(r.free_shipping_threshold_syp).toLocaleString('ar-SY')+' ل.س' : '—'
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editId===r.id ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={draft.is_active} onChange={e=>setDraft(d=>({...d,is_active:e.target.checked}))} className="rounded" />
                          <span className="text-xs text-[#57534E]">نشط</span>
                        </label>
                      ) : (
                        <span className={r.is_active?'badge-green':'badge-gray'}>{r.is_active?'نشط':'معطّل'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-left">
                      {editId===r.id ? (
                        <div className="flex gap-2">
                          <button onClick={()=>void handleSave(r.id)} disabled={saving} className="font-bold text-green-600 hover:underline text-xs disabled:opacity-50">{saving?'حفظ...':'حفظ'}</button>
                          <button onClick={()=>setEditId(null)} className="font-bold text-[#A8A29E] hover:underline text-xs">إلغاء</button>
                        </div>
                      ) : (
                        <button onClick={()=>{setEditId(r.id);setDraft({base_rate_syp:String(r.base_rate_syp),free_shipping_threshold_syp:r.free_shipping_threshold_syp?String(r.free_shipping_threshold_syp):'',is_active:r.is_active});}} className="font-bold text-[#B8860B] hover:underline text-xs">تعديل</button>
                      )}
                    </td>
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