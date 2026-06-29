'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function AddVariantForm({ productId }: { productId: string }) {
  const t      = useTranslations('adminCatalog');
  const tC     = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const formEl = e.currentTarget as HTMLFormElement; const d = Object.fromEntries(new FormData(formEl));
    const res = await fetch('/api/catalog/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id:        productId,
        sku:               d.sku,
        price_syp:         Number(d.price_syp),
        compare_price_syp: d.compare_price_syp ? Number(d.compare_price_syp) : null,
        stock_quantity:    Number(d.stock_quantity) || 0,
        is_active:         d.is_active === 'on',
      }),
    });
    if (res.ok) {
      setMsg(t('saveSuccess'));
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      setMsg(t('saveFailed'));
    }
    setSaving(false);
  }

  const inputCls = "rounded border border-[#2E2E2E] bg-[#151515] px-3 py-2 text-[#E2E2E2] outline-none focus:border-[#C9A84C] w-full";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">{t('sku')} *</span>
        <input name="sku" required className={`${inputCls} font-mono`} placeholder="ES-RED-L" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">{t('priceSYP')} *</span>
        <input name="price_syp" required type="number" min={0} className={inputCls} placeholder="150000" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">{t('comparePriceSYP')}</span>
        <input name="compare_price_syp" type="number" min={0} className={inputCls} placeholder="200000" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#9CA3AF]">{t('stockQty')}</span>
        <input name="stock_quantity" type="number" min={0} defaultValue={0} className={inputCls} />
      </label>
      <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer">
        <input type="checkbox" name="is_active" defaultChecked className="accent-[#C9A84C]" />
        {t('active')}
      </label>
      {msg && <p className="text-sm text-[#C9A84C]">{msg}</p>}
      <button type="submit" disabled={saving}
        className="rounded-sm bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors disabled:opacity-50">
        {saving ? tC('loading') : t('saveVariant')}
      </button>
    </form>
  );
}