'use client';

import { RefreshCw, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Customer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  loyalty_points?: number | null;
  referral_code?: string | null;
  is_blocked?: boolean | null;
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

function Modal({ title, onClose, children, closeTitle }: { title: string; onClose: () => void; children: ReactNode; closeTitle?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button
            type="button"
            title={closeTitle || "Close"}
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
    <div className="grid gap-1 border-b border-[#F0ECE6] pb-2 last:border-0 last:pb-0 sm:grid-cols-[125px_minmax(0,1fr)]">
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
  onSave: (value: string) => Promise<void> | void;
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

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(value ?? '');
      setEditing(false);
    }
  };

  if (editing) {
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

function InlineNumber({
  value,
  onSave,
  locale = 'ar-SY'
}: {
  value?: number | null;
  onSave: (value: number) => Promise<void> | void;
  locale?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));

  useEffect(() => {
    if (!editing) setDraft(String(value ?? 0));
  }, [editing, value]);

  const commit = () => {
    const next = Number(draft);
    setEditing(false);
    if (Number.isFinite(next) && next !== (value ?? 0)) void onSave(next);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        dir="ltr"
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(String(value ?? 0));
            setEditing(false);
          }
        }}
        className={inputClass}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-black text-[#B8860B] transition hover:bg-[#FAF7EF]"
    >
      {Number(value ?? 0).toLocaleString(locale)}
    </button>
  );
}

