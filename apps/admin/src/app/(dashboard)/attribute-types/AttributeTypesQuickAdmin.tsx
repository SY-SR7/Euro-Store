'use client';

import { Plus, RefreshCw, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type AttributeValue = {
  id: string;
  value_ar: string;
  value_en: string | null;
  hex_color: string | null;
  sort_order: number;
};

type AttributeType = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  attribute_values: AttributeValue[];
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F0ECE6] bg-background-card px-5 py-4">
          <h2 className="font-black text-text-primary">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F6F2] text-text-secondary hover:bg-[#E5E0D8]">
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

function InlineNumber({ value, onSave }: { value: number; onSave: (value: number) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [editing, value]);

  const commit = () => {
    const next = Number(draft);
    setEditing(false);
    if (Number.isFinite(next) && next !== value) void onSave(next);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') setEditing(false);
        }}
        className={inputClass}
      />
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-bold text-text-primary transition hover:bg-background">
      {value}
    </button>
  );
}

function InlineColor({ value, onSave }: { value?: string | null; onSave: (value: string | null) => void | Promise<void> }) {
  const color = value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(event) => void onSave(event.target.value)}
        className="h-9 w-11 cursor-pointer rounded-lg border border-[#E5E0D8] bg-background-card"
      />
      <InlineText value={value ?? ''} dir="ltr" onSave={(next) => onSave(next || null)} />
    </div>
  );
}

function fallbackSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function ColorDot({ hex }: { hex?: string | null }) {
  return (
    <span className="inline-flex h-4 w-4 shrink-0 rounded-full border border-black/15" style={{ backgroundColor: hex || '#FFFFFF' }} />
  );
}

