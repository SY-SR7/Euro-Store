'use client';

import { Plus, RefreshCw, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type SubAdmin = {
  user_id: string;
  display_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
};

const inputClass =
  'w-full rounded-xl border border-[#E5E0D8] bg-background-card px-3 py-2 text-sm text-text-primary outline-none transition focus:border-primary';

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

function pickArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'subAdmins', 'sub_admins', 'rows']) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

function Modal({ title, onClose, children, closeTitle }: { title: string; onClose: () => void; children: ReactNode; closeTitle?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-background-card px-5 py-4">
          <h2 className="font-black text-text-primary">{title}</h2>
          <button type="button" title={closeTitle || "Close"} onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-text-secondary hover:bg-[#E5E0D8]">
            <X size={17} />
          </button>
        </div>
        <div className="p-5">{children}</div>
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
}: {
  value?: string | null;
  onSave: (value: string) => void | Promise<void>;
  dir?: 'rtl' | 'ltr';
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
    return (
      <input
        autoFocus
        value={draft}
        dir={dir}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') setEditing(false);
        }}
        className={inputClass}
      />
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-text-primary transition hover:bg-background">
      {value || <span className="text-text-muted">-</span>}
    </button>
  );
}

function ActivePills({ value, onSave, labelActive, labelDisabled }: { value: boolean; onSave: (value: boolean) => void | Promise<void>; labelActive: string; labelDisabled: string }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: labelActive, c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: labelDisabled, c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-background text-[#8B8172] hover:border-primary'}`}>
          {option.l}
        </button>
      ))}
    </div>
  );
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export default function SubAdminsQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('adminSubAdmins');
  const tCommon = useTranslations('common');

  const formatLoc = isAr ? 'ar-SY' : 'en-US';

  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SubAdmin | null>(null);
  const [autoOpenedId, setAutoOpenedId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', display_name: '' });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<unknown>('/api/sub-admins', { cache: 'no-store' })
      .then((payload) => setSubAdmins(pickArray<SubAdmin>(payload)))
      .catch(() => setSubAdmins([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openSubAdmin = useCallback((subAdmin: SubAdmin, updateUrl = true) => {
    setSelected(subAdmin);
    setMsg('');
    if (updateUrl) router.replace(`/sub-admins?open=${subAdmin.user_id}`, { scroll: false });
  }, [router]);

  const closeSubAdmin = () => {
    setSelected(null);
    router.replace('/sub-admins', { scroll: false });
  };

  useEffect(() => {
    const subAdminId = searchParams.get('open');
    if (!subAdminId || autoOpenedId === subAdminId || selected?.user_id === subAdminId) return;

    const existing = subAdmins.find((item) => item.user_id === subAdminId);
    if (existing) {
      openSubAdmin(existing, false);
      setAutoOpenedId(subAdminId);
      return;
    }

    fetchJson<SubAdmin>(`/api/sub-admins/${subAdminId}`)
      .then((subAdmin) => {
        setSubAdmins((current) => current.some((item) => item.user_id === subAdmin.user_id) ? current : [subAdmin, ...current]);
        openSubAdmin(subAdmin, false);
        setAutoOpenedId(subAdminId);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : t('failedToLoadAdmin')));
  }, [autoOpenedId, openSubAdmin, searchParams, selected?.user_id, subAdmins, t]);

  const mergeSubAdmin = (id: string, patch: Partial<SubAdmin>) => {
    setSubAdmins((current) => current.map((item) => (item.user_id === id ? { ...item, ...patch } : item)));
    setSelected((current) => (current?.user_id === id ? { ...current, ...patch } : current));
  };

  const patchSubAdmin = async (subAdmin: SubAdmin, patch: Partial<SubAdmin>) => {
    const previous = subAdmin;
    setMsg('');
    mergeSubAdmin(subAdmin.user_id, patch);
    try {
      const updated = await fetchJson<SubAdmin>(`/api/sub-admins/${subAdmin.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: patch.display_name,
          email: patch.email,
          is_active: patch.is_active,
        }),
      });
      mergeSubAdmin(subAdmin.user_id, updated);
      setMsg(tCommon('saved'));
    } catch (error) {
      mergeSubAdmin(previous.user_id, previous);
      setMsg(error instanceof Error ? error.message : tCommon('saveFailed'));
    }
  };

  const createSubAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email.trim() || form.password.length < 8) return;
    setCreating(true);
    setMsg('');
    try {
      await fetchJson<{ user_id: string }>('/api/sub-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ email: '', password: '', display_name: '' });
      setShowCreate(false);
      setMsg(t('createdSuccessfully'));
      load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : t('creationFailed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('countAccounts', { count: subAdmins.length })}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-text-secondary hover:border-primary">
            <RefreshCw size={15} />{tCommon('refresh')}
          </button>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-text-primary hover:bg-[#2D2926]">
            <Plus size={15} />{t('newSubAdmin')}
          </button>
        </div>
      </div>

      {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === tCommon('saved') || msg === t('createdSuccessfully') ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}

      {showCreate ? (
        <form onSubmit={(event) => void createSubAdmin(event)} className="grid gap-3 rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm md:grid-cols-3">
          <input value={form.display_name} onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))} placeholder={t('formName')} className={inputClass} dir={isAr ? "rtl" : "ltr"} />
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder={t('formEmail')} type="email" dir="ltr" className={inputClass} />
          <input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={t('formPassword')} type="password" dir="ltr" className={inputClass} />
          <button type="submit" disabled={creating || !form.email.trim() || form.password.length < 8} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-text-primary disabled:opacity-50 md:col-span-3">
            {creating ? t('formCreating') : t('formCreate')}
          </button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-background-card shadow-sm">
        {loading ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{tCommon('loading')}</p>
        : subAdmins.length === 0 ? <p className="p-4 md:p-10 text-center text-sm text-text-muted">{t('noAccounts')}</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>{[t('tableHeaderName'), t('tableHeaderEmail'), t('tableHeaderDate'), t('tableHeaderStatus')].map((head, index) => <th key={head} className={`px-5 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-text-muted ${index === 2 ? 'hidden md:table-cell' : ''}`}>{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {subAdmins.map((item) => (
                  <tr key={item.user_id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => openSubAdmin(item)}>
                    <td className="px-5 py-3 font-semibold text-text-primary group-hover:text-primary">{item.display_name || '-'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-text-secondary" dir="ltr">{item.email}</td>
                    <td className="hidden px-5 py-3 text-xs text-text-muted md:table-cell">{formatDate(item.created_at, formatLoc)}</td>
                    <td className="px-5 py-3" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => void patchSubAdmin(item, { is_active: !item.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${item.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                        {item.is_active ? t('statusActive') : t('statusDisabled')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={selected.display_name || selected.email} onClose={closeSubAdmin} closeTitle={tCommon('close')}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === tCommon('saved') ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
              <div className="space-y-2">
                <Field label={t('fieldName')}><InlineText value={selected.display_name ?? ''} dir={isAr ? "rtl" : "ltr"} onSave={(display_name) => patchSubAdmin(selected, { display_name })} /></Field>
                <Field label={t('fieldEmail')}><InlineText value={selected.email} dir="ltr" onSave={(email) => patchSubAdmin(selected, { email })} /></Field>
                <Field label={t('fieldStatus')}><ActivePills value={selected.is_active} labelActive={t('statusActive')} labelDisabled={t('statusDisabled')} onSave={(is_active) => patchSubAdmin(selected, { is_active })} /></Field>
                <Field label={t('fieldCreatedAt')}><span className="block px-3 py-2 text-sm font-semibold text-text-primary">{formatDate(selected.created_at, formatLoc)}</span></Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
