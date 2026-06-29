'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: string; quantity: number; unit_price: number; total_price: number;
  product_variants: { sku: string; attributes: Record<string,string>; products: { name_ar: string } };
}
interface OrderDetail {
  id: string; order_number: string; status: string;
  total_syp: number; subtotal_syp: number; shipping_syp: number;
  created_at: string; notes: string | null;
  address_snapshot: { full_name: string; phone: string; governorate: string; address: string };
  order_items: OrderItem[];
}

const TRANSITIONS: Record<string, string[]> = {
  pending:['confirmed','cancelled'], confirmed:['processing','cancelled'],
  processing:['shipped','cancelled'], shipped:['delivered'],
  delivered:[], cancelled:[],
};
const STATUS_BADGE: Record<string,string> = {
  pending:'badge-gold', confirmed:'badge-blue', processing:'badge-purple',
  shipped:'badge-blue', delivered:'badge-green', cancelled:'badge-red',
};
const STATUS_AR: Record<string,string> = {
  pending:'معلق', confirmed:'مؤكد', processing:'قيد التجهيز',
  shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder]   = useState<OrderDetail | null>(null);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg]       = useState('');

  const load = async () => {
    const res = await fetch(`/api/orders/${id}`);
    setOrder(await res.json() as OrderDetail);
  };
  useEffect(() => { void load(); }, [id]);

  const changeStatus = async (newStatus: string) => {
    setUpdating(true); setMsg('');
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { setMsg(`تم تحديث الحالة إلى: ${STATUS_AR[newStatus] ?? newStatus}`); await load(); }
    setUpdating(false);
  };

  if (!order) return <div className="p-10 text-center text-[#A8A29E]">جاري التحميل...</div>;
  const allowed = TRANSITIONS[order.status] ?? [];

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/orders" className="text-sm text-[#A8A29E] hover:text-[#B8860B]"> الطلبات</Link>
          <h1 className="mt-1 text-2xl font-black text-[#1C1917]">طلب #{order.order_number}</h1>
          <span className={`mt-1 inline-block ${STATUS_BADGE[order.status] ?? 'badge-gray'}`}>{STATUS_AR[order.status] ?? order.status}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowed.map(s => (
            <button key={s} onClick={() => void changeStatus(s)} disabled={updating}
              className="rounded-xl bg-[#B8860B] px-4 py-2 text-sm font-bold text-white hover:bg-[#9A7209] disabled:opacity-50 transition-colors">
              → {STATUS_AR[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">{msg}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-[#B8860B]">معلومات التوصيل</h2>
          <p className="font-semibold text-[#1C1917]">{order.address_snapshot?.full_name}</p>
          <p className="text-sm text-[#57534E]">{order.address_snapshot?.phone}</p>
          <p className="text-sm text-[#57534E]">{order.address_snapshot?.governorate}</p>
          <p className="text-sm text-[#57534E]">{order.address_snapshot?.address}</p>
        </div>
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-[#B8860B]">ملخص المبالغ</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[#57534E]"><span>المجموع الجزئي</span><span>{Number(order.subtotal_syp||0).toLocaleString('ar-SY')} ل.س</span></div>
            <div className="flex justify-between text-[#57534E]"><span>الشحن</span><span>{Number(order.shipping_syp||0).toLocaleString('ar-SY')} ل.س</span></div>
            <div className="flex justify-between border-t border-[#E5E0D8] pt-2 font-black text-[#1C1917]"><span>الإجمالي</span><span>{Number(order.total_syp||0).toLocaleString('ar-SY')} ل.س</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        <h2 className="border-b border-[#E5E0D8] px-5 py-4 font-black text-[#1C1917]">المنتجات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F8F6F2]">
              <tr>
                <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">المنتج</th>
                <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">الكمية</th>
                <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">السعر</th>
                <th className="px-5 py-3 text-right text-xs font-black text-[#A8A29E]">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE6]">
              {(order.order_items ?? []).map(item => (
                <tr key={item.id} className="hover:bg-[#FAFAF8]">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-[#1C1917]">{item.product_variants?.products?.name_ar ?? '—'}</p>
                    <p className="text-xs text-[#A8A29E]">SKU: {item.product_variants?.sku ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3 text-[#57534E]">{item.quantity}</td>
                  <td className="px-5 py-3 text-[#57534E]">{Number(item.unit_price||0).toLocaleString('ar-SY')} ل.س</td>
                  <td className="px-5 py-3 font-semibold text-[#1C1917]">{Number(item.total_price||0).toLocaleString('ar-SY')} ل.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}