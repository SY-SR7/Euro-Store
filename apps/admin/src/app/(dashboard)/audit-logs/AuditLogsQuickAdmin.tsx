'use client';

import { AlertTriangle, CheckCircle2, Eye, Pencil, RefreshCw, Search, Trash2, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

type ActivityLog = {
  id: string;
  admin_email?: string;
  action?: string;
  action_ar?: string;
  entity_type?: string;
  entity_label?: string;
  entity_id?: string;
  summary?: string;
  method?: string;
  path?: string;
  status_code?: number;
  ok?: boolean;
  request_body?: unknown;
  old_values?: unknown;
  new_values?: unknown;
  undo?: { possible?: boolean; reason?: string };
  undone_at?: string;
  undo_status?: number;
  created_at?: string;
  ip?: string;
};

type FilterKey = 'all' | 'create' | 'update' | 'delete' | 'status' | 'undo';

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

function pickLogs(payload: unknown): ActivityLog[] {
  if (Array.isArray(payload)) return payload as ActivityLog[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['logs', 'data', 'items', 'audit_logs']) {
      if (Array.isArray(record[key])) return record[key] as ActivityLog[];
    }
  }
  return [];
}

function pretty(value: unknown): string {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function actionKind(action?: string): FilterKey {
  const value = String(action || '').toLowerCase();
  if (value === 'undo') return 'undo';
  if (value.includes('delete')) return 'delete';
  if (value.includes('create')) return 'create';
  if (value.includes('status') || value.includes('confirm') || value.includes('approve') || value.includes('reject')) return 'status';
  return 'update';
}

function actionStyle(action?: string) {
  const kind = actionKind(action);
  if (kind === 'create') return 'border-green-200 bg-green-50 text-green-700';
  if (kind === 'delete') return 'border-red-200 bg-red-50 text-red-700';
  if (kind === 'status') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (kind === 'undo') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-[#E5E0D8] bg-[#F8F6F2] text-[#57534E]';
}

function ActionIcon({ action }: { action?: string }) {
  const kind = actionKind(action);
  const className = 'h-4 w-4';
  if (kind === 'create') return <CheckCircle2 className={className} />;
  if (kind === 'delete') return <Trash2 className={className} />;
  if (kind === 'status') return <AlertTriangle className={className} />;
  if (kind === 'undo') return <Undo2 className={className} />;
  return <Pencil className={className} />;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button type="button" title="إغلاق" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]">
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-[#E5E0D8] bg-white p-4">
      <h3 className="mb-3 text-xs font-black text-[#8B8172]">{title}</h3>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#121414] p-3 text-left text-xs leading-6 text-[#DDEBD2]" dir="ltr">
        {pretty(value)}
      </pre>
    </div>
  );
}

function matchesFilter(log: ActivityLog, filter: FilterKey) {
  if (filter === 'all') return true;
  return actionKind(log.action) === filter;
}

function contains(log: ActivityLog, query: string) {
  if (!query.trim()) return true;
  const text = [
    log.admin_email,
    log.action,
    log.action_ar,
    log.entity_type,
    log.entity_label,
    log.entity_id,
    log.summary,
    log.path,
    log.method,
    log.status_code,
  ].join(' ').toLowerCase();
  return text.includes(query.trim().toLowerCase());
}

export default function AuditLogsQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ActivityLog | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [msg, setMsg] = useState('');
  const [undoingId, setUndoingId] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setMsg('');
    fetchJson<unknown>('/api/audit-logs?limit=500', { cache: 'no-store' })
      .then((payload) => setLogs(pickLogs(payload)))
      .catch((error) => setMsg(error instanceof Error ? error.message : 'تعذر تحميل السجل'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => logs.filter((log) => matchesFilter(log, filter)).filter((log) => contains(log, query)), [filter, logs, query]);

  const stats = useMemo(() => ({
    total: logs.length,
    undoable: logs.filter((log) => log.undo?.possible && !log.undone_at).length,
    errors: logs.filter((log) => log.ok === false || Number(log.status_code || 200) >= 400).length,
  }), [logs]);

  const openLog = useCallback((log: ActivityLog, updateUrl = true) => {
    setSelected(log);
    setMsg('');
    if (updateUrl) router.replace(`/audit-logs?open=${encodeURIComponent(log.id)}`, { scroll: false });
  }, [router]);

  const close = () => {
    setSelected(null);
    router.replace('/audit-logs', { scroll: false });
  };

  useEffect(() => {
    const id = searchParams.get('open');
    if (!id || autoOpenedId === id || selected?.id === id) return;
    const found = logs.find((log) => log.id === id);
    if (found) {
      openLog(found, false);
      setAutoOpenedId(id);
    }
  }, [autoOpenedId, logs, openLog, searchParams, selected?.id]);

  async function undo(log: ActivityLog) {
    setUndoingId(log.id);
    setMsg('');
    try {
      const payload = await fetchJson<{ ok: boolean; error?: string }>(`/api/audit-logs/${encodeURIComponent(log.id)}/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!payload.ok) {
        setMsg(payload.error || 'فشل التراجع');
      } else {
        setMsg('تم التراجع');
        load();
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'فشل التراجع');
    } finally {
      setUndoingId('');
    }
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'create', label: 'إنشاء' },
    { key: 'update', label: 'تعديل' },
    { key: 'delete', label: 'حذف' },
    { key: 'status', label: 'حالة' },
    { key: 'undo', label: 'تراجع' },
  ];

  return (
    <div className="space-y-5" dir="rtl">
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">سجل النشاط</h1>
          <p className="mt-1 text-sm text-[#8B8172]">{stats.total.toLocaleString('ar-SY')} حركة</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#B8860B]">
          <RefreshCw size={16} /> تحديث
        </button>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          ['إجمالي', stats.total],
          ['قابل للتراجع', stats.undoable],
          ['أخطاء', stats.errors],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#E5E0D8] bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-[#8B8172]">{label}</p>
            <p className="mt-2 text-2xl font-black text-[#1C1917]">{Number(value).toLocaleString('ar-SY')}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[#E5E0D8] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-black ${filter === item.key ? 'border-[#B8860B] bg-[#B8860B] text-white' : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#57534E] hover:border-[#B8860B]'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#FAFAF8] focus-within:border-[#B8860B] xl:w-96">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث..." className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
            <span className="grid w-10 place-items-center border-r border-[#E5E0D8] text-[#8B8172]"><Search size={16} /></span>
          </div>
        </div>
      </section>

      {msg ? <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${msg === 'تم التراجع' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}

      <section className="overflow-hidden rounded-lg border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جار التحميل...</p>
        : filtered.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد حركات</p>
        : (
          <div className="divide-y divide-[#F0ECE6]">
            {filtered.map((log) => {
              const canUndo = log.undo?.possible === true && !log.undone_at;
              return (
                <button key={log.id} type="button" onClick={() => openLog(log)} className="grid w-full gap-3 p-4 text-right transition hover:bg-[#FFFBF0] lg:grid-cols-[44px_minmax(0,1fr)_auto] lg:items-center">
                  <span className={`grid h-10 w-10 place-items-center rounded-lg border ${actionStyle(log.action)}`}><ActionIcon action={log.action} /></span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-[#1C1917]">{log.action_ar || log.action || 'حركة'}</span>
                      <span className="rounded-full border border-[#E5E0D8] bg-[#F8F6F2] px-2 py-1 text-[11px] font-bold text-[#57534E]">{log.entity_label || log.entity_type || 'system'}</span>
                      {canUndo ? <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">تراجع</span> : null}
                    </span>
                    <span className="mt-1 block truncate text-sm text-[#57534E]">{log.summary || log.path || log.entity_id || '-'}</span>
                    <span className="mt-1 block text-xs text-[#A8A29E]" dir="ltr">{log.admin_email || 'unknown-admin@local'}</span>
                  </span>
                  <span className="text-xs font-bold text-[#8B8172]">{formatDate(log.created_at)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selected ? (
        <Modal title={selected.action_ar || selected.action || 'حركة'} onClose={close}>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['المشرف', selected.admin_email || 'unknown-admin@local'],
                ['القسم', selected.entity_label || selected.entity_type || '-'],
                ['المعرف', selected.entity_id || '-'],
                ['الوقت', formatDate(selected.created_at)],
                ['المسار', selected.path || '-'],
                ['الطريقة', selected.method || 'UI'],
                ['النتيجة', String(selected.status_code ?? '-')],
                ['IP', selected.ip || '-'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#E5E0D8] bg-white p-3">
                  <p className="text-xs font-bold text-[#8B8172]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black text-[#1C1917]" dir="auto">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              <JsonBlock title="الطلب" value={selected.request_body} />
              <JsonBlock title="قبل" value={selected.old_values} />
              <JsonBlock title="بعد" value={selected.new_values} />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-[#E5E0D8] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#57534E]">
                <Eye size={16} />
                {selected.undone_at ? `تم التراجع: ${formatDate(selected.undone_at)}` : selected.undo?.reason || 'لا يوجد تراجع تلقائي'}
              </div>
              <button
                type="button"
                onClick={() => void undo(selected)}
                disabled={!selected.undo?.possible || Boolean(selected.undone_at) || undoingId === selected.id}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B8860B] px-4 py-2 text-sm font-black text-white hover:bg-[#9A7209] disabled:cursor-not-allowed disabled:bg-[#E5E0D8] disabled:text-[#A8A29E]"
              >
                <Undo2 size={16} />
                {undoingId === selected.id ? 'جار التراجع...' : selected.undone_at ? 'تم التراجع' : 'تراجع'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
