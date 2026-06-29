'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';

interface OrderItem {
  id: string; quantity: number; unit_price: number; total_price: number;
  product_variants: { sku: string; attributes: Record<string, string>; products: { name_ar: string } };
}
interface OrderDetail {
  id: string; order_number: string; status: string;
  total_syp: number; subtotal_syp: number; shipping_syp: number;
  created_at: string; notes: string | null;
  address_snapshot: { full_name: string; phone: string; governorate: string; address: string };
  order_items: OrderItem[];
}

const TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed','cancelled'],
  confirmed:  ['processing','cancelled'],
  processing: ['shipped','cancelled'],
  shipped:    ['delivered'],
  delivered:  [], cancelled:  [],
};

const STATUS_COLORS: Record<string, string> = {
  pending:'bg-yellow-900/30 text-yellow-400', confirmed:'bg-blue-900/30 text-blue-400',
  processing:'bg-purple-900/30 text-purple-400', shipped:'bg-indigo-900/30 text-indigo-400',
  delivered:'bg-green-900/30 text-green-400', cancelled:'bg-red-900/30 text-red-400',
};

export default function OrderDetailPage() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/orders/${id}`);
    setOrder(await res.json() as OrderDetail);
  };
  useEffect(() => { void load(); }, [id]);

  const changeStatus = async (newStatus: string) => {
    setUpdating(true);
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    await load();
    setUpdating(false);
  };

  if (!order) return <p className="text-[#9CA3AF] p-8">{t('common.loading')}</p>;

  const allowed = TRANSITIONS[order.status] ?? [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E2E2E2]">{t('admin.order')} #{order.order_number}</h1>
          <span className={`mt-1 inline-block rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? ''}`}>{order.status}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {allowed.map(s => (
            <button key={s} onClick={() => void changeStatus(s)} disabled={updating}
              className="rounded bg-[#C9A84C] px-4 py-2 text-sm font-medium text-[#111] hover:bg-[#b8943e] disabled:opacity-50">
               {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
          <h2 className="mb-3 font-semibold text-[#C9A84C]">{t('checkout.deliveryInfo')}</h2>
          <p className="text-[#E2E2E2]">{order.address_snapshot.full_name}</p>
          <p className="text-[#9CA3AF] text-sm">{order.address_snapshot.phone}</p>
          <p className="text-[#9CA3AF] text-sm">{order.address_snapshot.governorate} — {order.address_snapshot.address}</p>
        </div>
        <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
          <h2 className="mb-3 font-semibold text-[#C9A84C]">{t('checkout.orderSummary')}</h2>
          <p className="text-sm text-[#9CA3AF]">{t('checkout.subtotal')}: {formatSYP(Number(order.subtotal_syp))}</p>
          <p className="text-sm text-[#9CA3AF]">{t('checkout.shipping')}: {formatSYP(Number(order.shipping_syp))}</p>
          <p className="mt-2 font-bold text-[#E2E2E2]">{t('checkout.total')}: {formatSYP(Number(order.total_syp))}</p>
        </div>
      </div>

      <div className="rounded-lg border border-[#2E2E2E] overflow-x-auto">
        <table className="w-full text-sm text-[#E2E2E2]">
          <thead className="bg-[#1A1A1A] text-[#9CA3AF]">
            <tr>
              <th className="px-4 py-3 text-start">{t('adminCatalog.product')}</th>
              <th className="px-4 py-3 text-start">SKU</th>
              <th className="px-4 py-3 text-start">{t('adminCatalog.quantity')}</th>
              <th className="px-4 py-3 text-start">{t('admin.total')}</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map(item => (
              <tr key={item.id} className="border-t border-[#2E2E2E]">
                <td className="px-4 py-3">{item.product_variants.products.name_ar}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{item.product_variants.sku}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatSYP(Number(item.total_price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}