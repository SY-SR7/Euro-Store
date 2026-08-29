'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Eye, RefreshCw, Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type AuditLog = {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_state: unknown;
  after_state: unknown;
  ip_address: string | null;
  created_at: string;
};

type ResponsePayload = { data: AuditLog[]; total: number; page: number; per_page: number };

function pretty(value: unknown) {
  if (value === null || value === undefined) return '-';
  return JSON.stringify(value, null, 2);
}

export default function AuditLogsQuickAdmin() {
  const t = useTranslations('adminAudit');
  const locale = useLocale();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const perPage = 50;

  const queryString = useCallback((format = 'json') => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage), format });
    if (role) params.set('actor_role', role);
    if (action.trim()) params.set('action', action.trim());
    if (entityType.trim()) params.set('entity_type', entityType.trim());
    if (actorId.trim()) params.set('actor_id', actorId.trim());
    if (dateFrom) params.set('date_from', new Date(`${dateFrom}T00:00:00`).toISOString());
    if (dateTo) params.set('date_to', new Date(`${dateTo}T23:59:59.999`).toISOString());
    return params.toString();
  }, [action, actorId, dateFrom, dateTo, entityType, page, role]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/audit-logs?${queryString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('request_failed');
      const payload = await response.json() as ResponsePayload;
      setLogs(payload.data ?? []);
      setTotal(payload.total ?? 0);
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [queryString, t]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return logs;
    return logs.filter((log) => [log.actor_id, log.actor_role, log.action, log.entity_type, log.entity_id]
      .join(' ').toLowerCase().includes(needle));
  }, [logs, search]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const inputClass = 'h-10 rounded-lg border border-border bg-background-card px-3 text-sm outline-none focus:border-primary';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('savedCount', { count: total.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-GB') })}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/admin/audit-logs?${queryString('csv')}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-bold">
            <Download className="h-4 w-4" /> {t('exportCsv')}
          </a>
          <button type="button" title={t('refresh')} onClick={() => void load()} className="grid h-10 w-10 place-items-center rounded-lg border border-border">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        <label className="relative md:col-span-2">
          <Search className="absolute start-3 top-3 h-4 w-4 text-text-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchCurrentPage')} className={`${inputClass} w-full ps-9`} />
        </label>
        <select aria-label={t('allRoles')} value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className={inputClass}>
          <option value="">{t('allRoles')}</option><option value="admin">Admin</option><option value="sub_admin">Sub-admin</option><option value="helper">Helper</option><option value="partner">Partner</option><option value="customer">Customer</option><option value="system">System</option>
        </select>
        <input value={action} onChange={(event) => setAction(event.target.value)} onBlur={() => setPage(1)} placeholder={t('actionFilter')} className={inputClass} />
        <input value={entityType} onChange={(event) => setEntityType(event.target.value)} onBlur={() => setPage(1)} placeholder={t('entityTypeFilter')} className={inputClass} />
        <input value={actorId} onChange={(event) => setActorId(event.target.value)} onBlur={() => setPage(1)} placeholder={t('actorIdFilter')} dir="ltr" className={inputClass} />
        <input type="date" aria-label={t('dateFrom')} value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className={inputClass} />
        <input type="date" aria-label={t('dateTo')} value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className={inputClass} />
      </div>

      {error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-border bg-background-card">
        <table className="w-full min-w-[900px] text-start text-sm">
          <thead className="bg-background-secondary text-xs text-text-muted"><tr><th className="p-3">{t('time')}</th><th className="p-3">{t('actor')}</th><th className="p-3">{t('role')}</th><th className="p-3">{t('action')}</th><th className="p-3">{t('entity')}</th><th className="p-3">{t('identifier')}</th><th className="w-14 p-3" /></tr></thead>
          <tbody>
            {!loading && visible.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="whitespace-nowrap p-3">{new Date(log.created_at).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-GB')}</td>
                <td className="p-3 font-mono text-xs">{log.actor_id}</td><td className="p-3">{log.actor_role}</td><td className="p-3 font-bold">{log.action}</td><td className="p-3">{log.entity_type}</td><td className="p-3 font-mono text-xs">{log.entity_id ?? '-'}</td>
                <td className="p-3"><button type="button" title={t('details')} onClick={() => setSelected(log)} className="grid h-8 w-8 place-items-center rounded-md border border-border"><Eye className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {!loading && !visible.length && <tr><td colSpan={7} className="p-10 text-center text-text-muted">{t('noResults')}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-border px-4 py-2 disabled:opacity-40">{t('previous')}</button>
        <span>{page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-border px-4 py-2 disabled:opacity-40">{t('next')}</button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-lg bg-background-card p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-black">{t('auditDetails')}</h2><button type="button" title={t('close')} onClick={() => setSelected(null)}><X className="h-5 w-5" /></button></div>
            <dl className="mb-4 grid gap-3 text-sm md:grid-cols-2"><div><dt className="text-text-muted">{t('action')}</dt><dd>{selected.action}</dd></div><div><dt className="text-text-muted">{t('entity')}</dt><dd>{selected.entity_type} / {selected.entity_id ?? '-'}</dd></div><div><dt className="text-text-muted">{t('actor')}</dt><dd className="font-mono">{selected.actor_id}</dd></div><div><dt className="text-text-muted">IP</dt><dd>{selected.ip_address ?? '-'}</dd></div></dl>
            <div className="grid gap-4 md:grid-cols-2"><div><h3 className="mb-2 font-bold">{t('before')}</h3><pre className="max-h-96 overflow-auto rounded-lg bg-background-secondary p-3 text-left text-xs" dir="ltr">{pretty(selected.before_state)}</pre></div><div><h3 className="mb-2 font-bold">{t('after')}</h3><pre className="max-h-96 overflow-auto rounded-lg bg-background-secondary p-3 text-left text-xs" dir="ltr">{pretty(selected.after_state)}</pre></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
