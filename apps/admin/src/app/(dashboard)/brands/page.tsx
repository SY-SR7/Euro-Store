'use client';

import { useEffect, useState } from 'react';

interface Brand {
  id: string;
  name: string;
  slug: string | null;
  is_active: boolean | null;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [name, setName]     = useState('');
  const [slug, setSlug]     = useState('');
  const [creating, setCreating] = useState(false);

  const [editId, setEditId]     = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/catalog/brands', { cache: 'no-store' });
    const d   = await res.json().catch(() => []);
    setBrands(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) { setError('الاسم والرابط مطلوبان'); return; }
    setError(''); setCreating(true);
    const res = await fetch('/api/catalog/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim().toLowerCase(), is_active: true }),
    });
    if (res.ok) { setName(''); setSlug(''); void load(); }
    else { const p = await res.json().catch(() => null); setError((p as {error?:string}|null)?.error ?? 'فشل الإضافة'); }
    setCreating(false);
  }

  async function handleEditSave(id: string) {
    await fetch(`/api/catalog/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    setEditId(null);
    void load();
  }

  async function handleToggle(id: string, current: boolean | null) {
    await fetch(`/api/catalog/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    void load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('حذف هذه الماركة؟')) return;
    await fetch(`/api/catalog/brands/${id}`, { method: 'DELETE' });
    void load();
  }

  const inp = 'rounded-2xl border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A84C]';

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
        <h1 className="text-3xl font-black text-white">إدارة الماركات</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">إضافة وتعديل وحذف ماركات المنتجات.</p>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
        <h2 className="mb-4 text-lg font-black text-white">ماركة جديدة</h2>
        <form onSubmit={e => void handleCreate(e)} className="flex flex-wrap gap-3 items-end">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الماركة *" className={inp} />
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="brand-slug *" className={inp + ' font-mono'} />
          <button type="submit" disabled={creating} className="rounded-2xl bg-[#C9A84C] px-5 py-2 text-sm font-black text-[#111] hover:bg-[#D8B95F] disabled:opacity-50">
            {creating ? 'جار...' : 'إضافة +'}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
        {loading ? <div className="p-10 text-center text-[#9CA3AF]">جار التحميل...</div> : brands.length === 0 ? (
          <div className="p-10 text-center text-[#9CA3AF]">لا توجد ماركات.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#C9A84C]">
                <tr>
                  <th className="px-4 py-4 text-right font-black">الاسم</th>
                  <th className="px-4 py-4 text-right font-black">slug</th>
                  <th className="px-4 py-4 text-right font-black">الحالة</th>
                  <th className="px-4 py-4 text-left font-black">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {brands.map(b => (
                  <tr key={b.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      {editId === b.id
                        ? <input value={editName} onChange={e => setEditName(e.target.value)} className={inp + ' w-full'} />
                        : <span className="font-bold text-white">{b.name}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{b.slug ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => void handleToggle(b.id, b.is_active)}
                        className={['rounded-full border px-3 py-1 text-xs font-black', b.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-white/10 bg-white/5 text-[#9CA3AF]'].join(' ')}>
                        {b.is_active ? 'مفعّل' : 'موقوف'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-left">
                      {editId === b.id ? (
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => void handleEditSave(b.id)} className="text-xs font-black text-green-300 hover:text-green-200">حفظ</button>
                          <button type="button" onClick={() => setEditId(null)} className="text-xs text-[#9CA3AF] hover:text-white">إلغاء</button>
                        </div>
                      ) : (
                        <div className="flex gap-3 justify-end">
                          <button type="button" onClick={() => { setEditId(b.id); setEditName(b.name); }} className="text-xs font-black text-[#C9A84C] hover:text-[#D8B95F]">تعديل</button>
                          <button type="button" onClick={() => void handleDelete(b.id)} className="text-xs font-black text-red-300 hover:text-red-200">حذف</button>
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