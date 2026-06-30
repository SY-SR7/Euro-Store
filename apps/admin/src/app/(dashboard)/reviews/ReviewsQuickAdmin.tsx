'use client';

import { CheckCircle2, RefreshCw, Star, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  products?: { name_ar?: string; name_en?: string; slug?: string } | null;
  customer_profiles?: { full_name?: string; email?: string } | null;
};

const TABS: { key: 'pending' | 'approved' | 'rejected' | 'all'; label: string }[] = [
  { key: 'pending', label: 'بانتظار المراجعة' },
  { key: 'approved', label: 'معتمدة' },
  { key: 'rejected', label: 'مرفوضة' },
  { key: 'all', label: 'الكل' },
];

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const payload = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? String(payload.error)
        : 'request_failed';
    throw new Error(message);
  }
  return payload as T;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= rating ? 'fill-[#B8860B] text-[#B8860B]' : 'text-[#E5E0D8]'} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Review['status'] }) {
  const map = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
  } as const;
  const label = { pending: 'بانتظار المراجعة', approved: 'معتمد', rejected: 'مرفوض' }[status];
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${map[status]}`}>{label}</span>;
}

export default function ReviewsQuickAdmin() {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = tab === 'all' ? '' : `?status=${tab}`;
      const data = await fetchJson<Review[]>(`/api/reviews${qs}`);
      setReviews(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'request_failed');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderate(id: string, status: 'approved' | 'rejected') {
    setBusyId(id);
    // optimistic removal from current tab if it no longer matches
    const prev = reviews;
    setReviews((r) => (tab === 'all' ? r.map((x) => (x.id === id ? { ...x, status } : x)) : r.filter((x) => x.id !== id)));
    try {
      await fetchJson(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      setReviews(prev);
      setError('فشل تحديث حالة التقييم');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#1C1917]">تقييمات المنتجات</h1>
          <p className="mt-1 text-sm text-[#8B8172]">مراجعة واعتماد تقييمات العملاء قبل ظهورها في الموقع</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm font-bold text-[#57534E] hover:border-[#B8860B] hover:text-[#B8860B]"
        >
          <RefreshCw size={15} /> تحديث
        </button>
      </div>

      <div className="flex gap-2 border-b border-[#E5E0D8] pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold transition-colors ${
              tab === t.key ? 'bg-[#B8860B] text-white' : 'text-[#57534E] hover:bg-[#F8F6F2]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#F8F6F2]" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-10 text-center text-sm text-[#A8A29E]">
          لا توجد تقييمات في هذا القسم
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#1C1917]">{r.products?.name_ar ?? '—'}</p>
                  <p className="mt-0.5 text-xs text-[#A8A29E]">
                    {r.customer_profiles?.full_name ?? 'عميل'} · {new Date(r.created_at).toLocaleDateString('ar-SY')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <StatusBadge status={r.status} />
                </div>
              </div>

              {r.comment && <p className="mt-3 rounded-xl bg-[#FAF7EF] p-3 text-sm text-[#3C352C]">{r.comment}</p>}

              {r.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => moderate(r.id, 'approved')}
                    className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} /> اعتماد
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => moderate(r.id, 'rejected')}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    <XCircle size={14} /> رفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
