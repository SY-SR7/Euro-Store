'use client';

import { Plus, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';

type SubAdmin = {
  user_id: string;
  display_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button type="button" title="إغلاق" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-[#57534E] hover:bg-[#E5E0D8]">
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
    <button type="button" onClick={() => setEditing(true)} dir={dir} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-[#1C1917] transition hover:bg-[#FAF7EF]">
      {value || <span className="text-[#A8A29E]">-</span>}
    </button>
  );
}

function ActivePills({ value, onSave }: { value: boolean; onSave: (value: boolean) => void | Promise<void> }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, l: 'نشط', c: 'border-green-200 bg-green-50 text-green-700' }, { v: false, l: 'معطل', c: 'border-red-200 bg-red-50 text-red-700' }].map((option) => (
        <button key={option.l} type="button" onClick={() => option.v !== value && void onSave(option.v)} className={`rounded-full border px-3 py-1 text-xs font-black ${option.v === value ? option.c : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'}`}>
          {option.l}
        </button>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium' }).format(date);
}

export default function SubAdminsQuickAdmin() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SubAdmin | null>(null);
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
      setMsg('تم الحفظ');
    } catch (error) {
      mergeSubAdmin(previous.user_id, previous);
      setMsg(error instanceof Error ? error.message : 'فشل الحفظ');
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
      setMsg('تم إنشاء الحساب');
      load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'فشل الإنشاء');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">المشرفون</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{subAdmins.length} حساب</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]">
            <RefreshCw size={15} />تحديث
          </button>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-white hover:bg-[#2D2926]">
            <Plus size={15} />مشرف جديد
          </button>
        </div>
      </div>

      {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === 'تم الحفظ' || msg === 'تم إنشاء الحساب' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}

      {showCreate ? (
        <form onSubmit={(event) => void createSubAdmin(event)} className="grid gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm md:grid-cols-3">
          <input value={form.display_name} onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))} placeholder="الاسم" className={inputClass} />
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="email@example.com" type="email" dir="ltr" className={inputClass} />
          <input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="كلمة المرور" type="password" dir="ltr" className={inputClass} />
          <button type="submit" disabled={creating || !form.email.trim() || form.password.length < 8} className="rounded-xl bg-[#B8860B] px-5 py-2 text-sm font-bold text-white disabled:opacity-50 md:col-span-3">
            {creating ? 'جار الإنشاء...' : 'إنشاء'}
          </button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-sm text-[#A8A29E]">جار التحميل...</p>
        : subAdmins.length === 0 ? <p className="p-10 text-center text-sm text-[#A8A29E]">لا توجد حسابات</p>
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>{['الاسم', 'البريد', 'التاريخ', 'الحالة'].map((head, index) => <th key={head} className={`px-5 py-3 text-right text-xs font-black text-[#A8A29E] ${index === 2 ? 'hidden md:table-cell' : ''}`}>{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {subAdmins.map((item) => (
                  <tr key={item.user_id} className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]" onClick={() => { setSelected(item); setMsg(''); }}>
                    <td className="px-5 py-3 font-semibold text-[#1C1917] group-hover:text-[#B8860B]">{item.display_name || '-'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#57534E]" dir="ltr">{item.email}</td>
                    <td className="hidden px-5 py-3 text-xs text-[#A8A29E] md:table-cell">{formatDate(item.created_at)}</td>
                    <td className="px-5 py-3" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => void patchSubAdmin(item, { is_active: !item.is_active })} className={`rounded-full border px-3 py-1 text-xs font-bold ${item.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                        {item.is_active ? 'نشط' : 'معطل'}
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
        <Modal title={selected.display_name || selected.email} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === 'تم الحفظ' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <Field label="الاسم"><InlineText value={selected.display_name ?? ''} onSave={(display_name) => patchSubAdmin(selected, { display_name })} /></Field>
                <Field label="البريد"><InlineText value={selected.email} dir="ltr" onSave={(email) => patchSubAdmin(selected, { email })} /></Field>
                <Field label="الحالة"><ActivePills value={selected.is_active} onSave={(is_active) => patchSubAdmin(selected, { is_active })} /></Field>
                <Field label="تاريخ الإنشاء"><span className="block px-3 py-2 text-sm font-semibold text-[#1C1917]">{formatDate(selected.created_at)}</span></Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
