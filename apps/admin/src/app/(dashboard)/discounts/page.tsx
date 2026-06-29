'use client';
import { useEffect, useState, useCallback } from 'react';

interface Discount {
  id: string; code: string; type: string; value: number;
  min_order_syp?: number|null; valid_from?: string|null; valid_until?: string|null;
  max_uses?: number|null; used_count?: number|null; is_active: boolean;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
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
    for (const k of ['data','items','discounts']) { if (Array.isArray(o[k])) return o[k] as T[]; }
  }
  return [];
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Discount|null>(null);
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState<Partial<Discount & { valid_from_date: string; valid_until_date: string }>>({});
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm]     = useState({ code:'', type:'percentage', value:'', min_order_syp:'', valid_from:'', valid_until:'', max_uses:'' });
  const [creating, setCreating]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch('/api/discounts', { cache: 'no-store' }).then(r => r.json()).catch(() => []);
    setDiscounts(pickArray<Discount>(d));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openDiscount = (d: Discount) => { setSelected(d); setEditing(false); setDraft({}); setMsg(''); };
  const startEdit = () => {
    if (!selected) return;
    setDraft({
      ...selected,
      valid_from_date: selected.valid_from ? selected.valid_from.substring(0,10) : '',
      valid_until_date: selected.valid_until ? selected.valid_until.substring(0,10) : '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const body: Record<string,unknown> = {};
    if (typeof draft.value === 'number') body.value = draft.value;
    if (typeof draft.min_order_syp === 'number' || draft.min_order_syp === null) body.min_order_syp = draft.min_order_syp;
    if (typeof draft.max_uses === 'number' || draft.max_uses === null) body.max_uses = draft.max_uses;
    if (typeof draft.is_active === 'boolean') body.is_active = draft.is_active;
    if ((draft as Record<string,string>)['valid_from_date']) body.valid_from = (draft as Record<string,string>)['valid_from_date'];
    if ((draft as Record<string,string>)['valid_until_date']) body.valid_until = (draft as Record<string,string>)['valid_until_date'];
    const res = await fetch(`/api/discounts/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      await load(); setMsg('✓ تم الحفظ'); setEditing(false);
      const fresh = discounts.find(d => d.id === selected.id);
      if (fresh) setSelected(fresh);
    } else { setMsg('✗ فشل الحفظ'); }
    setSaving(false);
  };

  const toggleActive = async (d: Discount) => {
    await fetch(`/api/discounts/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !d.is_active }) });
    if (selected?.id === d.id) setSelected({ ...d, is_active: !d.is_active });
    void load();
  };

  const deleteDiscount = async (d: Discount) => {
    if (!confirm(`حذف كود "${d.code}"؟`)) return;
    await fetch(`/api/discounts/${d.id}`, { method: 'DELETE' });
    setSelected(null); void load();
  };

  const handleCreate = async () => {
    if (!newForm.code || !newForm.value) { setMsg('الكود والقيمة مطلوبان'); return; }
    setCreating(true);
    const body: Record<string, unknown> = {
      code: newForm.code.toUpperCase(), type: newForm.type, value: parseFloat(newForm.value),
      min_order_syp: newForm.min_order_syp ? parseFloat(newForm.min_order_syp) : 0,
      max_uses: newForm.max_uses ? parseInt(newForm.max_uses) : null,
      valid_from: newForm.valid_from || new Date().toISOString().substring(0,10),
      valid_until: newForm.valid_until || new Date(Date.now() + 90*24*60*60*1000).toISOString().substring(0,10),
    };
    const res = await fetch('/api/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setNewForm({ code:'', type:'percentage', value:'', min_order_syp:'', valid_from:'', valid_until:'', max_uses:'' }); setShowCreate(false); void load(); }
    else { const d = await res.json().catch(() => null); setMsg('✗ ' + ((d as {error?:string}|null)?.error ?? 'فشل')); }
    setCreating(false);
  };

  const inp = 'w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]';

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div><h1 className="text-2xl font-black text-[#1C1917]">أكواد الخصم</h1><p className="mt-1 text-sm text-[#A8A29E]">{discounts.length} كود</p></div>
        <button onClick={() => setShowCreate(v => !v)} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-white hover:bg-[#9A7209]">{showCreate ? 'إلغاء' : '+ كود جديد'}</button>
      </div>

      {msg && <div className={`rounded-xl px-5 py-3 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {showCreate && (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-black text-[#B8860B]">كود جديد</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input value={newForm.code} onChange={e => setNewForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="CODE *" className={inp} dir="ltr" />
            <select value={newForm.type} onChange={e => setNewForm(f=>({...f,type:e.target.value}))} className={inp}>
              <option value="percentage">نسبة مئوية (%)</option>
              <option value="fixed">مبلغ ثابت (ل.س)</option>
            </select>
            <input value={newForm.value} onChange={e => setNewForm(f=>({...f,value:e.target.value}))} placeholder="القيمة *" type="number" className={inp} />
            <input value={newForm.min_order_syp} onChange={e => setNewForm(f=>({...f,min_order_syp:e.target.value}))} placeholder="حد أدنى (ل.س)" type="number" className={inp} />
            <input value={newForm.max_uses} onChange={e => setNewForm(f=>({...f,max_uses:e.target.value}))} placeholder="أقصى استخدام" type="number" className={inp} />
            <div className="space-y-1">
              <label className="text-xs text-[#A8A29E]">صالح من</label>
              <input value={newForm.valid_from} onChange={e => setNewForm(f=>({...f,valid_from:e.target.value}))} type="date" className={inp} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#A8A29E]">صالح حتى</label>
              <input value={newForm.valid_until} onChange={e => setNewForm(f=>({...f,valid_until:e.target.value}))} type="date" className={inp} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-black text-white disabled:opacity-50">{creating ? '...' : '+ إنشاء'}</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : discounts.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد أكواد</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]"><tr>
                {['الكود','النوع','القيمة','الاستخدام','الحالة'].map((h,i) => <th key={i} className="px-4 py-3 text-right text-xs font-black text-[#A8A29E]">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {discounts.map(d => (
                  <tr key={d.id} className="hover:bg-[#FAFAF8] cursor-pointer transition-colors" onClick={() => openDiscount(d)}>
                    <td className="px-4 py-3 font-mono font-bold text-[#1C1917]">{d.code}</td>
                    <td className="px-4 py-3 text-[#57534E]">{d.type==='percentage'?'نسبة':'ثابت'}</td>
                    <td className="px-4 py-3 font-semibold text-[#B8860B]">{d.value}{d.type==='percentage'?'%':' ل.س'}</td>
                    <td className="px-4 py-3 text-xs text-[#57534E]">{d.used_count ?? 0}/{d.max_uses ?? '∞'}</td>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); void toggleActive(d); }}>
                      <span className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold ${d.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{d.is_active ? 'نشط' : 'معطّل'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={`كود: ${selected.code}`} onClose={() => setSelected(null)}>
          {msg && <div className={`mb-3 rounded-xl px-4 py-2 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
          {!editing ? (
            <div className="space-y-3 text-sm">
              {[['الكود', selected.code],['النوع', selected.type==='percentage'?'نسبة مئوية':'مبلغ ثابت'],['القيمة', `${selected.value}${selected.type==='percentage'?'%':' ل.س'}`],['الحد الأدنى', selected.min_order_syp ? `${Number(selected.min_order_syp).toLocaleString('ar-SY')} ل.س` : '—'],['الاستخدام', `${selected.used_count ?? 0} / ${selected.max_uses ?? '∞'}`],['صالح من', selected.valid_from ? new Date(selected.valid_from).toLocaleDateString('ar-SY') : '—'],['صالح حتى', selected.valid_until ? new Date(selected.valid_until).toLocaleDateString('ar-SY') : '—']].map(([l,v]) => (
                <div key={l} className="flex justify-between border-b border-[#F0ECE6] pb-2"><span className="text-[#A8A29E]">{l}</span><span className="font-semibold text-[#1C1917]">{v}</span></div>
              ))}
              <div className="flex justify-between border-b border-[#F0ECE6] pb-2">
                <span className="text-[#A8A29E]">الحالة</span>
                <button onClick={() => void toggleActive(selected)} className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${selected.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {selected.is_active ? '✓ نشط' : '✗ معطّل'} — اضغط للتبديل
                </button>
              </div>
              <div className="flex gap-2 pt-3">
                <button onClick={startEdit} className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white">تعديل</button>
                <button onClick={() => void deleteDiscount(selected)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">حذف</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">القيمة</label>
              <input type="number" value={draft.value ?? ''} onChange={e => setDraft(d => ({ ...d, value: parseFloat(e.target.value) }))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" /></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">الحد الأدنى للطلب (ل.س)</label>
              <input type="number" value={draft.min_order_syp ?? ''} onChange={e => setDraft(d => ({ ...d, min_order_syp: e.target.value ? parseFloat(e.target.value) : null }))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" /></div>
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">أقصى استخدام</label>
              <input type="number" value={draft.max_uses ?? ''} onChange={e => setDraft(d => ({ ...d, max_uses: e.target.value ? parseInt(e.target.value) : null }))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">صالح من</label>
                <input type="date" value={(draft as Record<string,string>)['valid_from_date'] ?? ''} onChange={e => setDraft(d => ({ ...d, valid_from_date: e.target.value }))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" /></div>
                <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">صالح حتى</label>
                <input type="date" value={(draft as Record<string,string>)['valid_until_date'] ?? ''} onChange={e => setDraft(d => ({ ...d, valid_until_date: e.target.value }))} className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]" /></div>
              </div>
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