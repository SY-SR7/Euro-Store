'use client';
// @ts-nocheck
/* eslint-disable */
import { useEffect, useState, useCallback } from 'react';

function ColorDot({ hex }: { hex?: string | null }) {
  if (!hex) return null;
  return <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: hex, border: '1.5px solid rgba(0,0,0,0.15)', verticalAlign: 'middle', marginLeft: 4 }} />;
}

const inp = 'w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]';

export default function AttributeTypesPage() {
  const [types, setTypes]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState('');
  const [saving, setSaving] = useState(false);

  // Add value form
  const [addForm, setAddForm] = useState<Record<string, { value_ar: string; value_en: string; hex_color: string; sort_order: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch('/api/catalog/attribute-types').then(r => r.json()).catch(() => []);
    setTypes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
    else { const d = await res.json().catch(() => null); setMsg('✗ ' + (d?.error ?? 'فشل')); }
    setSaving(false);
  };

  const deleteValue = async (avId: string) => {
    if (!confirm('حذف هذه القيمة؟')) return;
    await fetch(`/api/catalog/attribute-values/${avId}`, { method: 'DELETE' });
    setMsg('✓ تم الحذف');
    await load();
  };

  if (loading) return <div className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      <h1 className="text-2xl font-black text-[#1C1917]">إدارة الصفات (لون / مقاس / ...)</h1>
      <p className="text-sm text-[#A8A29E]">هنا يمكنك إدارة أنواع الصفات وقيمها. كل خيار في المتغيرات يرتبط بهذه القيم.</p>

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

            {/* Values list */}
            <div className="flex flex-wrap gap-2">
              {(at.attribute_values ?? [])
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((av: any) => (
                  <div key={av.id} className="group flex items-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-1.5 text-sm">
                    <ColorDot hex={av.hex_color} />
                    <span className="font-semibold">{av.value_ar}</span>
                    {av.value_en && av.value_en !== av.value_ar && <span className="text-[10px] text-[#A8A29E]">({av.value_en})</span>}
                    {av.hex_color && <span className="font-mono text-[10px] text-[#A8A29E]">{av.hex_color}</span>}
                    <button onClick={() => deleteValue(av.id)} className="mr-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">×</button>
                  </div>
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
    </div>
  );
}