'use client';

import { RefreshCw, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type AddressSnapshot = {
  full_name?: string;
  phone?: string;
  governorate?: string;
  city?: string;
  street?: string;
  address?: string;
  notes?: string | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  unit_price_syp: number;
  total_price_syp: number;
  product_snapshot?: {
    sku?: string;
    name_ar?: string;
    name_en?: string;
    slug?: string;
    price?: number;
  } | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  subtotal_syp?: number;
  discount_syp?: number;
  loyalty_discount_syp?: number;
  shipping_syp?: number;
  total_syp: number;
  notes?: string | null;
  created_at: string;
  address_snapshot: AddressSnapshot | null;
  order_items?: OrderItem[];
};

const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const PAYMENT_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-blue-50 text-blue-700 border-blue-200',
};

const inputClass =
  'w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#1C1917] outline-none transition focus:border-[#B8860B]';

function money(value?: number | null) {
  return `${Number(value || 0).toLocaleString('ar-SY')} ل.س`;
}

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
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-white px-5 py-4">
          <h2 className="font-black text-[#1C1917]">{title}</h2>
          <button
            type="button"
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black text-[#1C1917]">{title}</h3>
      {children}
    </section>
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

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
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

function ChoicePills({
  value,
  labels,
  colors,
  options,
  onSave,
}: {
  value?: string;
  labels: Record<string, string>;
  colors?: Record<string, string>;
  options: string[];
  onSave: (value: string) => Promise<void> | void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              if (!active) void onSave(option);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-black transition ${
              active
                ? colors?.[option] ?? 'border-[#B8860B] bg-[#FFF4D8] text-[#1C1917]'
                : 'border-[#E5E0D8] bg-[#FAF7EF] text-[#8B8172] hover:border-[#B8860B]'
            }`}
          >
            {labels[option] ?? option}
          </button>
        );
      })}
    </div>
  );
}

export default function OrdersQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');

  const t = useTranslations('adminOrders');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    fetchJson<{ orders: Order[]; total: number }>(`/api/orders?${params}`)
      .then((data) => {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const open = useCallback(async (order: Order, updateUrl = true) => {
    setSelected(order);
    setMsg('');
    setDetailLoading(true);
    if (updateUrl) router.replace(`/orders?open=${order.id}`, { scroll: false });
    try {
      const detail = await fetchJson<Order>(`/api/orders/${order.id}`);
      setSelected(detail);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : t('loadFailed', { fallback: 'تعذر تحميل تفاصيل الطلب' }));
    } finally {
      setDetailLoading(false);
    }
  }, [router]);

  const close = () => {
    setSelected(null);
    router.replace('/orders', { scroll: false });
  };

  useEffect(() => {
    const orderId = searchParams.get('open');
    if (!orderId || autoOpenedId === orderId || selected?.id === orderId) return;

    const existing = orders.find((order) => order.id === orderId);
    void open(existing ?? {
      id: orderId,
      order_number: orderId.slice(0, 8),
      status: 'pending',
      total_syp: 0,
      created_at: new Date().toISOString(),
      address_snapshot: null,
    }, false);
    setAutoOpenedId(orderId);
  }, [autoOpenedId, open, orders, searchParams, selected?.id]);

  const mergeOrder = (orderId: string, patch: Partial<Order>) => {
    setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, ...patch } : item)));
    setSelected((current) => (current?.id === orderId ? { ...current, ...patch } : current));
  };

  const patchOrder = async (patch: Record<string, unknown>) => {
    if (!selected) return;
    const previous = selected;
    setMsg('');

    const optimistic: Partial<Order> = {};
    if (typeof patch.status === 'string') optimistic.status = patch.status;
    if (typeof patch.payment_status === 'string') optimistic.payment_status = patch.payment_status;
    if (typeof patch.payment_method === 'string') optimistic.payment_method = patch.payment_method;
    if (typeof patch.notes === 'string' || patch.notes === null) optimistic.notes = patch.notes;
    if (typeof patch.address_snapshot === 'object' && patch.address_snapshot !== null) {
      optimistic.address_snapshot = { ...(selected.address_snapshot ?? {}), ...(patch.address_snapshot as AddressSnapshot) };
    }

    mergeOrder(selected.id, optimistic);

    try {
      const updated = await fetchJson<Order>(`/api/orders/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeOrder(selected.id, updated);
      setMsg(t('savedSuccessfully', { fallback: 'تم الحفظ' }));
    } catch (error) {
      mergeOrder(previous.id, previous);
      setMsg(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const selectedAddress = selected?.address_snapshot ?? {};
  const allowedStatusOptions = selected
    ? Array.from(new Set([selected.status, ...(TRANSITIONS[selected.status] ?? [])]))
    : [];

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917]">{t('ordersTitle', { fallback: 'الطلبات' })}</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">{total} {t('orderCount', { fallback: 'طلب' })}</p>
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

      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex flex-1 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] focus-within:border-[#B8860B]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={tCommon('search', { fallback: 'بحث...' })}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <div className={`flex w-10 items-center justify-center ${isAr ? "border-r" : "border-l"} border-[#E5E0D8] text-[#8B8172]`}>
            <Search size={16} />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] px-3 py-2 text-sm outline-none focus:border-[#B8860B] sm:w-44"
        >
          <option value="">{t('allStatuses', { fallback: 'كل الحالات' })}</option>
          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((key) => (
            <option key={key} value={key}>
              {t(`status.${key}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">{t('loading', { fallback: 'جار التحميل...' })}</p>
        ) : orders.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#A8A29E]">{t('noOrders', { fallback: 'لا توجد طلبات' })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8F6F2]">
                <tr>
                  {[
                    t('tableOrderNumber', { fallback: 'رقم الطلب' }),
                    t('tableCustomer', { fallback: 'العميل' }),
                    t('tableStatus', { fallback: 'الحالة' }),
                    t('tablePayment', { fallback: 'الدفع' }),
                    t('tableTotal', { fallback: 'المجموع' }),
                    t('tableDate', { fallback: 'التاريخ' })
                  ].map((heading, index) => (
                    <th
                      key={heading}
                      className={`px-5 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-[#A8A29E] ${
                        index >= 4 ? 'hidden md:table-cell' : ''
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="group cursor-pointer transition-colors hover:bg-[#FFFBF0]"
                    onClick={() => void open(order)}
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#1C1917] transition-colors group-hover:text-[#B8860B]">
                      {order.order_number}
                    </td>
                    <td className="px-5 py-3 text-[#57534E]">{order.address_snapshot?.full_name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {t(`status.${order.status}`)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${PAYMENT_COLOR[order.payment_status ?? 'pending'] ?? PAYMENT_COLOR.pending}`}>
                        {t(`paymentStatus.${order.payment_status ?? 'pending'}`)}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 font-bold text-[#B8860B] md:table-cell">{money(order.total_syp)}</td>
                    <td className="hidden px-5 py-3 text-xs text-[#A8A29E] md:table-cell">
                      {new Date(order.created_at).toLocaleDateString(isAr ? 'ar-SY' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 25 ? (
              <div className="flex items-center justify-between border-t border-[#F0ECE6] px-5 py-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  {tCommon('previous', { fallback: 'السابق' })}
                </button>
                <span className="text-xs text-[#A8A29E]">{tCommon('page', { fallback: 'صفحة' })} {page} {tCommon('of', { fallback: 'من' })} {Math.ceil(total / 25)}</span>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page * 25 >= total}
                  className="rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  {tCommon('next', { fallback: 'التالي' })}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selected ? (
        <Modal title={`${t('orderModalTitle', { fallback: 'طلب #' })}${selected.order_number}`} onClose={close}>
          {detailLoading ? (
            <div className="h-64 rounded-2xl bg-[#F1E8DA] animate-pulse" />
          ) : (
            <div className="space-y-4">
              {msg ? (
                <div
                  className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                    msg === t('savedSuccessfully', { fallback: 'تم الحفظ' })
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {msg}
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <Section title={t('orderStatusTitle', { fallback: 'حالة الطلب' })}>
                  <div className="space-y-3">
                    <Field label={t('tableStatus', { fallback: 'الحالة' })}>
                      <ChoicePills
                        value={selected.status}
                        labels={{
                          pending: t('status.pending'),
                          confirmed: t('status.confirmed'),
                          processing: t('status.processing'),
                          shipped: t('status.shipped'),
                          delivered: t('status.delivered'),
                          cancelled: t('status.cancelled'),
                        }}
                        colors={STATUS_COLOR}
                        options={allowedStatusOptions}
                        onSave={(value) => patchOrder({ status: value })}
                      />
                    </Field>
                    <Field label={t('paymentStatusTitle', { fallback: 'حالة الدفع' })}>
                      <ChoicePills
                        value={selected.payment_status ?? 'pending'}
                        labels={{
                          pending: t('paymentStatus.pending'),
                          paid: t('paymentStatus.paid'),
                          failed: t('paymentStatus.failed'),
                          refunded: t('paymentStatus.refunded'),
                        }}
                        colors={PAYMENT_COLOR}
                        options={['pending', 'paid', 'failed', 'refunded']}
                        onSave={(value) => patchOrder({ payment_status: value })}
                      />
                    </Field>
                    <Field label={t('paymentMethodTitle', { fallback: 'طريقة الدفع' })}>
                      <ChoicePills
                        value={selected.payment_method ?? 'cash_on_delivery'}
                        labels={{
                          cash_on_delivery: t('paymentMethod.cash_on_delivery'),
                          sham_cash: t('paymentMethod.sham_cash'),
                        }}
                        options={['cash_on_delivery', 'sham_cash']}
                        onSave={(value) => patchOrder({ payment_method: value })}
                      />
                    </Field>
                    <Field label={t('adminNotes', { fallback: 'ملاحظات الإدارة' })}>
                      <InlineText
                        value={selected.notes ?? ''}
                        multiline
                        dir={isAr ? "rtl" : "ltr"}
                        onSave={(value) => patchOrder({ notes: value })}
                      />
                    </Field>
                  </div>
                </Section>

                <Section title={t('shippingDetails', { fallback: 'بيانات التوصيل' })}>
                  <div className="space-y-2">
                    <Field label={t('addressName', { fallback: 'الاسم' })}>
                      <InlineText
                        value={selectedAddress.full_name ?? ''}
                        dir={isAr ? "rtl" : "ltr"}
                        onSave={(value) => patchOrder({ address_snapshot: { full_name: value } })}
                      />
                    </Field>
                    <Field label={t('addressPhone', { fallback: 'الهاتف' })}>
                      <InlineText
                        value={selectedAddress.phone ?? ''}
                        dir="ltr"
                        onSave={(value) => patchOrder({ address_snapshot: { phone: value } })}
                      />
                    </Field>
                    <Field label={t('addressGov', { fallback: 'المحافظة' })}>
                      <InlineText
                        value={selectedAddress.governorate ?? ''}
                        dir={isAr ? "rtl" : "ltr"}
                        onSave={(value) => patchOrder({ address_snapshot: { governorate: value } })}
                      />
                    </Field>
                    <Field label={t('addressCity', { fallback: 'المدينة' })}>
                      <InlineText
                        value={selectedAddress.city ?? ''}
                        dir={isAr ? "rtl" : "ltr"}
                        onSave={(value) => patchOrder({ address_snapshot: { city: value } })}
                      />
                    </Field>
                    <Field label={t('addressStreet', { fallback: 'الشارع' })}>
                      <InlineText
                        value={selectedAddress.street ?? selectedAddress.address ?? ''}
                        multiline
                        dir={isAr ? "rtl" : "ltr"}
                        onSave={(value) => patchOrder({ address_snapshot: { street: value, address: value } })}
                      />
                    </Field>
                  </div>
                </Section>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#E5E0D8] bg-white px-4 py-3">
                  <p className="text-xs font-bold text-[#8B8172]">{t('subtotal', { fallback: 'الجزئي' })}</p>
                  <p className="mt-1 font-black text-[#1C1917]">{money(selected.subtotal_syp)}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E0D8] bg-white px-4 py-3">
                  <p className="text-xs font-bold text-[#8B8172]">{t('discount', { fallback: 'الخصم' })}</p>
                  <p className="mt-1 font-black text-red-600">{money((selected.discount_syp ?? 0) + (selected.loyalty_discount_syp ?? 0))}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E0D8] bg-white px-4 py-3">
                  <p className="text-xs font-bold text-[#8B8172]">{t('shippingCost', { fallback: 'الشحن' })}</p>
                  <p className="mt-1 font-black text-[#1C1917]">{money(selected.shipping_syp)}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E0D8] bg-white px-4 py-3">
                  <p className="text-xs font-bold text-[#8B8172]">{t('totalAmount', { fallback: 'الإجمالي' })}</p>
                  <p className="mt-1 font-black text-[#B8860B]">{money(selected.total_syp)}</p>
                </div>
              </div>

              <Section title={`${t('productsList', { fallback: 'المنتجات' })} (${selected.order_items?.length ?? 0})`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#F8F6F2]">
                      <tr>
                        {[
                          t('tableProduct', { fallback: 'المنتج' }),
                          t('tableSKU', { fallback: 'SKU' }),
                          t('tableQuantity', { fallback: 'الكمية' }),
                          t('tablePrice', { fallback: 'السعر' }),
                          t('tableTotal', { fallback: 'الإجمالي' })
                        ].map((heading) => (
                          <th key={heading} className={`px-4 py-3 ${isAr ? "text-right" : "text-left"} text-xs font-black text-[#A8A29E]`}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE6]">
                      {(selected.order_items ?? []).map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold text-[#1C1917]">
                            {isAr ? (item.product_snapshot?.name_ar ?? '—') : (item.product_snapshot?.name_en || item.product_snapshot?.name_ar || '—')}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[#57534E]">{item.product_snapshot?.sku ?? '—'}</td>
                          <td className="px-4 py-3 text-[#57534E]">{item.quantity}</td>
                          <td className="px-4 py-3 text-[#57534E]">{money(item.unit_price_syp)}</td>
                          <td className="px-4 py-3 font-bold text-[#1C1917]">{money(item.total_price_syp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
