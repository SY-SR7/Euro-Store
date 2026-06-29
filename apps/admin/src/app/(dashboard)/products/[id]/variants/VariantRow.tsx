'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';

interface Variant {
  id: string; sku: string; price_syp: number;
  compare_price_syp: number | null; stock_quantity: number; is_active: boolean;
}

export function VariantRow({ variant, productId: _productId }: { variant: Variant; productId: string }) {
  const t      = useTranslations('adminCatalog');
  const tC     = useTranslations('common');
  const router = useRouter();
  const [editing,  setEditing]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stock,    setStock]    = useState(variant.stock_quantity);
  const [price,    setPrice]    = useState(variant.price_syp);

  async function handleSave() {
    const res = await fetch(`/api/catalog/variants/${variant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_quantity: stock, price_syp: price }),
    });
    if (res.ok) { setEditing(false); router.refresh(); }
  }

  async function handleDelete() {
    if (!window.confirm(t('confirmDelete'))) return;
    setDeleting(true);
    const res = await fetch(`/api/catalog/variants/${variant.id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  if (editing) {
    return (
      <tr className="bg-[#F3EEE3]">
        <td className="px-4 py-3 font-mono text-xs text-[#D6D3C7]">{variant.sku}</td>
        <td className="px-4 py-3">
          <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0}
            className="w-28 rounded border border-[#C9A84C] bg-[#111] px-2 py-1 text-sm text-[#1F1B16] outline-none" />
        </td>
        <td className="px-4 py-3 text-[#8B8172]">
          {variant.compare_price_syp ? formatSYP(variant.compare_price_syp) : '—'}
        </td>
        <td className="px-4 py-3">
          <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} min={0}
            className="w-20 rounded border border-[#C9A84C] bg-[#111] px-2 py-1 text-sm text-[#1F1B16] outline-none" />
        </td>
        <td colSpan={2} className="px-4 py-3">
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="rounded-sm bg-[#C9A84C] px-3 py-1 text-xs font-semibold text-[#111] hover:bg-[#D8B95F]">
              {tC('save')}
            </button>
            <button onClick={() => setEditing(false)}
              className="rounded-sm border border-[#E8DCC3] px-3 py-1 text-xs text-[#6F6658] hover:text-[#1F1B16]">
              {tC('cancel')}
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-[#161616] transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-[#D6D3C7]">{variant.sku}</td>
      <td className="px-4 py-3 text-[#C9A84C]">{formatSYP(variant.price_syp)}</td>
      <td className="px-4 py-3 text-[#8B8172]">
        {variant.compare_price_syp ? <span className="line-through">{formatSYP(variant.compare_price_syp)}</span> : '—'}
      </td>
      <td className="px-4 py-3 text-[#D6D3C7]">{variant.stock_quantity}</td>
      <td className="px-4 py-3">
        <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${variant.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {variant.is_active ? tC('confirm') : tC('cancel')}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(true)} className="text-xs text-[#C9A84C] hover:underline">{tC('edit')}</button>
          <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-400 hover:underline disabled:opacity-50">{tC('delete')}</button>
        </div>
      </td>
    </tr>
  );
}