export default function AttributeTypesQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [types, setTypes] = useState<AttributeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AttributeType | null>(null);
  const [msg, setMsg] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState({ name_ar: '', name_en: '', slug: '' });
  const [newValue, setNewValue] = useState({ value_ar: '', value_en: '', hex_color: '', sort_order: '0' });
  const t = useTranslations('adminCatalog');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<AttributeType[]>('/api/catalog/attribute-types', { cache: 'no-store' })
      .then((data) => setTypes(Array.isArray(data) ? data : []))
      .catch(() => setTypes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openType = useCallback((type: AttributeType, updateUrl = true) => {
    setSelected(type);
    setMsg('');
    setNewValue({ value_ar: '', value_en: '', hex_color: '', sort_order: '0' });
    if (updateUrl) router.replace(`/attribute-types?open=${type.id}`, { scroll: false });
  }, [router]);

  const closeType = () => {
    setSelected(null);
    router.replace('/attribute-types', { scroll: false });
  };

  useEffect(() => {
    const typeId = searchParams.get('open');
    if (!typeId || autoOpenedId === typeId || selected?.id === typeId) return;

    const existing = types.find((type) => type.id === typeId);
    if (existing) {
      openType(existing, false);
      setAutoOpenedId(typeId);
      return;
    }

    fetchJson<AttributeType>(`/api/catalog/attribute-types/${typeId}`)
      .then((type) => {
        setTypes((current) => current.some((item) => item.id === type.id) ? current : [type, ...current]);
        openType(type, false);
        setAutoOpenedId(typeId);
      })
      .catch((error) => setMsg(error instanceof Error ? error.message : tCommon('error', { fallback: 'حدث خطأ' })));
  }, [autoOpenedId, openType, searchParams, selected?.id, types, tCommon]);

  const mergeType = (id: string, patch: Partial<AttributeType>) => {
    setTypes((current) => current.map((type) => (type.id === id ? { ...type, ...patch } : type)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };

  const mergeValue = (typeId: string, valueId: string, patch: Partial<AttributeValue>) => {
    setTypes((current) => current.map((type) => {
      if (type.id !== typeId) return type;
      return { ...type, attribute_values: type.attribute_values.map((value) => (value.id === valueId ? { ...value, ...patch } : value)) };
    }));
    setSelected((current) => {
      if (current?.id !== typeId) return current;
      return { ...current, attribute_values: current.attribute_values.map((value) => (value.id === valueId ? { ...value, ...patch } : value)) };
    });
  };

  const patchType = async (type: AttributeType, patch: Partial<AttributeType>) => {
    const previous = type;
    setMsg('');
    mergeType(type.id, patch);
    try {
      const updated = await fetchJson<AttributeType>(`/api/catalog/attribute-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeType(type.id, { ...updated, attribute_values: updated.attribute_values ?? previous.attribute_values });
      setMsg(t('saveSuccess', { fallback: 'تم الحفظ بنجاح' }));
    } catch (error) {
      mergeType(previous.id, previous);
      setMsg(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const patchValue = async (type: AttributeType, value: AttributeValue, patch: Partial<AttributeValue>) => {
    const previous = value;
    setMsg('');
    mergeValue(type.id, value.id, patch);
    try {
      const updated = await fetchJson<AttributeValue>(`/api/catalog/attribute-values/${value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mergeValue(type.id, value.id, updated);
      setMsg(t('saveSuccess', { fallback: 'تم الحفظ بنجاح' }));
    } catch (error) {
      mergeValue(type.id, previous.id, previous);
      setMsg(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل الحفظ' }));
    }
  };

  const createType = async () => {
    if (!newType.name_ar.trim()) return;
    await fetchJson<AttributeType>('/api/catalog/attribute-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_ar: newType.name_ar.trim(),
        name_en: newType.name_en.trim() || newType.name_ar.trim(),
        slug: newType.slug.trim() || fallbackSlug(newType.name_en || newType.name_ar),
      }),
    });
    setNewType({ name_ar: '', name_en: '', slug: '' });
    setShowCreate(false);
    load();
  };

  const createValue = async (type: AttributeType) => {
    if (!newValue.value_ar.trim()) return;
    const created = await fetchJson<AttributeValue>('/api/catalog/attribute-values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attribute_type_id: type.id,
        value_ar: newValue.value_ar.trim(),
        value_en: newValue.value_en.trim() || newValue.value_ar.trim(),
        hex_color: newValue.hex_color.trim() || null,
        sort_order: Number(newValue.sort_order) || 0,
      }),
    });
    setNewValue({ value_ar: '', value_en: '', hex_color: '', sort_order: '0' });
    mergeType(type.id, { attribute_values: [...(type.attribute_values ?? []), created] });
  };

  const deleteValue = async (type: AttributeType, value: AttributeValue) => {
    if (!confirm(tCommon('confirmDelete', { fallback: 'تأكيد الحذف؟' }))) return;
    await fetchJson<{ ok: boolean }>(`/api/catalog/attribute-values/${value.id}`, { method: 'DELETE' });
    mergeType(type.id, { attribute_values: type.attribute_values.filter((item) => item.id !== value.id) });
  };

  const deleteType = async (type: AttributeType) => {
    if (!confirm(tCommon('confirmDelete', { fallback: 'تأكيد الحذف؟' }))) return;
    await fetchJson<{ deleted: boolean }>(`/api/catalog/attribute-types/${type.id}`, { method: 'DELETE' });
    closeType();
    load();
  };

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{t('attributeTypesTitle', { fallback: 'صفات المنتجات' })}</h1>
          <p className="mt-1 text-sm text-text-muted">{types.length} {tCommon('items', { fallback: 'عنصر' })}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-text-secondary hover:border-primary">
            <RefreshCw size={15} />{tCommon('refresh', { fallback: 'تحديث' })}
          </button>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-black text-text-primary hover:bg-[#2D2926]">
            <Plus size={15} />{t('newAttributeType', { fallback: 'نوع جديد' })}
          </button>
        </div>
      </div>

      {showCreate ? (
        <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <input value={newType.name_ar} onChange={(event) => setNewType((form) => ({ ...form, name_ar: event.target.value }))} placeholder={t('attributeNameAr', { fallback: 'اسم النوع بالعربية' })} className={inputClass} dir={isAr ? "rtl" : "ltr"} />
            <input value={newType.name_en} onChange={(event) => setNewType((form) => ({ ...form, name_en: event.target.value }))} placeholder={t('attributeNameEn', { fallback: 'اسم النوع بالإنجليزية' })} className={inputClass} dir="ltr" />
            <input value={newType.slug} onChange={(event) => setNewType((form) => ({ ...form, slug: event.target.value }))} placeholder={t('attributeSlug', { fallback: 'رابط الصفة' })} className={inputClass} dir="ltr" />
            <button type="button" onClick={() => void createType()} disabled={!newType.name_ar.trim()} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-text-primary disabled:opacity-50">
              {t('saveAttribute', { fallback: 'إضافة' })}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {loading ? <p className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 md:p-10 text-center text-sm text-text-muted xl:col-span-2">{tCommon('loading', { fallback: 'جار التحميل...' })}</p>
        : types.length === 0 ? <p className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 md:p-10 text-center text-sm text-text-muted xl:col-span-2">{t('noAttributes', { fallback: 'لا توجد صفات' })}</p>
        : types.map((type) => (
          <button key={type.id} type="button" onClick={() => openType(type)} className={`rounded-2xl border border-[#E5E0D8] bg-background-card p-5 ${isAr ? "text-right" : "text-left"} shadow-sm transition hover:border-primary hover:bg-[#FFFBF0]`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-text-primary">{isAr ? type.name_ar : (type.name_en || type.name_ar)}</h2>
                <p className="mt-1 font-mono text-xs text-text-muted" dir="ltr">{type.slug}</p>
              </div>
              <span className="rounded-full border border-[#E5E0D8] bg-[#F8F6F2] px-3 py-1 text-xs font-black text-text-secondary">{type.attribute_values?.length ?? 0} {tCommon('items', { fallback: 'قيمة' })}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[...(type.attribute_values ?? [])].sort((a, b) => a.sort_order - b.sort_order).slice(0, 8).map((value) => (
                <span key={value.id} className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0D8] bg-background px-3 py-1 text-xs font-bold text-text-secondary">
                  {type.slug === 'color' ? <ColorDot hex={value.hex_color} /> : null}
                  {isAr ? value.value_ar : (value.value_en || value.value_ar)}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {selected ? (
        <Modal title={isAr ? selected.name_ar : (selected.name_en || selected.name_ar)} onClose={closeType}>
          <div className="space-y-4">
            {msg ? <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${msg === t('saveSuccess', { fallback: 'تم الحفظ بنجاح' }) ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg}</div> : null}

            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
              <div className="space-y-2">
                <Field label={t('attributeNameAr', { fallback: 'الاسم بالعربية' })}><InlineText value={selected.name_ar} dir={isAr ? "rtl" : "ltr"} onSave={(name_ar) => patchType(selected, { name_ar })} /></Field>
                <Field label={t('attributeNameEn', { fallback: 'الاسم بالإنجليزية' })}><InlineText value={selected.name_en} dir="ltr" onSave={(name_en) => patchType(selected, { name_en })} /></Field>
                <Field label={t('attributeSlug', { fallback: 'الرابط' })}><InlineText value={selected.slug} dir="ltr" onSave={(slug) => patchType(selected, { slug })} /></Field>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-text-primary">{t('attributeValues', { fallback: 'القيم' })}</h3>
                <span className="text-xs font-bold text-text-muted">{selected.attribute_values?.length ?? 0}</span>
              </div>

              <div className="space-y-3">
                {[...(selected.attribute_values ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((value) => (
                  <div key={value.id} className="grid gap-2 rounded-xl border border-[#F0ECE6] bg-[#FFFCF7] p-3 md:grid-cols-[1fr_1fr_110px_44px]">
                    <InlineText value={value.value_ar} dir={isAr ? "rtl" : "ltr"} onSave={(value_ar) => patchValue(selected, value, { value_ar })} />
                    <InlineText value={value.value_en ?? ''} dir="ltr" onSave={(value_en) => patchValue(selected, value, { value_en })} />
                    {selected.slug === 'color' ? (
                      <InlineColor value={value.hex_color} onSave={(hex_color) => patchValue(selected, value, { hex_color })} />
                    ) : (
                      <InlineNumber value={value.sort_order} onSave={(sort_order) => patchValue(selected, value, { sort_order })} />
                    )}
                    <button type="button" onClick={() => void deleteValue(selected, value)} className="grid h-9 w-9 place-items-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50">
                      <X size={15} />
                    </button>
                  </div>
                ))}

                <div className="grid gap-2 rounded-xl border border-dashed border-[#D7C7A6] bg-[#FFFBF0] p-3 md:grid-cols-[1fr_1fr_120px_90px]">
                  <input value={newValue.value_ar} onChange={(event) => setNewValue((form) => ({ ...form, value_ar: event.target.value }))} placeholder={t('valueAr', { fallback: 'قيمة جديدة' })} className={inputClass} dir={isAr ? "rtl" : "ltr"} />
                  <input value={newValue.value_en} onChange={(event) => setNewValue((form) => ({ ...form, value_en: event.target.value }))} placeholder={t('valueEn', { fallback: 'English' })} className={inputClass} dir="ltr" />
                  {selected.slug === 'color' ? (
                    <input value={newValue.hex_color} onChange={(event) => setNewValue((form) => ({ ...form, hex_color: event.target.value }))} placeholder="#000000" className={inputClass} dir="ltr" />
                  ) : (
                    <input type="number" value={newValue.sort_order} onChange={(event) => setNewValue((form) => ({ ...form, sort_order: event.target.value }))} placeholder={t('position', { fallback: 'الترتيب' })} className={inputClass} />
                  )}
                  <button type="button" onClick={() => void createValue(selected)} disabled={!newValue.value_ar.trim()} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-50">
                    {t('addValue', { fallback: 'إضافة' })}
                  </button>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => void deleteType(selected)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
              {tCommon('delete', { fallback: 'حذف' })}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
