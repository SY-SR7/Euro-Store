'use client';
import { useEffect, useState, useCallback } from 'react';
import AttributeTypesQuickAdmin from './AttributeTypesQuickAdmin';

export default AttributeTypesQuickAdmin;

interface AttributeValue {
  id: string; value_ar: string; value_en: string|null;
  hex_color: string|null; sort_order: number;
}
interface AttributeType {
  id: string; name_ar: string; name_en: string; slug: string;
  attribute_values: AttributeValue[];
}
interface AddForm { value_ar: string; value_en: string; hex_color: string; sort_order: string; }

function ColorDot({ hex }: { hex?: string | null }) {
  if (!hex) return null;
  return <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: hex, border: '1.5px solid rgba(0,0,0,0.15)', verticalAlign: 'middle', marginLeft: 4 }} />;
}

const inp = 'w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]';

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F2] text-[#A8A29E] hover:bg-[#E5E0D8] text-lg">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function LegacyAttributeTypesPage() {
  const [types, setTypes]     = useState<AttributeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');
  const [saving, setSaving]   = useState(false);
  const [addForm, setAddForm] = useState<Record<string, AddForm>>({});
  const [selected, setSelected] = useState<{ typeId: string; value: AttributeValue } | null>(null);
  const [draft, setDraft]     = useState<Partial<AttributeValue>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch('/api/catalog/attribute-types').then(r => r.json()).catch(() => []);
    setTypes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addValue = async (typeId: string) => {
    const f = addForm[typeId];
    if (!f?.value_ar) return;
    setSaving(true); setMsg('');
    const res = await fetch('/api/catalog/attribute-values', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attribute_type_id: typeId,
        value_ar: f.value_ar,
        value_en: f.value_en || f.value_ar,
        hex_color: f.hex_color || null,
        sort_order: Number(f.sort_order) || 0,
      }),
    });
    if (res.ok) { setMsg('✓ تمت الإضافة'); setAddForm(p => ({ ...p, [typeId]: { value_ar: '', value_en: '', hex_color: '', sort_order: '' } })); await load(); }
    else { const d = await res.json().catch(() => null) as { error?: string } | null; setMsg('✗ ' + (d?.error ?? 'فشل')); }
    setSaving(false);
  };

  const deleteValue = async (avId: string) => {
    if (!confirm('حذف هذه القيمة؟')) return;
    await fetch(`/api/catalog/attribute-values/${avId}`, { method: 'DELETE' });
    setSelected(null);
    setMsg('✓ تم الحذف');
    await load();
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/attribute-values/${selected.value.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
    });
    if (res.ok) { setMsg('✓ تم الحفظ'); setSelected(null); await load(); }
    else { const d = await res.json().catch(() => null) as { error?: string } | null; setMsg('✗ ' + (d?.error ?? 'فشل')); }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      <h1 className="text-2xl font-black text-[#1C1917]">إدارة الصفات (لون / مقاس / ...)</h1>
      <p className="text-sm text-[#A8A29E]">هنا يمكنك إدارة أنواع الصفات وقيمها. كل خيار في المتغيرات يرتبط بهذه القيم. اضغط على أي قيمة لتعديلها.</p>

      {msg && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      {types.map(at => {
        const f = addForm[at.id] ?? { value_ar: '', value_en: '', hex_color: '', sort_order: '' };
        const isColor = at.slug === 'color';
        return (
          <div key={at.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-black text-[#1C1917]">{at.name_ar}</h2>
              <p className="text-xs text-[#A8A29E]">{at.name_en} · slug: {at.slug}</p>
            </div>

            {/* Values list — click to edit */}
            <div className="flex flex-wrap gap-2">
              {(at.attribute_values ?? [])
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(av => (
                  <button key={av.id} onClick={()=>{ setSelected({ typeId: at.id, value: av }); setDraft({}); setMsg(''); }}
                    className="group flex items-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-1.5 text-sm hover:border-[#B8860B] transition-colors">
                    <ColorDot hex={av.hex_color} />
                    <span className="font-semibold">{av.value_ar}</span>
                    {av.value_en && av.value_en !== av.value_ar && <span className="text-[10px] text-[#A8A29E]">({av.value_en})</span>}
                    {av.hex_color && <span className="font-mono text-[10px] text-[#A8A29E]">{av.hex_color}</span>}
                  </button>
                ))}
              {(at.attribute_values ?? []).length === 0 && (
                <p className="text-xs text-[#A8A29E]">لا توجد قيم بعد</p>
              )}
            </div>

            {/* Add value form */}
            <div className="border-t border-[#F0ECE6] pt-4">
              <p className="mb-2 text-xs font-black text-[#57534E]">إضافة قيمة جديدة</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <input placeholder="القيمة بالعربية *" value={f.value_ar} onChange={e => setAddForm(p => ({ ...p, [at.id]: { ...f, value_ar: e.target.value } }))} className={inp} />
                <input placeholder="القيمة بالإنجليزية" value={f.value_en} onChange={e => setAddForm(p => ({ ...p, [at.id]: { ...f, value_en: e.target.value } }))} className={inp} />
                {isColor ? (
                  <div className="flex gap-1">
                    <input type="color" value={f.hex_color || '#000000'} onChange={e => setAddForm(p => ({ ...p, [at.id]: { ...f, hex_color: e.target.value } }))} className="h-10 w-10 rounded-lg border border-[#E5E0D8] cursor-pointer" />
                    <input placeholder="Hex (#...)" value={f.hex_color} onChange={e => setAddForm(p => ({ ...p, [at.id]: { ...f, hex_color: e.target.value } }))} className={inp} />
                  </div>
                ) : (
                  <input placeholder="الترتيب (رقم)" type="number" value={f.sort_order} onChange={e => setAddForm(p => ({ ...p, [at.id]: { ...f, sort_order: e.target.value } }))} className={inp} />
                )}
                <button onClick={() => addValue(at.id)} disabled={saving || !f.value_ar}
                  className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">
                  {saving ? '...' : 'إضافة'}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {selected && (
        <Modal title={`تعديل: ${selected.value.value_ar}`} onClose={()=>setSelected(null)}>
          <div className="space-y-3">
            <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">القيمة بالعربية</label>
              <input value={String(draft.value_ar ?? selected.value.value_ar)} onChange={e=>setDraft(d=>({...d, value_ar:e.target.value}))} className={inp} />
            </div>
            <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">القيمة بالإنجليزية</label>
              <input value={String(draft.value_en ?? selected.value.value_en ?? '')} onChange={e=>setDraft(d=>({...d, value_en:e.target.value}))} dir="ltr" className={inp} />
            </div>
            {types.find(t=>t.id===selected.typeId)?.slug === 'color' && (
              <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">اللون</label>
                <div className="flex gap-1">
                  <input type="color" value={String(draft.hex_color ?? selected.value.hex_color ?? '#000000')} onChange={e=>setDraft(d=>({...d, hex_color:e.target.value}))} className="h-10 w-10 rounded-lg border border-[#E5E0D8] cursor-pointer" />
                  <input value={String(draft.hex_color ?? selected.value.hex_color ?? '')} onChange={e=>setDraft(d=>({...d, hex_color:e.target.value}))} dir="ltr" className={inp} />
                </div>
              </div>
            )}
            <div><label className="mb-1 block text-xs font-bold text-[#A8A29E]">الترتيب</label>
              <input type="number" value={String(draft.sort_order ?? selected.value.sort_order)} onChange={e=>setDraft(d=>({...d, sort_order:Number(e.target.value)}))} className={inp} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEdit} disabled={saving} className="flex-1 rounded-xl bg-[#B8860B] py-2 text-sm font-bold text-white disabled:opacity-50">{saving?'...':'حفظ'}</button>
              <button onClick={()=>void deleteValue(selected.value.id)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">حذف</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
