'use client';
import { useEffect, useState } from 'react';

interface Brand { id: string; name: string; slug: string|null; is_active: boolean|null; }

export default function AdminBrandsPage() {
  const [brands, setBrands]   = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [name, setName]       = useState('');
  const [slug, setSlug]       = useState('');
  const [creating, setCreating] = useState(false);
  const [editId, setEditId]   = useState<string|null>(null);
  const [editName, setEditName] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/catalog/brands', { cache:'no-store' });
    const d = await res.json().catch(()=>[]);
    setBrands(Array.isArray(d) ? d : []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) { setError('الاسم والرابط مطلوبان'); return; }
    setError(''); setCreating(true);
    const res = await fetch('/api/catalog/brands', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name:name.trim(), slug:slug.trim().toLowerCase(), is_active:true }),
    });
    if (res.ok) { setName(''); setSlug(''); void load(); }
    else { const p = await res.json().catch(()=>null); setError((p as {error?:string}|null)?.error ?? 'فشل الإضافة'); }
    setCreating(false);
  }

  async function handleEditSave(id: string) {
    await fetch(`/api/catalog/brands/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name:editName }),
    });
    setEditId(null); void load();
  }

  async function handleToggle(id: string, current: boolean|null) {
    await fetch(`/api/catalog/brands/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ is_active: !current }),
    });
    void load();
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذه العلامة التجارية؟')) return;
    await fetch(`/api/catalog/brands/${id}`, { method:'DELETE' });
    void load();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1C1917]">العلامات التجارية</h1>
        <p className="mt-1 text-sm text-[#A8A29E]">{brands.length} علامة</p>
      </div>
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-black text-[#B8860B]">إضافة علامة جديدة</h2>
        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم العلامة *" className="input-field flex-1 min-w-[140px]" />
          <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="الرابط (en-slug) *" className="input-field flex-1 min-w-[140px]" dir="ltr" />
          <button type="submit" disabled={creating} className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-black text-[#1F1B16] hover:bg-[#9A7209] disabled:opacity-50 transition-colors">
            {creating ? '...' : '+ إضافة'}
          </button>
        </form>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</p>
        : brands.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد علامات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['الاسم','الرابط','الحالة','إجراءات'].map((h,i) => (
                    <th key={i} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${i===1?'hidden sm:table-cell':''} ${i===3?'text-left':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {brands.map(b => (
                  <tr key={b.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-5 py-3">
                      {editId===b.id ? (
                        <input value={editName} onChange={e=>setEditName(e.target.value)} className="input-field" />
                      ) : (
                        <span className="font-semibold text-[#1C1917]">{b.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#A8A29E] hidden sm:table-cell">{b.slug ?? '—'}</td>
                    <td className="px-5 py-3">
                      <button onClick={()=>void handleToggle(b.id, b.is_active)} className="transition-opacity hover:opacity-70">
                        <span className={b.is_active ? 'badge-green' : 'badge-gray'}>{b.is_active ? 'نشط' : 'معطّل'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-left">
                      {editId===b.id ? (
                        <div className="flex gap-2">
                          <button onClick={()=>void handleEditSave(b.id)} className="font-bold text-green-600 hover:underline text-xs">حفظ</button>
                          <button onClick={()=>setEditId(null)} className="font-bold text-[#A8A29E] hover:underline text-xs">إلغاء</button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button onClick={()=>{setEditId(b.id);setEditName(b.name);}} className="font-bold text-[#B8860B] hover:underline text-xs">تعديل</button>
                          <button onClick={()=>void handleDelete(b.id)} className="font-bold text-red-500 hover:underline text-xs">حذف</button>
                        </div>
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