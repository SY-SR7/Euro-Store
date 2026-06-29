'use client';
/* eslint-disable */
// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return Number(n || 0).toLocaleString('ar-SY') + ' ل.س';
}

function getVariantLabel(v: any) {
  const attrs = (v.variant_attributes ?? [])
    .map((va: any) => va.attribute_values)
    .filter(Boolean)
    .sort((a: any, b: any) => {
      const order: Record<string, number> = { color: 0, size: 1 };
      return (order[a.attribute_types?.slug] ?? 9) - (order[b.attribute_types?.slug] ?? 9);
    });
  if (attrs.length === 0) return v.sku;
  return attrs.map((av: any) => av.value_ar).join(' / ');
}

function ColorDot({ hex, size = 14 }: { hex?: string | null; size?: number }) {
  if (!hex) return null;
  return (
    <span
      style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: hex, border: '1.5px solid rgba(0,0,0,0.15)', verticalAlign: 'middle', marginLeft: 4 }}
    />
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-3xl border border-[#E5E0D8] bg-white shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button onClick={onClose} className="text-[#A8A29E] hover:text-[#1C1917] text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const inp = 'w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B]';

// ─── Attribute checkboxes component ──────────────────────────────────────────
function AttributeSelector({
  attrTypes,
  selectedIds,
  onChange,
}: {
  attrTypes: any[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };

  if (attrTypes.length === 0) return <p className="text-xs text-[#A8A29E]">جاري تحميل الصفات...</p>;

  return (
    <div className="space-y-4">
      {attrTypes.map((at: any) => (
        <div key={at.id}>
          <p className="mb-2 text-xs font-black text-[#57534E] uppercase tracking-wide">{at.name_ar}</p>
          <div className="flex flex-wrap gap-2">
            {(at.attribute_values ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((av: any) => {
                const checked = selectedIds.includes(av.id);
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => toggle(av.id)}
                    className={[
                      'flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all',
                      checked
                        ? 'border-[#B8860B] bg-[#B8860B]/10 text-[#1C1917]'
                        : 'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B]/50',
                    ].join(' ')}
                  >
                    {av.hex_color && <ColorDot hex={av.hex_color} />}
                    {av.value_ar}
                    {av.value_en && av.value_en !== av.value_ar && (
                      <span className="text-[10px] text-[#A8A29E] font-normal">({av.value_en})</span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductHubPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct]     = useState<any>(null);
  const [variants, setVariants]   = useState<any[]>([]);
  const [images, setImages]       = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands]       = useState<any[]>([]);
  const [attrTypes, setAttrTypes] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState('');

  // Modals state
  const [editProduct, setEditProduct]   = useState(false);
  const [editDraft, setEditDraft]       = useState<any>({});
  const [editVariant, setEditVariant]   = useState<any>(null);
  const [variantDraft, setVariantDraft] = useState<any>({});
  const [variantAttrIds, setVariantAttrIds] = useState<string[]>([]);
  const [addVariant, setAddVariant]     = useState(false);
  const [newVariant, setNewVariant]     = useState({
    sku: '', price_syp: '', compare_price_syp: '', stock_quantity: '0', is_active: true, weight_grams: '',
  });
  const [newAttrIds, setNewAttrIds]     = useState<string[]>([]);
  const [addImage, setAddImage]         = useState(false);
  const [newImageUrl, setNewImageUrl]   = useState('');
  const [saving, setSaving]             = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setMsg('');
    const [prodRes, varRes, imgRes, catRes, brRes, attrRes] = await Promise.all([
      fetch(`/api/catalog/products/${id}`).then(r => r.json()).catch(() => null),
      fetch(`/api/catalog/variants?product_id=${id}`).then(r => r.json()).catch(() => []),
      fetch(`/api/catalog/images?product_id=${id}`).then(r => r.json()).catch(() => []),
      fetch('/api/catalog/categories').then(r => r.json()).catch(() => []),
      fetch('/api/catalog/brands').then(r => r.json()).catch(() => []),
      fetch('/api/catalog/attribute-types').then(r => r.json()).catch(() => []),
    ]);
    setProduct(prodRes);
    setVariants(Array.isArray(varRes) ? varRes : varRes?.data ?? []);
    setImages(Array.isArray(imgRes) ? imgRes : imgRes?.data ?? []);
    setCategories(Array.isArray(catRes) ? catRes : []);
    setBrands(Array.isArray(brRes) ? brRes : []);
    setAttrTypes(Array.isArray(attrRes) ? attrRes : []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* ── Save product ── */
  const saveProduct = async () => {
    setSaving(true); setMsg('');
    const res = await fetch(`/api/catalog/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDraft),
    });
    if (res.ok) { setMsg('✓ تم حفظ المنتج'); setEditProduct(false); await load(); }
    else { const d = await res.json().catch(() => null); setMsg('✗ ' + (d?.error ?? 'فشل')); }
    setSaving(false);
  };

  /* ── Save variant ── */
  const saveVariant = async () => {
    if (!editVariant) return;
    setSaving(true); setMsg('');
    const body: any = { attribute_value_ids: variantAttrIds };
    if (variantDraft.sku !== undefined)              body.sku = variantDraft.sku;
    if (variantDraft.price_syp !== undefined)        body.price_syp = Number(variantDraft.price_syp);
    if (variantDraft.compare_price_syp !== undefined) body.compare_price_syp = variantDraft.compare_price_syp ? Number(variantDraft.compare_price_syp) : null;
    if (variantDraft.stock_quantity !== undefined)   body.stock_quantity = Number(variantDraft.stock_quantity);
    if (variantDraft.is_active !== undefined)        body.is_active = variantDraft.is_active;
    if (variantDraft.weight_grams)                   body.weight_grams = Number(variantDraft.weight_grams);
    const res = await fetch(`/api/catalog/variants/${editVariant.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) { setMsg('✓ تم حفظ الخيار'); setEditVariant(null); await load(); }
    else { const d = await res.json().catch(() => null); setMsg('✗ ' + (d?.error ?? 'فشل')); }
    setSaving(false);
  };

  /* ── Create variant ── */
  const createVariant = async () => {
    setSaving(true); setMsg('');
    const body: any = {
      product_id: id,
      sku: newVariant.sku,
      price_syp: Number(newVariant.price_syp),
      stock_quantity: Number(newVariant.stock_quantity),
      is_active: newVariant.is_active,
      attribute_value_ids: newAttrIds,
    };
    if (newVariant.compare_price_syp) body.compare_price_syp = Number(newVariant.compare_price_syp);
    if (newVariant.weight_grams) body.weight_grams = Number(newVariant.weight_grams);
    const res = await fetch('/api/catalog/variants', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      setMsg('✓ تم إضافة الخيار');
      setAddVariant(false);
      setNewVariant({ sku: '', price_syp: '', compare_price_syp: '', stock_quantity: '0', is_active: true, weight_grams: '' });
      setNewAttrIds([]);
      await load();
    } else { const d = await res.json().catch(() => null); setMsg('✗ ' + (d?.error ?? 'فشل')); }
    setSaving(false);
  };

  /* ── Delete variant ── */
  const deleteVariant = async (v: any) => {
    if (!confirm(`حذف الخيار "${v.sku}"؟`)) return;
    await fetch(`/api/catalog/variants/${v.id}`, { method: 'DELETE' });
    await load(); setMsg('✓ تم الحذف');
  };

  /* ── Image helpers ── */
  const addImageUrl = async () => {
    if (!newImageUrl.trim()) return;
    setSaving(true); setMsg('');
    const res = await fetch('/api/catalog/images', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: id, url: newImageUrl.trim(), is_primary: images.length === 0 }),
    });
    if (res.ok) { setMsg('✓ تم إضافة الصورة'); setAddImage(false); setNewImageUrl(''); await load(); }
    else { const d = await res.json().catch(() => null); setMsg('✗ ' + (d?.error ?? 'فشل')); }
    setSaving(false);
  };

  const setPrimaryImage = async (imgId: string) => {
    await fetch(`/api/catalog/images/${imgId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_primary: true, product_id: id }),
    });
    await load();
  };

  const deleteImage = async (imgId: string) => {
    if (!confirm('حذف هذه الصورة؟')) return;
    await fetch(`/api/catalog/images/${imgId}`, { method: 'DELETE' });
    await load();
  };

  const catName = (cid: string) => categories.find((c: any) => c.id === cid)?.name_ar ?? '—';
  const brName  = (bid: string) => brands.find((b: any) => b.id === bid)?.name ?? '—';

  if (loading) return <div className="p-10 text-center text-sm text-[#A8A29E]">جاري التحميل...</div>;
  if (!product) return <div className="p-10 text-center text-sm text-red-600">المنتج غير موجود</div>;

  const totalStock = variants.reduce((s: number, v: any) => s + (v.stock_quantity ?? 0), 0);
  const minPrice   = variants.length > 0 ? Math.min(...variants.map((v: any) => v.price_syp)) : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/products" className="text-xs text-[#A8A29E] hover:text-[#B8860B]">← المنتجات</Link>
          <h1 className="mt-1 text-xl font-black text-[#1C1917]">{product.name_ar}</h1>
          <p className="text-xs text-[#A8A29E]">{product.name_en}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setEditDraft({ ...product }); setEditProduct(true); setMsg(''); }}
            className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white hover:bg-[#9A7209]">
            تعديل المنتج
          </button>
          <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer"
            className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-[#57534E] hover:border-[#B8860B]">
            عرض في المتجر ↗
          </a>
        </div>
      </div>

      {msg && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'عدد الخيارات', value: variants.length },
          { label: 'إجمالي المخزون', value: totalStock },
          { label: 'أدنى سعر (ل.س)', value: minPrice > 0 ? minPrice.toLocaleString('ar-SY') : '—' },
          { label: 'الحالة', value: product.is_active ? '✓ نشط' : '✗ معطّل', cls: product.is_active ? 'text-green-600' : 'text-red-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm text-center">
            <p className={`text-2xl font-black text-[#B8860B] ${cls ?? ''}`}>{value}</p>
            <p className="mt-1 text-xs text-[#A8A29E]">{label}</p>
          </div>
        ))}
      </div>

      {/* Product Details */}
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm space-y-2 text-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-[#1C1917]">تفاصيل المنتج</h2>
          <button onClick={() => { setEditDraft({ ...product }); setEditProduct(true); setMsg(''); }}
            className="text-xs text-[#B8860B] hover:underline">تعديل</button>
        </div>
        {[
          ['الاسم بالعربية', product.name_ar],
          ['الاسم بالإنجليزية', product.name_en ?? '—'],
          ['Slug', product.slug],
          ['التصنيف', catName(product.category_id)],
          ['الماركة', brName(product.brand_id)],
          ['الوصف', product.description_ar ?? '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-[#F0ECE6] pb-2 gap-2">
            <span className="text-[#A8A29E] shrink-0">{k}</span>
            <span className="font-semibold text-[#1C1917] text-right">{v}</span>
          </div>
        ))}
        <div className="flex justify-between pt-1 gap-4">
          <span className="text-[#A8A29E]">حالة النشر</span>
          <div className="flex gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
              {product.is_active ? '✓ نشط' : '✗ معطّل'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.is_featured ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
              {product.is_featured ? '⭐ مميز' : '☆ عادي'}
            </span>
          </div>
        </div>
      </div>

      {/* Variants Table */}
      <div className="rounded-2xl border border-[#E5E0D8] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#F0ECE6]">
          <h2 className="font-black text-[#1C1917]">الخيارات والمخزون ({variants.length})</h2>
          <button onClick={() => { setAddVariant(true); setNewAttrIds([]); setMsg(''); }}
            className="rounded-xl bg-[#B8860B] px-4 py-2 text-xs font-bold text-white hover:bg-[#9A7209]">
            + خيار جديد
          </button>
        </div>
        {variants.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#A8A29E]">لا توجد خيارات — أضف خياراً لتحديد السعر والمخزون والصفات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['SKU', 'الصفات (لون / مقاس)', 'السعر (ل.س)', 'سعر المقارنة', 'المخزون', 'الحالة', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-right text-xs font-black text-[#A8A29E]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {variants.map((v: any) => {
                  const attrs = (v.variant_attributes ?? [])
                    .map((va: any) => va.attribute_values)
                    .filter(Boolean)
                    .sort((a: any, b: any) => {
                      const order: Record<string, number> = { color: 0, size: 1 };
                      return (order[a.attribute_types?.slug] ?? 9) - (order[b.attribute_types?.slug] ?? 9);
                    });
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-[#FAFAF8] cursor-pointer"
                      onClick={() => {
                        setEditVariant(v);
                        setVariantDraft({ ...v });
                        setVariantAttrIds(
                          (v.variant_attributes ?? []).map((va: any) => va.attribute_value_id).filter(Boolean)
                        );
                        setMsg('');
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#57534E]">{v.sku}</td>
                      <td className="px-4 py-3">
                        {attrs.length === 0 ? (
                          <span className="text-xs text-[#A8A29E]">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {attrs.map((av: any) => (
                              <span key={av.id} className="inline-flex items-center gap-1 rounded-full border border-[#E5E0D8] bg-[#FAFAF8] px-2 py-0.5 text-xs text-[#57534E]">
                                {av.hex_color && <ColorDot hex={av.hex_color} size={10} />}
                                <span className="font-semibold">{av.attribute_types?.name_ar}:</span>
                                {av.value_ar}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#B8860B]">{Number(v.price_syp).toLocaleString('ar-SY')}</td>
                      <td className="px-4 py-3 text-xs text-[#A8A29E] line-through">{v.compare_price_syp ? Number(v.compare_price_syp).toLocaleString('ar-SY') : '—'}</td>
                      <td className="px-4 py-3 font-semibold">{v.stock_quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${v.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {v.is_active ? 'نشط' : 'معطّل'}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteVariant(v)} className="text-xs text-red-500 hover:underline">حذف</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Images */}
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-[#1C1917]">صور المنتج ({images.length})</h2>
          <button onClick={() => { setAddImage(true); setNewImageUrl(''); setMsg(''); }}
            className="rounded-xl bg-[#B8860B] px-4 py-2 text-xs font-bold text-white hover:bg-[#9A7209]">
            + إضافة صورة
          </button>
        </div>
        {images.length === 0 ? (
          <p className="text-sm text-[#A8A29E] text-center py-4">لا توجد صور</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {images.map((img: any) => (
              <div key={img.id} className="relative group">
                <img src={img.url} alt="" className={['h-24 w-24 rounded-xl object-cover border-2 transition-all', img.is_primary ? 'border-[#B8860B]' : 'border-[#E5E0D8] hover:border-[#B8860B]/50'].join(' ')} />
                {img.is_primary && <span className="absolute -top-1 -right-1 rounded-full bg-[#B8860B] px-1.5 py-0.5 text-[9px] font-black text-white">رئيسية</span>}
                <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  {!img.is_primary && (
                    <button onClick={() => setPrimaryImage(img.id)} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-[#1C1917]">رئيسية</button>
                  )}
                  <button onClick={() => deleteImage(img.id)} className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white">حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: Edit Product ── */}
      {editProduct && (
        <Modal title="تعديل المنتج" onClose={() => setEditProduct(false)}>
          <div className="space-y-3">
            {[['name_ar', 'الاسم بالعربية'], ['name_en', 'الاسم بالإنجليزية'], ['slug', 'Slug']].map(([k, lbl]) => (
              <div key={k}>
                <label className="mb-1 block text-xs font-bold text-[#A8A29E]">{lbl}</label>
                <input value={editDraft[k] ?? ''} onChange={e => setEditDraft((d: any) => ({ ...d, [k]: e.target.value }))} className={inp} />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-bold text-[#A8A29E]">الوصف</label>
              <textarea rows={3} value={editDraft.description_ar ?? ''} onChange={e => setEditDraft((d: any) => ({ ...d, description_ar: e.target.value }))} className={inp + ' resize-none'} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#A8A29E]">التصنيف</label>
              <select value={editDraft.category_id ?? ''} onChange={e => setEditDraft((d: any) => ({ ...d, category_id: e.target.value || null }))} className={inp}>
                <option value="">— بدون تصنيف —</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#A8A29E]">الماركة</label>
              <select value={editDraft.brand_id ?? ''} onChange={e => setEditDraft((d: any) => ({ ...d, brand_id: e.target.value || null }))} className={inp}>
                <option value="">— بدون ماركة —</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editDraft.is_active ?? false} onChange={e => setEditDraft((d: any) => ({ ...d, is_active: e.target.checked }))} className="h-4 w-4 accent-[#B8860B]" />
                <span className="font-semibold">نشط</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editDraft.is_featured ?? false} onChange={e => setEditDraft((d: any) => ({ ...d, is_featured: e.target.checked }))} className="h-4 w-4 accent-[#B8860B]" />
                <span className="font-semibold">مميّز ⭐</span>
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveProduct} disabled={saving} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
              <button onClick={() => setEditProduct(false)} className="rounded-xl border border-[#E5E0D8] px-5 py-2 text-sm font-bold text-[#57534E]">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: Edit Variant ── */}
      {editVariant && (
        <Modal title={`تعديل الخيار: ${editVariant.sku}`} onClose={() => setEditVariant(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['sku', 'SKU'],
                ['price_syp', 'السعر (ل.س)'],
                ['compare_price_syp', 'سعر المقارنة (ل.س)'],
                ['stock_quantity', 'المخزون'],
                ['weight_grams', 'الوزن (غرام)'],
              ].map(([k, lbl]) => (
                <div key={k} className={k === 'sku' ? 'col-span-2' : ''}>
                  <label className="mb-1 block text-xs font-bold text-[#A8A29E]">{lbl}</label>
                  <input
                    type={k === 'sku' ? 'text' : 'number'}
                    value={variantDraft[k] ?? ''}
                    onChange={e => setVariantDraft((d: any) => ({ ...d, [k]: e.target.value }))}
                    className={inp}
                  />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={variantDraft.is_active ?? false} onChange={e => setVariantDraft((d: any) => ({ ...d, is_active: e.target.checked }))} className="h-4 w-4 accent-[#B8860B]" />
              <span className="font-semibold">نشط</span>
            </label>
            <div>
              <p className="mb-2 text-xs font-black text-[#57534E]">الصفات (اختر ما ينطبق على هذا الخيار)</p>
              <AttributeSelector attrTypes={attrTypes} selectedIds={variantAttrIds} onChange={setVariantAttrIds} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveVariant} disabled={saving} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
              <button onClick={() => setEditVariant(null)} className="rounded-xl border border-[#E5E0D8] px-5 py-2 text-sm font-bold text-[#57534E]">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: Add Variant ── */}
      {addVariant && (
        <Modal title="إضافة خيار جديد" onClose={() => setAddVariant(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['sku', 'SKU *'],
                ['price_syp', 'السعر (ل.س) *'],
                ['compare_price_syp', 'سعر المقارنة (ل.س)'],
                ['stock_quantity', 'المخزون'],
                ['weight_grams', 'الوزن (غرام)'],
              ].map(([k, lbl]) => (
                <div key={k} className={k === 'sku' ? 'col-span-2' : ''}>
                  <label className="mb-1 block text-xs font-bold text-[#A8A29E]">{lbl}</label>
                  <input
                    type={k === 'sku' ? 'text' : 'number'}
                    value={(newVariant as any)[k] ?? ''}
                    onChange={e => setNewVariant((d: any) => ({ ...d, [k]: e.target.value }))}
                    className={inp}
                  />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newVariant.is_active} onChange={e => setNewVariant(d => ({ ...d, is_active: e.target.checked }))} className="h-4 w-4 accent-[#B8860B]" />
              <span className="font-semibold">نشط فوراً</span>
            </label>
            <div>
              <p className="mb-2 text-xs font-black text-[#57534E]">الصفات (اختر ما ينطبق على هذا الخيار)</p>
              <AttributeSelector attrTypes={attrTypes} selectedIds={newAttrIds} onChange={setNewAttrIds} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={createVariant} disabled={saving || !newVariant.sku || !newVariant.price_syp}
                className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">
                {saving ? '...' : 'إضافة'}
              </button>
              <button onClick={() => setAddVariant(false)} className="rounded-xl border border-[#E5E0D8] px-5 py-2 text-sm font-bold text-[#57534E]">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: Add Image ── */}
      {addImage && (
        <Modal title="إضافة صورة" onClose={() => setAddImage(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#A8A29E]">رابط الصورة (URL)</label>
              <input type="url" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="https://..." className={inp} />
            </div>
            {newImageUrl && (
              <img src={newImageUrl} alt="" className="h-32 w-32 rounded-xl object-cover border border-[#E5E0D8]" onError={e => { (e.target as any).style.display = 'none'; }} />
            )}
            <div className="flex gap-2">
              <button onClick={addImageUrl} disabled={saving || !newImageUrl.trim()}
                className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50">
                {saving ? '...' : 'إضافة'}
              </button>
              <button onClick={() => setAddImage(false)} className="rounded-xl border border-[#E5E0D8] px-5 py-2 text-sm font-bold text-[#57534E]">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}