/// <reference lib="dom" />
'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface HomeSection {
  id: string; title_ar: string; title_en: string;
  type: string; position: number; is_active: boolean;
}

export default function HomepagePage() {
  const t = useTranslations();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title_ar: '', title_en: '', type: 'featured_products', position: 0, is_active: true });

  const load = async () => {
    const res = await fetch('/api/catalog/homepage');
    const data = await res.json() as HomeSection[];
    setSections(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/catalog/homepage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ title_ar: '', title_en: '', type: 'featured_products', position: 0, is_active: true });
    void load();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await fetch(`/api/catalog/homepage/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !is_active }) });
    void load();
  };

  const remove = async (id: string) => {
    if (!window.confirm(t('adminCatalog.confirmDelete'))) return;
    await fetch(`/api/catalog/homepage/${id}`, { method: 'DELETE' });
    void load();
  };

  const inp = "w-full rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 text-[#E2E2E2] text-sm outline-none focus:border-[#C9A84C]";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('adminCatalog.homepageSections')}</h1>

      <form onSubmit={submit} className="grid gap-4 rounded-lg border border-[#2E2E2E] bg-[#151515] p-6 md:grid-cols-2">
        <input className={inp} placeholder={t('adminCatalog.titleAr')} value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: (e.target as unknown as HTMLInputElement).value }))} required />
        <input className={inp} placeholder={t('adminCatalog.titleEn')} value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: (e.target as unknown as HTMLInputElement).value }))} required />
        <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: (e.target as unknown as HTMLInputElement).value }))}>
          {['hero','featured_products','banner','categories_grid','loyalty_teaser'].map(tp => (
            <option key={tp} value={tp}>{tp}</option>
          ))}
        </select>
        <input type="number" className={inp} placeholder={t('adminCatalog.position')} value={form.position}
          onChange={e => setForm(f => ({ ...f, position: Number((e.target as unknown as HTMLInputElement).value) }))} />
        <button type="submit" className="md:col-span-2 rounded bg-[#C9A84C] px-6 py-2.5 font-semibold text-[#111] hover:bg-[#b8943e]">
          {t('adminCatalog.addSection')}
        </button>
      </form>

      {loading ? <p className="text-[#9CA3AF]">{t('common.loading')}</p> : (
        <div className="overflow-x-auto rounded-lg border border-[#2E2E2E]">
          <table className="w-full text-sm text-[#E2E2E2]">
            <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
              <tr>
                {[t('adminCatalog.titleAr'), t('adminCatalog.type'), t('adminCatalog.position'), t('adminCatalog.status'), t('adminCatalog.actions')].map(h => (
                  <th key={h} className="px-4 py-3 text-start">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map(s => (
                <tr key={s.id} className="border-t border-[#2E2E2E] hover:bg-[#1A1A1A]">
                  <td className="px-4 py-3">{s.title_ar}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{s.type}</td>
                  <td className="px-4 py-3">{s.position}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => void toggle(s.id, s.is_active)}
                      className={`rounded px-2 py-1 text-xs font-medium ${s.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {s.is_active ? t('adminCatalog.active') : t('adminCatalog.inactive')}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => void remove(s.id)} className="text-red-400 hover:text-red-300 text-xs">
                      {t('adminCatalog.delete')}
                    </button>
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

