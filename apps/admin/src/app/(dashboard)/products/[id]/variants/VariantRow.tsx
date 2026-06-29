'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Variant {
  id: string; sku: string; price_syp: number;
  compare_price_syp: number | null; stock_quantity: number; is_active: boolean;
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString('ar-SY') + ' ل.س';
}

export function VariantRow({ variant, productId: _productId }: { variant: Variant; productId: string }) {
  const router = useRouter();
  const [editing,  setEditing]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [stock,    setStock]    = useState(variant.stock_quantity);
  const [price,    setPrice]    = useState(variant.price_syp);
  const [isActive, setIsActive] = useState(variant.is_active);

  async function handleSave() {
    const res = await fetch(`/api/catalog/variants/${variant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_quantity: stock, price_syp: price }),
    });
    if (res.ok) { setEditing(false); router.refresh(); }
  }

  async function handleToggleActive() {
    setToggling(true);
    const res = await fetch(`/api/catalog/variants/${variant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    if (res.ok) {
      setIsActive(prev => !prev);
      router.refresh();
    }
    setToggling(false);
  }

  async function handleDelete() {
    if (!window.confirm(`حذف الخيار "${variant.sku}"؟`)) return;
    setDeleting(true);
    const res = await fetch(`/api/catalog/variants/${variant.id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  const inp = "w-24 rounded-lg border border-[#B8860B] bg-[#FAFAF8] px-2 py-1 text-sm text-[#1C1917] outline-none";

  if (editing) {
    return (
      <tr className="bg-[#FFF8ED]">
        <td className="px-4 py-3 font-mono text-xs text-[#57534E]">{variant.sku}</td>
        <td className="px-4 py-3">
          <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0} className={inp} />
        </td>
        <td className="px-4 py-3 text-xs text-[#A8A29E]">
          {variant.compare_price_syp ? <span className="line-through">{fmt(variant.compare_price_syp)}</span> : '—'}
        </td>
        <td className="px-4 py-3">
          <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} min={0} className={inp} />
        </td>
        <td colSpan={2} className="px-4 py-3">
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="rounded-lg bg-[#B8860B] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#9A7209]">
              حفظ
            </button>
            <button onClick={() => setEditing(false)}
              className="rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-xs font-semibold text-[#57534E] hover:bg-[#F5F0E8]">
              إلغاء
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-[#FAFAF8] transition-colors border-b border-[#F0ECE6]">
      <td className="px-4 py-3 font-mono text-xs text-[#57534E]">{variant.sku}</td>
      <td className="px-4 py-3 font-bold text-[#B8860B]">{fmt(variant.price_syp)}</td>
      <td className="px-4 py-3 text-xs text-[#A8A29E]">
        {variant.compare_price_syp
          ? <span className="line-through">{fmt(variant.compare_price_syp)}</span>
          : <span className="text-[#D1CBC1]">—</span>}
      </td>
      <td className="px-4 py-3 font-semibold text-[#1C1917]">{variant.stock_quantity}</td>
      <td className="px-4 py-3">
        {/* CLICKABLE toggle button */}
        <button
          onClick={handleToggleActive}
          disabled={toggling}
          title={isActive ? 'اضغط لتعطيل الخيار' : 'اضغط لتفعيل الخيار'}
          className={[
            'rounded-full px-3 py-1 text-xs font-bold border transition-all cursor-pointer select-none',
            'hover:opacity-80 active:scale-95 disabled:opacity-40',
            isActive
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
          ].join(' ')}
        >
          {toggling ? '...' : isActive ? '✓ مفعّل' : '✗ معطّل'}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(true)}
            className="text-xs font-semibold text-[#B8860B] hover:underline">
            تعديل
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-40">
            {deleting ? '...' : 'حذف'}
          </button>
        </div>
      </td>
    </tr>
  );
}