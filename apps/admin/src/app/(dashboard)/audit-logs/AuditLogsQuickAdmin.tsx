'use client';

import { AlertTriangle, CheckCircle2, Eye, Pencil, RefreshCw, Search, Trash2, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

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
  
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
  }
  
  const payload = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? (payload.error === 'Unauthorized' ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' : String(payload.error))
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

function formatDate(value: string | undefined, locale: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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
  return 'border-[#E5E0D8] bg-[#F8F6F2] text-text-secondary';
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

function Modal({ title, onClose, children, closeTitle }: { title: string; onClose: () => void; children: ReactNode; closeTitle?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-background-card px-5 py-4">
          <h2 className="font-black text-text-primary">{title}</h2>
          <button type="button" title={closeTitle || "Close"} onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-[#F8F6F2] text-text-secondary hover:bg-[#E5E0D8]">
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
    <div className="rounded-lg border border-[#E5E0D8] bg-background-card p-4">
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
  const locale = useLocale();
  const isAr = locale === 'ar';
  const formatLoc = isAr ? 'ar-SY' : 'en-US';
  const t = useTranslations('adminAuditLogs');
  const tCommon = useTranslations('common');

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
      .catch((error) => setMsg(error instanceof Error ? error.message : t('failedToLoad')))
      .finally(() => setLoading(false));
  }, [t]);

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
        setMsg(payload.error || t('failedToUndo'));
      } else {
        setMsg(t('undoneSuccess'));
        load();
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : t('failedToUndo'));
    } finally {
      setUndoingId('');
    }
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'create', label: t('filterCreate') },
    { key: 'update', label: t('filterUpdate') },
    { key: 'delete', label: t('filterDelete') },
    { key: 'status', label: t('filterStatus') },
    { key: 'undo', label: t('filterUndo') },
  ];

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E0D8] bg-background-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-[#8B8172]">{t('countLogs', { count: stats.total })}</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-[#1C1917] px-4 py-2 text-sm font-black text-text-primary hover:bg-primary">
          <RefreshCw size={16} /> {tCommon('refresh')}
        </button>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          [t('statsTotal'), stats.total],
          [t('statsUndoable'), stats.undoable],
          [t('statsErrors'), stats.errors],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
            <p className="text-xs font-black text-[#8B8172]">{label}</p>
            <p className="mt-2 text-2xl font-black text-text-primary" dir="ltr">{Number(value).toLocaleString(formatLoc)}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-black ${filter === item.key ? 'border-primary bg-primary text-text-primary' : 'border-[#E5E0D8] bg-background text-text-secondary hover:border-primary'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-lg border border-[#E5E0D8] bg-background focus-within:border-primary xl:w-96">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" dir={isAr ? "rtl" : "ltr"} />
            <span className={`grid w-10 place-items-center ${isAr ? "border-r" : "border-l"} border-[#E5E0D8] text-[#8B8172]`}><Search size={16} /></span>
          </div>
        </div>
      </section>

      {msg ? <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${msg === t('undoneSuccess') ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}

      <section className="overflow-hidden rounded-lg border border-[#E5E0D8] bg-background-card shadow-sm">
        {loading ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{tCommon('loading')}</p>
        : filtered.length === 0 ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{t('noLogs')}</p>
        : (
          <div className="divide-y divide-[#F0ECE6]">
            {filtered.map((log) => {
              const ENTITY_MAP: Record<string, string> = {
                'catalog/products': 'المنتجات',
                'catalog/variants': 'متغيرات المنتجات',
                'catalog/categories': 'التصنيفات',
                'catalog/brands': 'العلامات التجارية',
                'catalog/homepage': 'الواجهة الرئيسية',
                'orders': 'الطلبات',
                'customers': 'العملاء',
                'discounts': 'الخصومات',
                'exchanges': 'الاستبدال والترجيع',
                'settings': 'الإعدادات',
                'loyalty_settings': 'إعدادات الولاء'
              };
              const mappedEntity = log.entity_type ? ENTITY_MAP[log.entity_type] : undefined;
              const finalEntityLabel = log.entity_label || mappedEntity || log.entity_type || t('defaultEntity');
              
              const canUndo = log.undo?.possible === true && !log.undone_at;
              return (
                <button key={log.id} type="button" onClick={() => openLog(log)} className={`grid w-full gap-3 p-4 ${isAr ? "text-right" : "text-left"} transition hover:bg-[#FFFBF0] lg:grid-cols-[44px_minmax(0,1fr)_auto] lg:items-center`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-lg border ${actionStyle(log.action)}`}><ActionIcon action={log.action} /></span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-text-primary">{isAr ? log.action_ar : (log.action_ar || log.action || t('defaultAction'))}</span>
                      <span className="rounded-full border border-[#E5E0D8] bg-[#F8F6F2] px-2 py-1 text-[11px] font-bold text-text-secondary">{finalEntityLabel}</span>
                      {canUndo ? <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">{t('badgeUndo')}</span> : null}
                    </span>
                    <span className="mt-1 block truncate text-sm text-text-secondary">{log.summary || log.path || log.entity_id || '-'}</span>
                    <span className="mt-1 block text-xs text-text-muted" dir="ltr">{log.admin_email || t('defaultAdmin')}</span>
                  </span>
                  <span className="text-xs font-bold text-[#8B8172]">{formatDate(log.created_at, formatLoc)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selected ? (
        <Modal title={isAr ? (selected.action_ar || t('defaultAction')) : (selected.action || selected.action_ar || t('defaultAction'))} onClose={close} closeTitle={tCommon('close')}>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                [t('detailAdmin'), selected.admin_email || t('defaultAdmin')],
                [t('detailSection'), selected.entity_label || (selected.entity_type ? ({
                  'catalog/products': 'المنتجات',
                  'catalog/variants': 'متغيرات المنتجات',
                  'catalog/categories': 'التصنيفات',
                  'catalog/brands': 'العلامات التجارية',
                  'catalog/homepage': 'الواجهة الرئيسية',
                  'orders': 'الطلبات',
                  'customers': 'العملاء',
                  'discounts': 'الخصومات',
                  'exchanges': 'الاستبدال والترجيع',
                  'settings': 'الإعدادات',
                  'loyalty_settings': 'إعدادات الولاء'
                }[selected.entity_type]) : null) || selected.entity_type || '-'],
                [t('detailId'), selected.entity_id || '-'],
                [t('detailTime'), formatDate(selected.created_at, formatLoc)],
                [t('detailPath'), selected.path || '-'],
                [t('detailMethod'), selected.method || t('methodUi')],
                [t('detailResult'), String(selected.status_code ?? '-')],
                [t('detailIp'), selected.ip || '-'],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-[#E5E0D8] bg-background-card p-3">
                  <p className="text-xs font-bold text-[#8B8172]">{label}</p>
                  <p className={`mt-1 break-words text-sm font-black text-text-primary ${label === t('detailPath') || label === t('detailMethod') || label === t('detailIp') || label === t('detailId') ? "text-left" : ""}`} dir="auto">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              <JsonBlock title={t('jsonRequest')} value={selected.request_body} />
              <JsonBlock title={t('jsonBefore')} value={selected.old_values} />
              <JsonBlock title={t('jsonAfter')} value={selected.new_values} />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-[#E5E0D8] bg-background-card p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                <Eye size={16} />
                {selected.undone_at ? t('undoneAt', { date: formatDate(selected.undone_at, formatLoc) }) : selected.undo?.reason || t('noAutoUndo')}
              </div>
              <button
                type="button"
                onClick={() => void undo(selected)}
                disabled={!selected.undo?.possible || Boolean(selected.undone_at) || undoingId === selected.id}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-black text-text-primary hover:bg-[#9A7209] disabled:cursor-not-allowed disabled:bg-[#E5E0D8] disabled:text-text-muted"
              >
                <Undo2 size={16} />
                {undoingId === selected.id ? t('undoing') : selected.undone_at ? t('undone') : t('undoBtn')}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
