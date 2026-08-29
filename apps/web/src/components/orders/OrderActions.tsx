'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, RefreshCcw, Repeat2, XCircle } from 'lucide-react';
import { ConfirmDialog } from '@eurostore/ui';

export function OrderActions({ orderId, orderNumber, status, isAr }: { orderId: string; orderNumber: string; status: string; isAr: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'cancel' | 'reorder' | null>(null);
  const [error, setError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);

  async function cancelOrder() {
    setBusy('cancel');
    setError('');
    const response = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
    if (!response.ok) setError(isAr ? 'تعذر إلغاء الطلب.' : 'The order could not be cancelled.');
    else {
      setCancelOpen(false);
      router.refresh();
    }
    setBusy(null);
  }

  async function reorder() {
    setBusy('reorder');
    setError('');
    const response = await fetch(`/api/orders/${orderId}/reorder`, { method: 'POST' });
    if (!response.ok) {
      setError(isAr ? 'تعذرت إعادة المنتجات إلى السلة.' : 'The items could not be added to the cart.');
      setBusy(null);
      return;
    }
    window.location.assign('/cart');
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a href={`/api/orders/${orderId}/invoice`} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-text-primary hover:border-primary">
          <Download className="h-4 w-4" />
          {isAr ? 'تحميل الفاتورة' : 'Download invoice'}
        </a>
        {status === 'pending' && (
          <button type="button" onClick={() => setCancelOpen(true)} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">
            <XCircle className="h-4 w-4" />
            {busy === 'cancel' ? (isAr ? 'جارٍ الإلغاء' : 'Cancelling') : (isAr ? 'إلغاء الطلب' : 'Cancel order')}
          </button>
        )}
        {status === 'completed' && (
          <button type="button" onClick={() => void reorder()} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-text-primary hover:border-primary disabled:opacity-50">
            <RefreshCcw className="h-4 w-4" />
            {busy === 'reorder' ? (isAr ? 'جارٍ الإضافة' : 'Adding') : (isAr ? 'إعادة الطلب' : 'Reorder')}
          </button>
        )}
        {['delivered', 'completed'].includes(status) && (
          <Link href={`/exchange/new?order=${encodeURIComponent(orderNumber)}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-text-primary hover:border-primary">
            <Repeat2 className="h-4 w-4" />
            {isAr ? 'طلب استبدال' : 'Request exchange'}
          </Link>
        )}
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      <ConfirmDialog
        open={cancelOpen}
        title={isAr ? 'إلغاء الطلب' : 'Cancel order'}
        description={isAr ? 'هل تريد إلغاء هذا الطلب؟ لا يمكن التراجع عن هذه العملية.' : 'Cancel this order? This action cannot be undone.'}
        confirmLabel={busy === 'cancel' ? (isAr ? 'جارٍ الإلغاء' : 'Cancelling') : (isAr ? 'إلغاء الطلب' : 'Cancel order')}
        cancelLabel={isAr ? 'رجوع' : 'Back'}
        onConfirm={() => void cancelOrder()}
        onCancel={() => setCancelOpen(false)}
        pending={busy === 'cancel'}
        destructive
      />
    </div>
  );
}
