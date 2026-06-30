'use client';
// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProductQuickAdmin from './ProductQuickAdmin';

export default ProductQuickAdmin;

function formatSYP(n: number) {
  return Number(n || 0).toLocaleString('ar-SY') + ' ل.س';
}

type Product = {
  id: string; name_ar: string; name_en: string;
  slug: string; is_featured: boolean; is_active: boolean;
  category_id?: string | null; brand_id?: string | null; created_at: string;
  minPrice?: number;
};
type Category = { id: string; name_ar: string; slug: string; count?: number; selected?: boolean };
type Brand    = { id: string; name: string; slug: string; count?: number; selected?: boolean };
type AttrValue = { id: string; slug: string; value_ar: string; value_en: string; hex_color?: string | null; count: number; selected: boolean };
type AttrType  = { id: string; slug: string; name_ar: string; name_en: string; values: AttrValue[] };
type FilterData = {
  products: Product[];
  total: number;
  facets: { categories: Category[]; brands: Brand[]; attributes: AttrType[]; priceRange: { min: number; max: number } };
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="text-[#A8A29E] hover:text-[#1C1917] text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[#F0ECE6] pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="mb-2 flex w-full items-center justify-between text-xs font-black uppercase tracking-wider text-[#A8A29E] hover:text-[#1C1917]"
      >
        {title}
        <span className="text-sm leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

function CheckItem({ label, count, checked, onChange }: { label: string; count: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-[#F8F5F0] transition-colors">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-3.5 w-3.5 accent-[#C9A84C]" />
      <span className="flex-1 text-xs text-[#1C1917]">{label}</span>
      <span className="text-[10px] text-[#A8A29E] tabular-nums">{count}</span>
    </label>
  );
}

function LegacyAdminProductsPage() {
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Product | null>(null);
  const [editing, setEditing]       = useState(false);
  const [editDraft, setEditDraft]   = useState<Partial<Product>>({});
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allBrands, setAllBrands]         = useState<Brand[]>([]);

  // Filter state
  const [selCats,   setSelCats]   = useState<string[]>([]);
  const [selBrands, setSelBrands] = useState<string[]>([]);
  const [selAttrs,  setSelAttrs]  = useState<string[]>([]);
  const [priceMin,  setPriceMin]  = useState<number | null>(null);
  const [priceMax,  setPriceMax]  = useState<number | null>(null);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (selCats.length)   p.set('categories', selCats.join(','));
    if (selBrands.length) p.set('brands', selBrands.join(','));
    if (selAttrs.length)  p.set('attrs', selAttrs.join(','));
    if (priceMin !== null) p.set('minPrice', String(priceMin));
    if (priceMax !== null) p.set('maxPrice', String(priceMax));
    if (search)   p.set('q', search);
    if (status !== 'all') p.set('status', status);
    return p.toString();
  }, [selCats, selBrands, selAttrs, priceMin, priceMax, search, status]);

  const load = useCallback(() => {
    setLoading(true);
    const q = buildQuery();
    Promise.all([
      fetch(`/api/catalog/products/filters?${q}`).then(r => r.json()).catch(() => null),
      fetch('/api/catalog/categories').then(r => r.json()).catch(() => []),
      fetch('/api/catalog/brands').then(r => r.json()).catch(() => []),
    ]).then(([fd, cats, brs]) => {
      if (fd) setFilterData(fd);
      if (Array.isArray(cats)) setAllCategories(cats);
      if (Array.isArray(brs))  setAllBrands(brs);
    }).finally(() => setLoading(false));
  }, [buildQuery]);

  useEffect(() => { load(); }, [selCats, selBrands, selAttrs, priceMin, priceMax, status]);

  const toggle = (list: string[], item: string, setter: (v: string[]) => void) =>
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);

  const clearAll = () => {
    setSelCats([]); setSelBrands([]); setSelAttrs([]);
    setPriceMin(null); setPriceMax(null); setSearch(''); setStatus('all');
  };

  // Product modal
  const openProduct = (p: Product) => { setSelected(p); setEditing(false); setEditDraft({}); setMsg(''); };
  const startEdit   = () => { if (!selected) return; setEditDraft({ ...selected }); setEditing(true); };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/products/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft),
    });
    if (res.ok) {
      setMsg('✓ تم الحفظ');
      const updated = { ...selected, ...editDraft } as Product;
      setSelected(updated);
      load();
      setEditing(false);
    } else {
      const d = await res.json().catch(() => null);
      setMsg('✗ ' + ((d as any)?.error ?? 'فشل'));
    }
    setSaving(false);
  };

  const toggleActive = async (p: Product) => {
    await fetch(`/api/catalog/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !p.is_active }) });
    if (selected?.id === p.id) setSelected({ ...selected, is_active: !p.is_active });
    load();
  };

  const toggleFeatured = async (p: Product) => {
    await fetch(`/api/catalog/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: !p.is_featured }) });
    if (selected?.id === p.id) setSelected({ ...selected, is_featured: !p.is_featured });
    load();
  };

  const products = filterData?.products ?? [];
  const facets   = filterData?.facets;

  return (
    <div className="flex h-full gap-0" dir="rtl">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <aside className="flex-none w-56 border-l border-[#F0ECE6] bg-[#FAFAF9] overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#A8A29E]">الفلاتر</span>
            <button onClick={clearAll} className="text-[10px] text-[#C9A84C] font-bold hover:underline">مسح</button>
          </div>

          {/* status */}
          <div className="space-y-1">
            {(['all', 'active', 'inactive', 'featured'] as const).map(s => (
              <label key={s} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-[#F0ECE6]">
                <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="accent-[#C9A84C]" />
                <span className="text-xs text-[#1C1917]">
                  {s === 'all' ? 'الكل' : s === 'active' ? 'نشط' : s === 'inactive' ? 'معطّل' : '⭐ مميز'}
                </span>
              </label>
            ))}
          </div>

          {/* categories */}
          {facets && facets.categories.length > 0 && (
            <FilterSection title="التصنيفات">
              {facets.categories.map((c: Category) => (
                <CheckItem key={c.id} label={c.name_ar} count={c.count ?? 0} checked={selCats.includes(c.slug)} onChange={() => toggle(selCats, c.slug, setSelCats)} />
              ))}
            </FilterSection>
          )}

          {/* brands */}
          {facets && facets.brands.length > 0 && (
            <FilterSection title="الماركات">
              {facets.brands.map((b: Brand) => (
                <CheckItem key={b.id} label={b.name} count={b.count ?? 0} checked={selBrands.includes(b.slug)} onChange={() => toggle(selBrands, b.slug, setSelBrands)} />
              ))}
            </FilterSection>
          )}

          {/* dynamic attributes */}
          {facets && facets.attributes.map((attrType: AttrType) => (
            <FilterSection key={attrType.id} title={attrType.name_ar} defaultOpen={false}>
              <div className={attrType.slug === 'color' ? 'flex flex-wrap gap-1.5 p-1' : 'space-y-0.5'}>
                {attrType.values.map((val: AttrValue) => {
                  const attrKey = `${attrType.slug}:${val.slug}`;
                  const checked = selAttrs.includes(attrKey) || selAttrs.includes(`${attrType.slug}:${val.id}`);
                  if (attrType.slug === 'color' && val.hex_color) {
                    return (
                      <button key={val.id} title={`${val.value_ar} (${val.count})`}
                        onClick={() => toggle(selAttrs, attrKey, setSelAttrs)}
                        className={`h-5 w-5 rounded-full border-2 transition-all ${checked ? 'border-[#1C1917] scale-110' : 'border-[#E5E0D8]'}`}
                        style={{ backgroundColor: val.hex_color }}
                      />
                    );
                  }
                  return <CheckItem key={val.id} label={val.value_ar} count={val.count} checked={checked} onChange={() => toggle(selAttrs, attrKey, setSelAttrs)} />;
                })}
              </div>
            </FilterSection>
          ))}

          {/* price */}
          {facets && facets.priceRange.max > 0 && (
            <FilterSection title="السعر" defaultOpen={false}>
              <div className="space-y-2">
                <div className="flex gap-1">
                  <input type="number" value={priceMin ?? ''} onChange={e => setPriceMin(e.target.value ? Number(e.target.value) : null)}
                    placeholder="من" className="w-full rounded border border-[#E5E0D8] px-2 py-1 text-[11px] outline-none focus:border-[#C9A84C]" />
                  <input type="number" value={priceMax ?? ''} onChange={e => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                    placeholder="إلى" className="w-full rounded border border-[#E5E0D8] px-2 py-1 text-[11px] outline-none focus:border-[#C9A84C]" />
                </div>
                <div className="flex justify-between text-[9px] text-[#A8A29E]">
                  <span>{formatSYP(facets.priceRange.min)}</span>
                  <span>{formatSYP(facets.priceRange.max)}</span>
                </div>
              </div>
            </FilterSection>
          )}
        </aside>
      )}

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(v => !v)}
              className="rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-xs font-bold text-[#57534E] hover:border-[#C9A84C] transition-colors">
              {sidebarOpen ? '← إخفاء' : '☰ الفلاتر'}
            </button>
            <h1 className="text-xl font-black text-[#1C1917]">
              المنتجات
              {filterData && <span className="mr-2 text-sm font-normal text-[#A8A29E]">({filterData.total})</span>}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <form onSubmit={e => { e.preventDefault(); load(); }} className="flex gap-2">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="بحث..."
                className="rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-sm outline-none focus:border-[#C9A84C]" />
              <button type="submit" className="rounded-lg bg-[#C9A84C] px-3 py-1.5 text-white text-sm font-bold hover:bg-[#B8860B]">بحث</button>
            </form>
            <Link href="/products/new" className="rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#2D2926] transition-colors">
              + منتج جديد
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-[#F5F0EA] animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E0D8] p-16 text-center text-[#A8A29E]">
            <p className="text-lg font-bold">لا توجد منتجات</p>
            <button onClick={clearAll} className="mt-3 text-sm text-[#C9A84C] hover:underline">مسح الفلاتر</button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(p => (
              <button key={p.id} onClick={() => openProduct(p)}
                className="flex flex-col gap-1 rounded-xl border border-[#E5E0D8] bg-white p-4 text-right hover:border-[#C9A84C] hover:shadow-sm transition-all">
                {p.image_url && (
                  <div className="mb-2 aspect-video w-full overflow-hidden rounded-lg bg-[#F5F0EA]">
                    <img src={p.image_url} alt={p.name_ar} className="h-full w-full object-cover" />
                  </div>
                )}
                <p className="font-bold text-[#1C1917] text-sm line-clamp-1">{p.name_ar}</p>
                <p className="text-xs text-[#A8A29E] line-clamp-1">{p.name_en}</p>
                {p.minPrice ? <p className="text-xs font-bold text-[#C9A84C]">{formatSYP(p.minPrice)}</p> : null}
                <div className="mt-1 flex gap-1.5 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {p.is_active ? 'نشط' : 'معطّل'}
                  </span>
                  {p.is_featured && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">⭐ مميز</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Product Modal ─────────────────────────────────────────── */}
      {selected && (
        <Modal title={selected.name_ar} onClose={() => { setSelected(null); setEditing(false); }}>
          {!editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-[#A8A29E]">الاسم EN</span><p className="font-bold mt-0.5">{selected.name_en}</p></div>
                <div><span className="text-[#A8A29E]">Slug</span><p className="font-mono text-xs mt-0.5">{selected.slug}</p></div>
                <div><span className="text-[#A8A29E]">التصنيف</span><p className="font-bold mt-0.5">{allCategories.find(c => c.id === selected.category_id)?.name_ar ?? '—'}</p></div>
                <div><span className="text-[#A8A29E]">الماركة</span><p className="font-bold mt-0.5">{allBrands.find(b => b.id === selected.brand_id)?.name ?? '—'}</p></div>
              </div>
              {msg && <p className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
              <div className="flex gap-2 flex-wrap">
                <button onClick={startEdit} className="rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#2D2926]">تعديل</button>
                <button onClick={() => toggleActive(selected)} className={`rounded-xl px-4 py-2 text-sm font-black ${selected.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                  {selected.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
                <button onClick={() => toggleFeatured(selected)} className={`rounded-xl px-4 py-2 text-sm font-black ${selected.is_featured ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-[#F5F0EA] text-[#57534E] hover:bg-[#EDE7D9]'}`}>
                  {selected.is_featured ? '★ إلغاء التمييز' : '☆ تمييز'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { key: 'name_ar', label: 'الاسم AR' },
                { key: 'name_en', label: 'الاسم EN' },
                { key: 'slug',    label: 'Slug' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-[#A8A29E] mb-1 block">{label}</label>
                  <input
                    value={(editDraft as any)[key] ?? ''}
                    onChange={e => setEditDraft(d => ({ ...d, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-[#E5E0D8] px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-[#A8A29E] mb-1 block">التصنيف</label>
                <select value={(editDraft as any).category_id ?? ''} onChange={e => setEditDraft(d => ({ ...d, category_id: e.target.value || null }))}
                  className="w-full rounded-xl border border-[#E5E0D8] px-3 py-2 text-sm outline-none focus:border-[#C9A84C]">
                  <option value="">بدون تصنيف</option>
                  {allCategories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#A8A29E] mb-1 block">الماركة</label>
                <select value={(editDraft as any).brand_id ?? ''} onChange={e => setEditDraft(d => ({ ...d, brand_id: e.target.value || null }))}
                  className="w-full rounded-xl border border-[#E5E0D8] px-3 py-2 text-sm outline-none focus:border-[#C9A84C]">
                  <option value="">بدون ماركة</option>
                  {allBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {msg && <p className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="rounded-xl bg-[#C9A84C] px-5 py-2 text-sm font-black text-white hover:bg-[#B8860B] disabled:opacity-50">
                  {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
                <button onClick={() => setEditing(false)} className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#57534E] hover:border-[#C9A84C]">
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
