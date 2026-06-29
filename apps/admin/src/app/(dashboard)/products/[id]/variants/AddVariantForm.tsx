'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddVariantForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const d = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
    const res = await fetch('/api/catalog/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id:        productId,
        sku:               d.sku,
        price_syp:         Number(d.price_syp),
        compare_price_syp: d.compare_price_syp ? Number(d.compare_price_syp) : null,
        stock_quantity:    Number(d.stock_quantity) || 0,
        is_active:         (d.is_active as string) === 'on',
      }),
    });
    if (res.ok) {
      setMsg('✓ تم إضافة الخيار بنجاح');
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      const err = await res.json().catch(() => null);
      setMsg('✗ فشل الحفظ: ' + (err?.error ?? 'خطأ غير معروف'));
    }
    setSaving(false);
  }

  const inp = "rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-[#1C1917] outline-none focus:border-[#B8860B] w-full text-sm";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[#57534E]">رمز المنتج (SKU) *</label>
        <input name="sku" required className={`${inp} font-mono`} placeholder="ES-RED-L" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[#57534E]">السعر (ل.س) *</label>
        <input name="price_syp" required type="number" min={0} className={inp} placeholder="150000" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[#57534E]">سعر المقارنة (ل.س)</label>
        <input name="compare_price_syp" type="number" min={0} className={inp} placeholder="200000" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[#57534E]">المخزون</label>
        <input name="stock_quantity" type="number" min={0} defaultValue={0} className={inp} />
      </div>
      <label className="flex items-center gap-2 text-sm text-[#57534E] cursor-pointer select-none">
        <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 accent-[#B8860B]" />
        <span className="font-semibold">مفعّل فوراً</span>
      </label>
      {msg && (
        <p className={`text-sm rounded-xl px-3 py-2 ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </p>
      )}
      <button type="submit" disabled={saving}
        className="rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#9A7209] transition-colors disabled:opacity-50">
        {saving ? 'جاري الحفظ...' : 'حفظ الخيار'}
      </button>
    </form>
  );
}