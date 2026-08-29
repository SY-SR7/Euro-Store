'use client';
import { useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

export function NotifyMeForm({ variantId, isAr, onNotified }: { variantId: string, isAr: boolean, onNotified?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNotify() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/product-variants/${encodeURIComponent(variantId)}/notify-me`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (response.status === 401) {
        setError(isAr ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
        return;
      }
      if (!response.ok) {
        setError(isAr ? 'تعذر تسجيل التنبيه الآن' : 'Unable to create the alert right now');
        return;
      }
      setSuccess(true);
      onNotified?.();
    } catch {
      setError(isAr ? 'تعذر الاتصال بالخدمة' : 'Unable to reach the service');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-bold text-sm">
          {isAr ? 'سنقوم بإعلامك فور توفر المنتج!' : 'We will notify you when back in stock!'}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-elevated/50 border border-border rounded-2xl flex flex-col gap-3">
      <div className="flex items-center gap-2 text-text-primary">
        <Bell className="w-5 h-5 text-amber-500" />
        <span className="font-bold text-sm">
          {isAr ? 'هذا المنتج نفذ من المخزون' : 'This item is out of stock'}
        </span>
      </div>
      <p className="text-xs text-text-muted">
        {isAr 
          ? 'اضغط هنا وسنقوم بإرسال إشعار لك فور توفره مرة أخرى.' 
          : 'Click below and we will notify you as soon as it becomes available.'}
      </p>
      
      {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
      
      <button 
        onClick={() => { void handleNotify(); }} 
        disabled={loading}
        className="mt-1 w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2.5 rounded-xl transition-colors text-sm"
      >
        {loading ? '...' : (isAr ? 'أعلمني عند التوفر' : 'Notify Me When Available')}
      </button>
    </div>
  );
}
