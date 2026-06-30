'use client';

import { RefreshCw, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

type ExchangeRequest = {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  status: string;
  reason_ar: string | null;
  reason_en: string | null;
  notes: string | null;
  customer_images?: string[] | null;
  qr_code_url?: string | null;
  created_at: string;
  updated_at?: string;
};

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'completed'] as const;
const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button
            type="button"
            title="إغلاق"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]"
          >
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
  multiline = true,
}: {
  value?: string | null;
  onSave: (value: string) => Promise<void> | void;
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

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(value ?? '');
      setEditing(false);
    }
    if (!multiline && event.key === 'Enter') {
      event.preventDefault();
      commit();
    }
    if (multiline && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      commit();
    }
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          rows={3}
          value={draft}
          dir={dir}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
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
        onKeyDown={onKeyDown}
        className={inputClass}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      dir={dir}
      className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-[#1C1917] transition hover:bg-[#FAF7EF]"
    >
      {value?.trim() ? value : <span className="text-[#A8A29E]">—</span>}
    </button>
  );
}

function StatusPills({
  value,
  onSave,
}: {
  value: string;
  onSave: (value: string) => Promise<void> | void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((status) => {
        const active = status === value;
        return (
          <button
            key={status}
            type="button"
            onClick={() => {
              if (!active) void onSave(status);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-black transition ${
              active ? STATUS_COLOR[status] : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'
            }`}
          >
            {STATUS_AR[status]}
          </button>
        );
      })}
    </div>
  );
}

export default function ExchangesQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [selected, setSelected] = useState<ExchangeRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    fetchJson<ExchangeRequest[]>(`/api/exchanges?${params}`, { cache: 'no-store' })
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const open = useCallback(async (request: ExchangeRequest, updateUrl = true) => {
    setSelected(request);
    setMsg('');
    setDetailLoading(true);
    if (updateUrl) router.replace(`/exchanges?open=${request.id}`, { scroll: false });
    try {
      const detail = await fetchJson<ExchangeRequest>(`/api/exchanges/${request.id}`);
      setSelected(detail);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'تعذر تحميل التفاصيل');
    } finally {
      setDetailLoading(false);
    }
  }, [router]);

  const close = () => {
    setSelected(null);
    router.replace('/exchanges', { scroll: false });
  };

  useEffect(() => {
    const requestId = searchParams.get('open');
    if (!requestId || autoOpenedId === requestId || selected?.id === requestId) return;

    const existing = requests.find((request) => request.id === requestId);
    void open(existing ?? {
      id: requestId,
      order_id: null,
      customer_id: null,
      status: 'pending',
      reason_ar: null,
      reason_en: null,
      notes: null,
      customer_images: [],
      created_at: new Date().toISOString(),
    }, false);
    setAutoOpenedId(requestId);
  }, [autoOpenedId, open, requests, searchParams, selected?.id]);

  const mergeRequest = (id: string, patch: Partial<ExchangeRequest>) => {
    setRequests((current) => current.map((request) => (request.id === id ? { ...request, ...patch } : request)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchRequest = async (patch: Partial<ExchangeRequest>) => {
    if (!selected) return;
    const previous = selected;
    setMsg('');
    mergeRequest(selected.id, patch);
    try {
      const updated = await fetchJson<ExchangeRequest>(`/api/exchanges/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeRequest(selected.id, updated);
      setMsg('تم الحفظ');
    } catch (error) {
      mergeRequest(previous.id, previous);
      setMsg(error instanceof Error ? error.message : 'فشل الحفظ');
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">طلبات الاستبدال</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{requests.length} طلب</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E0D8] px-3 py-1.5 text-xs font-bold text-[#57534E] hover:border-[#B8860B]"
          >
            <RefreshCw size={13} />
            تحديث
          </button>
          {(['all', 'pending', 'approved', 'rejected', 'completed'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                statusFilter === status
                  ? 'border-[#B8860B] bg-[#B8860B] text-white'
                  : 'border-[#E5E0D8] text-[#57534E] hover:border-[#B8860B]'
              }`}
            >
              {status === 'all' ? 'الكل' : STATUS_AR[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">جار التحميل...</p>
        ) : requests.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد طلبات استبدال</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {['الرقم', 'السبب', 'الحالة', 'تاريخ الطلب'].map((heading, index) => (
                    <th
                      key={heading}
                      className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${
                        index === 3 ? 'hidden md:table-cell' : ''
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]"
                    onClick={() => void open(request)}
                  >
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#1C1917] group-hover:text-[#B8860B]">
                      {request.id.slice(0, 8)}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-[#57534E]">
                      {request.reason_ar ?? request.reason_en ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[request.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {STATUS_AR[request.status] ?? request.status}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-[#A8A29E] md:table-cell">
                      {new Date(request.created_at).toLocaleDateString('ar-SY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={`طلب استبدال #${selected.id.slice(0, 8)}`} onClose={() => setSelected(null)}>
          {detailLoading ? (
            <div className="h-56 rounded-2xl bg-[#F1E8DA] animate-pulse" />
          ) : (
            <div className="space-y-4">
              {msg ? (
                <div
                  className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                    msg === 'تم الحفظ'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {msg}
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
                  <div className="space-y-2">
                    <Field label="الحالة">
                      <StatusPills value={selected.status} onSave={(status) => patchRequest({ status })} />
                    </Field>
                    <Field label="السبب العربي">
                      <div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]">
                        {selected.reason_ar ?? '—'}
                      </div>
                    </Field>
                    <Field label="السبب الإنجليزي">
                      <div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]" dir="ltr">
                        {selected.reason_en ?? '—'}
                      </div>
                    </Field>
                    <Field label="ملاحظات الإدارة">
                      <InlineText
                        value={selected.notes ?? ''}
                        onSave={(notes) => patchRequest({ notes })}
                      />
                    </Field>
                    <Field label="رقم الطلب">
                      <div className="min-h-9 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[#1C1917]">
                        {selected.order_id ?? '—'}
                      </div>
                    </Field>
                    <Field label="تاريخ الطلب">
                      <div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]">
                        {new Date(selected.created_at).toLocaleDateString('ar-SY')}
                      </div>
                    </Field>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-black text-[#1C1917]">صور العميل</h3>
                  {selected.customer_images && selected.customer_images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selected.customer_images.map((url, index) => (
                        <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-[#E5E0D8]">
                          <img src={url} alt={`صورة ${index + 1}`} className="aspect-square w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-[#E5E0D8] p-8 text-center text-sm font-bold text-[#8B8172]">
                      لا توجد صور
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