function StatusPills({
  blocked,
  onSave,
  t,
}: {
  blocked: boolean;
  onSave: (blocked: boolean) => Promise<void> | void;
  t: any;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { value: false, label: t('statusActive', { fallback: 'نشط' }), cls: 'border-green-200 bg-green-50 text-green-700' },
        { value: true, label: t('statusBlocked', { fallback: 'محظور' }), cls: 'border-red-200 bg-red-50 text-red-700' },
      ].map((option) => {
        const active = option.value === blocked;
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => {
              if (!active) void onSave(option.value);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-black transition ${
              active ? option.cls : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function CustomersQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isAr = locale === 'ar';
  
  const t = useTranslations('adminCustomers');
  const tCommon = useTranslations('common');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetchJson<Customer[]>(`/api/customers?${params}`, { cache: 'no-store' })
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCustomer = useCallback((customer: Customer, updateUrl = true) => {
    setSelected(customer);
    setMsg('');
    if (updateUrl) router.replace(`/customers?open=${customer.id}`, { scroll: false });
  }, [router]);

  const closeCustomer = () => {
    setSelected(null);
    router.replace('/customers', { scroll: false });
  };

  useEffect(() => {
    const customerId = searchParams.get('open');
    if (!customerId || autoOpenedId === customerId || selected?.id === customerId) return;

    const existing = customers.find((customer) => customer.id === customerId);
    if (existing) {
      openCustomer(existing, false);
      setAutoOpenedId(customerId);
      return;
    }

    fetchJson<Customer>(`/api/customers/${customerId}`)
      .then((customer) => {
        setCustomers((current) => current.some((item) => item.id === customer.id) ? current : [customer, ...current]);
        openCustomer(customer, false);
        setAutoOpenedId(customerId);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : t('failedToOpenCustomer', { fallback: 'تعذر فتح العميل' })));
  }, [autoOpenedId, customers, openCustomer, searchParams, selected?.id, t]);

  const mergeCustomer = (id: string, patch: Partial<Customer>) => {
    setCustomers((current) => current.map((customer) => (customer.id === id ? { ...customer, ...patch } : customer)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const patchCustomer = async (customer: Customer, patch: Partial<Customer>) => {
    const previous = customer;
    setMsg('');
    mergeCustomer(customer.id, patch);
    try {
      const updated = await fetchJson<Customer>(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeCustomer(customer.id, updated);
      setMsg(tCommon('saved', { fallback: 'تم الحفظ' }));
    } catch (error) {
      mergeCustomer(previous.id, previous);
      setMsg(error instanceof Error ? error.message : tCommon('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const setPoints = async (customer: Customer, nextPoints: number) => {
    const currentPoints = Number(customer.loyalty_points ?? 0);
    const delta = Math.max(0, Math.floor(nextPoints)) - currentPoints;
    if (!delta) return;

    const previous = customer;
    const optimistic = { loyalty_points: currentPoints + delta };
    setMsg('');
    mergeCustomer(customer.id, optimistic);
    try {
      const updated = await fetchJson<{ loyalty_points: number }>(`/api/customers/${customer.id}/loyalty`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: delta, reason: t('directEditFromPanel', { fallback: 'تعديل مباشر من لوحة العملاء' }) }),
      });
      mergeCustomer(customer.id, { loyalty_points: updated.loyalty_points });
      setMsg(tCommon('saved', { fallback: 'تم الحفظ' }));
    } catch (error) {
      mergeCustomer(previous.id, previous);
      setMsg(error instanceof Error ? error.message : t('failedToUpdatePoints', { fallback: 'فشل تعديل النقاط' }));
    }
  };

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">{t('customersTitle', { fallback: 'العملاء' })}</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{t('customersCount', { count: customers.length, fallback: `${customers.length} عميل` })}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#57534E] hover:border-[#B8860B]"
        >
          <RefreshCw size={15} />
          {tCommon('refresh', { fallback: 'تحديث' })}
        </button>
      </div>

      <div className="flex overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm focus-within:border-[#B8860B]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={tCommon('searchByNamePhoneEmail', { fallback: 'بحث بالاسم أو الهاتف أو البريد...' })}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
        />
        <div className={`flex w-12 items-center justify-center ${isAr ? "border-l" : "border-r"} border-[#E5E0D8] text-[#8B8172]`}>
          <Search size={17} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">{tCommon('loading', { fallback: 'جار التحميل...' })}</p>
        ) : customers.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">{t('noCustomers', { fallback: 'لا يوجد عملاء' })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {[
                    t('name', { fallback: 'الاسم' }),
                    t('phone', { fallback: 'الهاتف' }),
                    t('points', { fallback: 'النقاط' }),
                    t('status', { fallback: 'الحالة' }),
                    t('registrationDate', { fallback: 'تاريخ التسجيل' })
                  ].map((heading, index) => (
                    <th
                      key={heading}
                      className={`px-5 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-[#A8A29E] ${
                        index === 2 || index === 4 ? 'hidden md:table-cell' : ''
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]"
                    onClick={() => openCustomer(customer)}
                  >
                    <td className="px-5 py-3 font-semibold text-[#1C1917] transition-colors group-hover:text-[#B8860B]">
                      {customer.full_name ?? '—'}
                    </td>
                    <td className={`px-5 py-3 text-[#57534E] ${isAr ? "text-right" : "text-left"}`} dir="ltr">
                      {customer.phone ?? ''}
                    </td>
                    <td className="hidden px-5 py-3 font-bold text-[#B8860B] md:table-cell">
                      {customer.loyalty_points ?? 0}
                    </td>
                    <td className="px-5 py-3" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => void patchCustomer(customer, { is_blocked: !customer.is_blocked })}
                        className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                          customer.is_blocked
                            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-green-50 hover:text-green-700'
                            : 'border-green-200 bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        {customer.is_blocked ? t('statusBlocked', { fallback: 'محظور' }) : t('statusActive', { fallback: 'نشط' })}
                      </button>
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-[#A8A29E] md:table-cell">
                      {new Date(customer.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={selected.full_name ?? t('customerFallback', { fallback: 'عميل' })} onClose={closeCustomer} closeTitle={tCommon('close', { fallback: 'إغلاق' })}>
          <div className="space-y-4">
            {msg ? (
              <div
                className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                  msg === tCommon('saved', { fallback: 'تم الحفظ' })
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {msg}
              </div>
            ) : null}

            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <Field label={t('name', { fallback: 'الاسم' })}>
                  <InlineText
                    value={selected.full_name ?? ''}
                    dir={isAr ? "rtl" : "ltr"}
                    onSave={(value) => patchCustomer(selected, { full_name: value })}
                  />
                </Field>
                <Field label={t('phone', { fallback: 'الهاتف' })}>
                  <InlineText
                    value={selected.phone ?? ''}
                    dir="ltr"
                    onSave={(value) => patchCustomer(selected, { phone: value })}
                  />
                </Field>
                <Field label={t('email', { fallback: 'البريد' })}>
                  <InlineText
                    value={selected.email ?? ''}
                    dir="ltr"
                    onSave={(value) => patchCustomer(selected, { email: value })}
                  />
                </Field>
                <Field label={t('points', { fallback: 'النقاط' })}>
                  <InlineNumber value={selected.loyalty_points ?? 0} onSave={(value) => setPoints(selected, value)} locale={locale === 'ar' ? 'ar-SY' : 'en-US'} />
                </Field>
                <Field label={t('status', { fallback: 'الحالة' })}>
                  <StatusPills
                    blocked={Boolean(selected.is_blocked)}
                    onSave={(blocked) => patchCustomer(selected, { is_blocked: blocked })}
                    t={t}
                  />
                </Field>
                <Field label={t('referralCode', { fallback: 'كود الإحالة' })}>
                  <div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]">
                    {selected.referral_code ?? '—'}
                  </div>
                </Field>
                <Field label={t('registrationDate', { fallback: 'تاريخ التسجيل' })}>
                  <div className="min-h-9 rounded-xl px-3 py-2 text-sm font-semibold text-[#1C1917]">
                    {new Date(selected.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US')}
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
