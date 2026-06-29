'use client';
/* eslint-disable */
// @ts-nocheck
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function NewExchangePage() {
  const [orders, setOrders]       = useState<any[]>([]);
  const [orderId, setOrderId]     = useState('');
  const [reason, setReason]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [user, setUser]           = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (!u) { setLoadingOrders(false); return; }
      const { data } = await supabase
        .from('orders')
        .select('id,order_number,status,total_syp,created_at')
        .eq('customer_id', u.id)
        .in('status', ['delivered','completed'])
        .order('created_at', { ascending: false });
      setOrders(data ?? []);
      setLoadingOrders(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) { setError('اختر طلباً أولاً'); return; }
    if (!reason.trim()) { setError('يرجى كتابة سبب الاستبدال'); return; }
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const res = await fetch('/api/exchange/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          reason_ar: reason,
          reason_en: reason,
          items: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'خطأ غير متوقع'); }
      else {
        setSuccess(`تم إنشاء طلب الاستبدال بنجاح! رقم الطلب: ${data.id ?? ''}`);
        setOrderId(''); setReason('');
      }
    } catch { setError('تعذّر الاتصال بالخادم'); }
    finally { setSubmitting(false); }
  }

  if (!user && !loadingOrders) {
    return (
      <main className="min-h-screen bg-[#FAF7EF] px-6 py-12" dir="rtl">
        <div className="mx-auto max-w-lg text-center space-y-4">
          <p className="text-lg font-bold text-[#1F1B16]">يجب تسجيل الدخول أولاً</p>
          <Link href="/auth/login" className="inline-block rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-bold text-white">تسجيل الدخول</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-6 py-12 text-[#1F1B16]" dir="rtl">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <Link href="/exchange" className="text-xs text-[#C9A84C] hover:underline">← طلبات الاستبدال</Link>
          <h1 className="mt-3 text-2xl font-black text-[#1F1B16]">طلب استبدال جديد</h1>
          <p className="mt-1 text-sm text-[#6F6658]">يمكنك طلب الاستبدال خلال 7 أيام من استلام طلبك</p>
        </div>

        {error   && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

        {loadingOrders ? (
          <div className="rounded-2xl border border-[#E8DCC3] bg-white p-8 text-center text-sm text-[#A8A29E]">جاري تحميل طلباتك...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-[#E8DCC3] bg-white p-8 text-center space-y-3">
            <p className="text-[#6F6658]">لا توجد طلبات مؤهلة للاستبدال</p>
            <p className="text-xs text-[#A8A29E]">يجب أن يكون الطلب في حالة "تم التسليم" حتى تتمكن من طلب الاستبدال</p>
            <Link href="/products" className="inline-block rounded-xl bg-[#C9A84C] px-5 py-2 text-sm font-bold text-white">تسوق الآن</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[#E8DCC3] bg-white p-6 shadow-sm">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#1F1B16]">اختر الطلب</label>
              <select value={orderId} onChange={e => setOrderId(e.target.value)} required
                className="w-full rounded-xl border border-[#E8DCC3] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-[#C9A84C]">
                <option value="">— اختر طلباً —</option>
                {orders.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    #{o.order_number} — {Number(o.total_syp).toLocaleString('ar-SY')} ل.س — {new Date(o.created_at).toLocaleDateString('ar-SY')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1F1B16]">سبب الاستبدال</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={4}
                placeholder="اشرح سبب طلب الاستبدال بالتفصيل..."
                className="w-full resize-none rounded-xl border border-[#E8DCC3] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1F1B16] outline-none focus:border-[#C9A84C] placeholder:text-[#A8A29E]" />
            </div>

            <button type="submit" disabled={submitting || !orderId}
              className="w-full rounded-xl bg-[#C9A84C] py-3 text-sm font-black text-white hover:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'جاري الإرسال...' : 'إرسال طلب الاستبدال'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}