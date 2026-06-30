'use client';

import { CheckCircle2, RefreshCw, Star, X, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

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

const inputClass =
  'w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B]';

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

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-black text-[#1C1917]">{title}</h2>
            {subtitle ? <p className="mt-0.5 truncate text-xs text-[#8B8172]">{subtitle}</p> : null}
          </div>
          <button type="button" title="إغلاق" onClick={onClose} className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]">
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-[#F0ECE6] pb-2 last:border-0 last:pb-0 sm:grid-cols-[120px_minmax(0,1fr)]">
      <span className="text-xs font-bold text-[#8B8172]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function InlineText({
  value,
  onSave,
  dir = 'rtl',
  multiline = false,
}: {
  value?: string | null;
  onSave: (value: string) => void | Promise<void>;
  dir?: 'rtl' | 'ltr';
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [editing, value]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next !== (value ?? '')) void onSave(next);
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          rows={4}
          value={draft}
          dir={dir}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') { setDraft(value ?? ''); setEditing(false); }
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); commit(); }
          }}
          className={`${inputClass} resize-y`}
        />
      );
    }
    return (
      <input
        autoFocus
        value={draft}
        dir={dir}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') { setDraft(value ?? ''); setEditing(false); }
        }}
        className={inputClass}
      />
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-[#1C1917] transition hover:bg-[#FAF7EF]">
      {value?.trim() ? value : <span className="text-[#A8A29E]">لا يوجد تعليق</span>}
    </button>
  );
}

function StarPicker({ value, onSave }: { value: number; onSave: (value: number) => void | Promise<void> }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => n !== value && void onSave(n)}
          title={`${n} نجوم`}
          className="rounded-lg p-1 transition hover:bg-[#FAF7EF]"
        >
          <Star size={20} className={n <= value ? 'fill-[#B8860B] text-[#B8860B]' : 'text-[#E5E0D8]'} />
        </button>
      ))}
    </div>
  );
}

function StatusPills({ value, onSave }: { value: Review['status']; onSave: (value: Review['status']) => void | Promise<void> }) {
  const options: { value: Review['status']; label: string; cls: string }[] = [
    { value: 'pending', label: 'بانتظار المراجعة', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
    { value: 'approved', label: 'معتمد', cls: 'border-green-200 bg-green-50 text-green-700' },
    { value: 'rejected', label: 'مرفوض', cls: 'border-red-200 bg-red-50 text-red-700' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !active && void onSave(option.value)}
            className={`rounded-full border px-3 py-1 text-xs font-black transition ${active ? option.cls : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Review | null>(null);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = tab === 'all' ? '' : `?status=${tab}`;
      const data = await fetchJson<Review[]>(`/api/reviews${qs}`);
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const openReview = useCallback((review: Review, updateUrl = true) => {
    setSelected(review);
    setMsg('');
    if (updateUrl) router.replace(`/reviews?open=${review.id}`, { scroll: false });
  }, [router]);

  const closeReview = () => {
    setSelected(null);
    router.replace('/reviews', { scroll: false });
  };

  useEffect(() => {
    const reviewId = searchParams.get('open');
    if (!reviewId || autoOpenedId === reviewId || selected?.id === reviewId) return;
    const existing = reviews.find((review) => review.id === reviewId);
    if (existing) {
      openReview(existing, false);
      setAutoOpenedId(reviewId);
    }
  }, [autoOpenedId, openReview, reviews, searchParams, selected?.id]);

  const mergeReview = (id: string, patch: Partial<Review>) => {
    setReviews((current) =>
      tab === 'all' || (patch.status ?? selected?.status) === tab || !patch.status
        ? current.map((review) => (review.id === id ? { ...review, ...patch } : review))
        : current.filter((review) => review.id !== id),
    );
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchReview = async (patch: Partial<Pick<Review, 'status' | 'rating' | 'comment'>>) => {
    if (!selected) return;
    const previous = selected;
    setMsg('');
    mergeReview(selected.id, patch);
    try {
      const updated = await fetchJson<Review>(`/api/reviews/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeReview(selected.id, updated);
      setMsg('تم الحفظ');
    } catch (error) {
      mergeReview(previous.id, previous);
      setMsg(error instanceof Error ? error.message : 'فشل الحفظ');
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#1C1917]">تقييمات المنتجات</h1>
          <p className="mt-1 text-sm text-[#8B8172]">مراجعة واعتماد تقييمات العملاء، وتعديل أي حقل بضغطة واحدة</p>
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
        <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
          <div className="divide-y divide-[#F0ECE6]">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="group cursor-pointer p-4 transition-colors hover:bg-[#FFFBF0]"
                onClick={() => openReview(r)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#1C1917] group-hover:text-[#B8860B]">{r.products?.name_ar ?? '—'}</p>
                    <p className="mt-0.5 text-xs text-[#A8A29E]">
                      {r.customer_profiles?.full_name ?? 'عميل'} · {new Date(r.created_at).toLocaleDateString('ar-SY')}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <Stars rating={r.rating} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                {r.comment && <p className="mt-3 line-clamp-2 rounded-xl bg-[#FAF7EF] p-3 text-sm text-[#3C352C]">{r.comment}</p>}
                {r.status === 'pending' && (
                  <div className="mt-3 flex gap-2" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => { openReview(r); void patchReview({ status: 'approved' }); }}
                      className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"
                    >
                      <CheckCircle2 size={14} /> اعتماد
                    </button>
                    <button
                      type="button"
                      onClick={() => { openReview(r); void patchReview({ status: 'rejected' }); }}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <XCircle size={14} /> رفض
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selected ? (
        <Modal title={selected.products?.name_ar ?? 'تقييم'} subtitle={selected.customer_profiles?.full_name ?? 'عميل'} onClose={closeReview}>
          <div className="space-y-4">
            {msg ? (
              <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === 'تم الحفظ' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {msg}
              </div>
            ) : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <Field label="التقييم">
                  <StarPicker value={selected.rating} onSave={(rating) => patchReview({ rating })} />
                </Field>
                <Field label="التعليق">
                  <InlineText value={selected.comment ?? ''} multiline onSave={(comment) => patchReview({ comment })} />
                </Field>
                <Field label="الحالة">
                  <StatusPills value={selected.status} onSave={(status) => patchReview({ status })} />
                </Field>
                <Field label="المنتج">
                  <div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]">
                    {selected.products?.name_ar ?? '—'}
                  </div>
                </Field>
                <Field label="العميل">
                  <div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]">
                    {selected.customer_profiles?.full_name ?? '—'} {selected.customer_profiles?.email ? `· ${selected.customer_profiles.email}` : ''}
                  </div>
                </Field>
                <Field label="تاريخ التقييم">
                  <div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]">
                    {new Date(selected.created_at).toLocaleDateString('ar-SY')}
                  </div>
                </Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
