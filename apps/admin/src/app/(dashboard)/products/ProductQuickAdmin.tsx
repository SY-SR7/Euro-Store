'use client';

import {
  ImagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Product = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  is_featured: boolean;
  is_active: boolean;
  category_id?: string | null;
  brand_id?: string | null;
  created_at?: string;
  image_url?: string | null;
  minPrice?: number;
};

type ProductDetails = Product & {
  description_ar?: string | null;
  description_en?: string | null;
};

type Category = {
  id: string;
  name_ar: string;
  name_en?: string | null;
  slug: string;
  count?: number;
};

type Brand = {
  id: string;
  name: string;
  slug: string;
  count?: number;
};

type AttrValue = {
  id: string;
  slug?: string;
  value_ar: string;
  value_en: string;
  hex_color?: string | null;
  count?: number;
  selected?: boolean;
  sort_order?: number | null;
};

type AttrType = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  values?: AttrValue[];
  attribute_values?: AttrValue[];
};

type VariantAttribute = {
  attribute_value_id: string;
  attribute_values?: (AttrValue & {
    attribute_types?: {
      id?: string;
      name_ar?: string;
      name_en?: string;
      slug?: string;
    } | null;
  }) | null;
};

type ProductVariant = {
  id: string;
  product_id?: string;
  sku: string;
  price_syp: number;
  compare_price_syp: number | null;
  stock_quantity: number;
  weight_grams?: number | null;
  is_active: boolean;
  variant_attributes?: VariantAttribute[];
};

type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_ar?: string | null;
  is_primary: boolean;
  sort_order: number;
};

type FilterData = {
  products: Product[];
  total: number;
  facets: {
    categories: Category[];
    brands: Brand[];
    attributes: AttrType[];
    priceRange: { min: number; max: number };
  };
};

type SelectOption = { value: string; label: string };

const inputClass =
  'w-full rounded-xl border border-[#E5E0D8] bg-background-card px-3 py-2 text-sm text-text-primary outline-none transition focus:border-primary';

function formatSYP(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString('ar-SY')} ل.س`;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFCF7] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#EFE7DA] bg-background-card px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-text-primary">{title}</h2>
            {subtitle ? <p className="truncate text-xs text-[#8B8172]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[#E5E0D8] bg-background text-text-secondary transition hover:border-primary hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E0D8] bg-background-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-text-primary">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-[#F0ECE6] pb-2 last:border-0 last:pb-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
      <span className="text-xs font-bold text-[#8B8172]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function InlineText({
  value,
  onSave,
  placeholder = '—',
  dir = 'rtl',
  multiline = false,
}: {
  value?: string | null;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
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
          rows={4}
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
      className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-text-primary transition hover:bg-background focus:bg-background focus:outline-none"
    >
      {value?.trim() ? value : <span className="text-text-muted">{placeholder}</span>}
    </button>
  );
}

function InlineNumber({
  value,
  onSave,
  allowNull = false,
}: {
  value?: number | null;
  onSave: (value: number | null) => Promise<void> | void;
  allowNull?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value == null ? '' : String(value));

  useEffect(() => {
    if (!editing) setDraft(value == null ? '' : String(value));
  }, [editing, value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed && allowNull) {
      setEditing(false);
      if (value !== null) void onSave(null);
      return;
    }

    const next = Number(trimmed);
    setEditing(false);
    if (Number.isFinite(next) && next !== (value ?? null)) void onSave(next);
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
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(value == null ? '' : String(value));
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
      className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-bold text-text-primary transition hover:bg-background"
    >
      {value == null ? <span className="text-text-muted">—</span> : Number(value).toLocaleString('ar-SY')}
    </button>
  );
}

function InlineSelect({
  value,
  options,
  onSave,
  emptyLabel = '—',
}: {
  value?: string | null;
  options: SelectOption[];
  onSave: (value: string | null) => Promise<void> | void;
  emptyLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const currentLabel = options.find((option) => option.value === (value ?? ''))?.label ?? emptyLabel;

  if (editing) {
    return (
      <select
        autoFocus
        value={value ?? ''}
        onBlur={() => setEditing(false)}
        onChange={(event) => {
          const next = event.target.value || null;
          setEditing(false);
          if (next !== (value ?? null)) void onSave(next);
        }}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="min-h-9 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-text-primary transition hover:bg-background"
    >
      {currentLabel}
    </button>
  );
}

function ChoicePills<T extends string | boolean>({
  value,
  options,
  onSave,
}: {
  value: T;
  options: { value: T; label: string; activeClass: string }[];
  onSave: (value: T) => Promise<void> | void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => {
              if (!active) void onSave(option.value);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-black transition ${
              active
                ? option.activeClass
                : 'border-[#E5E0D8] bg-background text-[#8B8172] hover:border-primary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-[#EFE7DA] pt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="mb-2 flex w-full items-center justify-between text-xs font-black uppercase text-[#8B8172] transition hover:text-text-primary"
      >
        {title}
        <span className="text-base leading-none">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="space-y-1">{children}</div> : null}
    </div>
  );
}

function CheckItem({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-background-card">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-[#B8860B]"
      />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-text-primary">{label}</span>
      <span className="text-[10px] tabular-nums text-[#8B8172]">{count}</span>
    </label>
  );
}

function ColorDot({ hex, size = 12 }: { hex?: string | null; size?: number }) {
  if (!hex) return null;

  return (
    <span
      className="inline-block flex-none rounded-full border border-black/15"
      style={{ width: size, height: size, backgroundColor: hex }}
    />
  );
}

function getAttrValues(type: AttrType) {
  return [...(type.attribute_values ?? type.values ?? [])].sort(
    (a, b) => asNumber(a.sort_order) - asNumber(b.sort_order),
  );
}

function getVariantAttrIds(variant: ProductVariant) {
  return (variant.variant_attributes ?? [])
    .map((item) => item.attribute_value_id)
    .filter(Boolean);
}

function getVariantLabel(variant: ProductVariant) {
  const attrs = (variant.variant_attributes ?? [])
    .map((item) => item.attribute_values)
    .filter((item): item is NonNullable<VariantAttribute['attribute_values']> => Boolean(item))
    .sort((a, b) => {
      const order: Record<string, number> = { color: 0, size: 1 };
      return (order[a.attribute_types?.slug ?? ''] ?? 9) - (order[b.attribute_types?.slug ?? ''] ?? 9);
    });

  return attrs.length ? attrs.map((attr) => attr.value_ar).join(' / ') : variant.sku;
}

export default function ProductQuickAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);

  const [selected, setSelected] = useState<Product | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [attrTypes, setAttrTypes] = useState<AttrType[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [savingKey, setSavingKey] = useState('');
  const [autoOpenedId, setAutoOpenedId] = useState('');

  const t = useTranslations('adminCatalog');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({
    sku: '',
    price_syp: '',
    compare_price_syp: '',
    stock_quantity: '0',
    weight_grams: '',
    is_active: true,
  });
  const [newVariantAttrIds, setNewVariantAttrIds] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [selCats, setSelCats] = useState<string[]>([]);
  const [selBrands, setSelBrands] = useState<string[]>([]);
  const [selAttrs, setSelAttrs] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categoryOptions = useMemo(
    () => [{ value: '', label: t('uncategorized', { fallback: 'بدون تصنيف' }) }, ...allCategories.map((c) => ({ value: c.id, label: isAr ? c.name_ar : (c.name_en || c.name_ar) }))],
    [allCategories, isAr, t],
  );

  const brandOptions = useMemo(
    () => [{ value: '', label: t('unbranded', { fallback: 'بدون ماركة' }) }, ...allBrands.map((b) => ({ value: b.id, label: b.name }))],
    [allBrands, t],
  );

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (selCats.length) params.set('categories', selCats.join(','));
    if (selBrands.length) params.set('brands', selBrands.join(','));
    if (selAttrs.length) params.set('attrs', selAttrs.join(','));
    if (priceMin !== null) params.set('minPrice', String(priceMin));
    if (priceMax !== null) params.set('maxPrice', String(priceMax));
    if (search.trim()) params.set('q', search.trim());
    if (status !== 'all') params.set('status', status);
    return params.toString();
  }, [selCats, selBrands, selAttrs, priceMin, priceMax, search, status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const [fd, cats, brands] = await Promise.all([
        fetchJson<FilterData>(`/api/catalog/products/filters?${query}`),
        fetchJson<Category[]>('/api/catalog/categories'),
        fetchJson<Brand[]>('/api/catalog/brands'),
      ]);
      setFilterData(fd);
      setAllCategories(Array.isArray(cats) ? cats : []);
      setAllBrands(Array.isArray(brands) ? brands : []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('loadFailed', { fallback: 'تعذر تحميل المنتجات' }));
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadProductBundle = useCallback(async (productId: string, quiet = false) => {
    if (!quiet) setModalLoading(true);
    try {
      const [product, variantPayload, imagePayload, attrPayload] = await Promise.all([
        fetchJson<ProductDetails>(`/api/catalog/products/${productId}`),
        fetchJson<ProductVariant[] | { data?: ProductVariant[] }>(`/api/catalog/variants?product_id=${productId}`),
        fetchJson<ProductImage[] | { data?: ProductImage[] }>(`/api/catalog/images?product_id=${productId}`),
        fetchJson<AttrType[]>('/api/catalog/attribute-types'),
      ]);

      const nextVariants = Array.isArray(variantPayload) ? variantPayload : variantPayload.data ?? [];
      const nextImages = Array.isArray(imagePayload) ? imagePayload : imagePayload.data ?? [];

      setProductDetails(product);
      setVariants(nextVariants);
      setImages(nextImages);
      setAttrTypes(Array.isArray(attrPayload) ? attrPayload : []);
      setSelected((current) => (current?.id === product.id ? { ...current, ...product } : current));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('loadFailed', { fallback: 'تعذر تحميل تفاصيل المنتج' }));
    } finally {
      if (!quiet) setModalLoading(false);
    }
  }, []);

  const toggleFilter = (list: string[], item: string, setter: (value: string[]) => void) => {
    setter(list.includes(item) ? list.filter((current) => current !== item) : [...list, item]);
  };

  const clearAll = () => {
    setSelCats([]);
    setSelBrands([]);
    setSelAttrs([]);
    setPriceMin(null);
    setPriceMax(null);
    setSearch('');
    setStatus('all');
  };

  const openProduct = useCallback((product: Product, updateUrl = true) => {
    setSelected(product);
    setProductDetails(null);
    setVariants([]);
    setImages([]);
    setShowAddVariant(false);
    setNewImageUrl('');
    setNotice('');
    if (updateUrl) router.replace(`/products?open=${product.id}`, { scroll: false });
    void loadProductBundle(product.id);
  }, [loadProductBundle, router]);

  const closeProduct = () => {
    setSelected(null);
    setProductDetails(null);
    setVariants([]);
    setImages([]);
    setShowAddVariant(false);
    setNewImageUrl('');
    router.replace('/products', { scroll: false });
  };

  useEffect(() => {
    const productId = searchParams.get('open');
    if (!productId || autoOpenedId === productId || selected?.id === productId) return;

    const existing = filterData?.products.find((product) => product.id === productId);
    openProduct(existing ?? {
      id: productId,
      name_ar: t('loading', { fallback: 'جار تحميل المنتج...' }),
      name_en: '',
      slug: '',
      is_active: false,
      is_featured: false,
    }, false);
    setAutoOpenedId(productId);
  }, [autoOpenedId, filterData?.products, openProduct, searchParams, selected?.id]);

  const updateListProduct = (productId: string, patch: Partial<Product>) => {
    setFilterData((current) =>
      current
        ? {
            ...current,
            products: current.products.map((product) =>
              product.id === productId ? { ...product, ...patch } : product,
            ),
          }
        : current,
    );
  };

  const patchProduct = async (patch: Partial<ProductDetails>) => {
    const productId = productDetails?.id ?? selected?.id;
    if (!productId) return;

    const previousDetails = productDetails;
    const previousSelected = selected;
    setSavingKey(`product:${Object.keys(patch).join(',')}`);
    setNotice('');
    setProductDetails((current) => (current ? { ...current, ...patch } : current));
    setSelected((current) => (current ? { ...current, ...patch } : current));
    updateListProduct(productId, patch);

    try {
      const updated = await fetchJson<ProductDetails>(`/api/catalog/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      setProductDetails((current) => (current ? { ...current, ...updated } : updated));
      setSelected((current) => (current ? { ...current, ...updated } : current));
      updateListProduct(productId, updated);
      void load();
    } catch (error) {
      setProductDetails(previousDetails);
      setSelected(previousSelected);
      if (previousSelected) updateListProduct(productId, previousSelected);
      setNotice(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل حفظ المنتج' }));
    } finally {
      setSavingKey('');
    }
  };

  const patchVariant = async (
    variant: ProductVariant,
    patch: Partial<ProductVariant>,
    attributeValueIds?: string[],
  ) => {
    const previous = variants;
    const body: Record<string, unknown> = { ...patch };
    if (attributeValueIds) body.attribute_value_ids = attributeValueIds;

    setSavingKey(`variant:${variant.id}`);
    setNotice('');
    setVariants((current) => current.map((item) => (item.id === variant.id ? { ...item, ...patch } : item)));

    try {
      await fetchJson<ProductVariant>(`/api/catalog/variants/${variant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (selected) await loadProductBundle(selected.id, true);
      void load();
    } catch (error) {
      setVariants(previous);
      setNotice(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل حفظ الخيار' }));
    } finally {
      setSavingKey('');
    }
  };

  const createVariant = async () => {
    if (!selected || !newVariant.sku.trim() || !newVariant.price_syp.trim()) return;

    setSavingKey('variant:new');
    setNotice('');

    const body: Record<string, unknown> = {
      product_id: selected.id,
      sku: newVariant.sku.trim(),
      price_syp: Number(newVariant.price_syp),
      stock_quantity: Number(newVariant.stock_quantity || 0),
      is_active: newVariant.is_active,
      attribute_value_ids: newVariantAttrIds,
    };

    if (newVariant.compare_price_syp.trim()) body.compare_price_syp = Number(newVariant.compare_price_syp);
    if (newVariant.weight_grams.trim()) body.weight_grams = Number(newVariant.weight_grams);

    try {
      await fetchJson<{ id: string }>('/api/catalog/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setNewVariant({
        sku: '',
        price_syp: '',
        compare_price_syp: '',
        stock_quantity: '0',
        weight_grams: '',
        is_active: true,
      });
      setNewVariantAttrIds([]);
      setShowAddVariant(false);
      await loadProductBundle(selected.id, true);
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل إضافة الخيار' }));
    } finally {
      setSavingKey('');
    }
  };

  const deleteVariant = async (variant: ProductVariant) => {
    if (!confirm(tCommon('confirmDelete', { fallback: 'تأكيد الحذف؟' })) || !selected) return;

    const previous = variants;
    setSavingKey(`variant:${variant.id}:delete`);
    setVariants((current) => current.filter((item) => item.id !== variant.id));

    try {
      await fetchJson<{ ok: boolean }>(`/api/catalog/variants/${variant.id}`, { method: 'DELETE' });
      await loadProductBundle(selected.id, true);
      void load();
    } catch (error) {
      setVariants(previous);
      setNotice(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل حذف الخيار' }));
    } finally {
      setSavingKey('');
    }
  };

  const setVariantAttributeValue = (variant: ProductVariant, type: AttrType, valueId: string) => {
    const valuesOfType = new Set(getAttrValues(type).map((value) => value.id));
    const current = getVariantAttrIds(variant);
    const alreadySelected = current.includes(valueId);
    const next = alreadySelected
      ? current.filter((id) => id !== valueId)
      : [...current.filter((id) => !valuesOfType.has(id)), valueId];

    void patchVariant(variant, {}, next);
  };

  const setNewVariantAttributeValue = (type: AttrType, valueId: string) => {
    const valuesOfType = new Set(getAttrValues(type).map((value) => value.id));
    setNewVariantAttrIds((current) =>
      current.includes(valueId)
        ? current.filter((id) => id !== valueId)
        : [...current.filter((id) => !valuesOfType.has(id)), valueId],
    );
  };

  const patchImage = async (image: ProductImage, patch: Partial<ProductImage>) => {
    if (!selected) return;

    const previous = images;
    setSavingKey(`image:${image.id}`);
    setNotice('');

    setImages((current) =>
      current.map((item) =>
        item.id === image.id
          ? { ...item, ...patch }
          : patch.is_primary
            ? { ...item, is_primary: false }
            : item,
      ),
    );

    try {
      await fetchJson<ProductImage>(`/api/catalog/images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, product_id: selected.id }),
      });
      await loadProductBundle(selected.id, true);
      void load();
    } catch (error) {
      setImages(previous);
      setNotice(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل حفظ الصورة' }));
    } finally {
      setSavingKey('');
    }
  };

  const addImage = async () => {
    if (!selected || !newImageUrl.trim()) return;

    setSavingKey('image:new');
    setNotice('');

    try {
      await fetchJson<{ id: string }>('/api/catalog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selected.id,
          url: newImageUrl.trim(),
          is_primary: images.length === 0,
        }),
      });
      setNewImageUrl('');
      await loadProductBundle(selected.id, true);
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل إضافة الصورة' }));
    } finally {
      setSavingKey('');
    }
  };

  const deleteImage = async (image: ProductImage) => {
    if (!confirm(tCommon('confirmDelete', { fallback: 'تأكيد الحذف؟' })) || !selected) return;

    const previous = images;
    setSavingKey(`image:${image.id}:delete`);
    setImages((current) => current.filter((item) => item.id !== image.id));

    try {
      await fetchJson<{ ok: boolean }>(`/api/catalog/images/${image.id}`, { method: 'DELETE' });
      await loadProductBundle(selected.id, true);
      void load();
    } catch (error) {
      setImages(previous);
      setNotice(error instanceof Error ? error.message : t('saveFailed', { fallback: 'فشل حذف الصورة' }));
    } finally {
      setSavingKey('');
    }
  };

  const products = filterData?.products ?? [];
  const facets = filterData?.facets;
  const activeProduct = productDetails ?? selected;
  const primaryImage =
    images.find((image) => image.is_primary) ?? images.slice().sort((a, b) => a.sort_order - b.sort_order)[0];
  const totalStock = variants.reduce((sum, variant) => sum + asNumber(variant.stock_quantity), 0);
  const minPrice = variants.length
    ? Math.min(...variants.map((variant) => asNumber(variant.price_syp)).filter((price) => price >= 0))
    : 0;

  return (
    <div className="flex h-full gap-0" dir={isAr ? "rtl" : "ltr"}>
      {sidebarOpen ? (
        <aside className={`flex-none w-60 space-y-3 overflow-y-auto ${isAr ? "border-l" : "border-r"} border-[#EFE7DA] bg-background p-4`}>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-black text-[#8B8172]">
              <SlidersHorizontal size={14} />
              {tCommon('filters', { fallback: 'الفلاتر' })}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full px-2 py-1 text-[11px] font-black text-primary transition hover:bg-background-card"
            >
              {tCommon('clear', { fallback: 'مسح' })}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1">
            {(
              [
                ['all', tCommon('all', { fallback: 'الكل' })],
                ['active', t('active', { fallback: 'نشط' })],
                ['inactive', t('inactive', { fallback: 'معطّل' })],
                ['featured', t('featured', { fallback: 'مميز' })],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={`rounded-xl border px-2 py-2 text-xs font-black transition ${
                  status === key
                    ? 'border-primary bg-background-card text-text-primary'
                    : 'border-transparent text-[#8B8172] hover:bg-background-card'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {facets && facets.categories.length > 0 ? (
            <FilterSection title={t('categories', { fallback: 'التصنيفات' })}>
              {facets.categories.map((category) => (
                <CheckItem
                  key={category.id}
                  label={category.name_ar}
                  count={category.count ?? 0}
                  checked={selCats.includes(category.slug)}
                  onChange={() => toggleFilter(selCats, category.slug, setSelCats)}
                />
              ))}
            </FilterSection>
          ) : null}

          {facets && facets.brands.length > 0 ? (
            <FilterSection title={t('brands', { fallback: 'الماركات' })}>
              {facets.brands.map((brand) => (
                <CheckItem
                  key={brand.id}
                  label={brand.name}
                  count={brand.count ?? 0}
                  checked={selBrands.includes(brand.slug)}
                  onChange={() => toggleFilter(selBrands, brand.slug, setSelBrands)}
                />
              ))}
            </FilterSection>
          ) : null}

          {facets?.attributes.map((type) => (
            <FilterSection key={type.id} title={isAr ? type.name_ar : (type.name_en || type.name_ar)} defaultOpen={false}>
              <div className={type.slug === 'color' ? 'flex flex-wrap gap-1.5 p-1' : 'space-y-0.5'}>
                {getAttrValues(type).map((value) => {
                  const attrKey = `${type.slug}:${value.slug ?? value.id}`;
                  const checked =
                    selAttrs.includes(attrKey) || selAttrs.includes(`${type.slug}:${value.id}`);

                  if (type.slug === 'color' && value.hex_color) {
                    return (
                      <button
                        key={value.id}
                        type="button"
                        title={`${value.value_ar} (${value.count ?? 0})`}
                        onClick={() => toggleFilter(selAttrs, attrKey, setSelAttrs)}
                        className={`h-6 w-6 rounded-full border-2 transition ${
                          checked ? 'scale-110 border-[#1C1917]' : 'border-white shadow-sm'
                        }`}
                        style={{ backgroundColor: value.hex_color }}
                      />
                    );
                  }

                  return (
                    <CheckItem
                      key={value.id}
                      label={value.value_ar}
                      count={value.count ?? 0}
                      checked={checked}
                      onChange={() => toggleFilter(selAttrs, attrKey, setSelAttrs)}
                    />
                  );
                })}
              </div>
            </FilterSection>
          ))}

          {facets && facets.priceRange.max > 0 ? (
            <FilterSection title={t('price', { fallback: 'السعر' })} defaultOpen={false}>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    value={priceMin ?? ''}
                    onChange={(event) =>
                      setPriceMin(event.target.value ? Number(event.target.value) : null)
                    }
                    placeholder={t('from', { fallback: 'من' })}
                    className="min-w-0 rounded-lg border border-[#E5E0D8] px-2 py-1 text-[11px] outline-none focus:border-primary"
                    dir="ltr"
                  />
                  <input
                    type="number"
                    value={priceMax ?? ''}
                    onChange={(event) =>
                      setPriceMax(event.target.value ? Number(event.target.value) : null)
                    }
                    placeholder={t('to', { fallback: 'إلى' })}
                    className="min-w-0 rounded-lg border border-[#E5E0D8] px-2 py-1 text-[11px] outline-none focus:border-primary"
                    dir="ltr"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-[#8B8172]">
                  <span>{formatSYP(facets.priceRange.min)}</span>
                  <span>{formatSYP(facets.priceRange.max)}</span>
                </div>
              </div>
            </FilterSection>
          ) : null}
        </aside>
      ) : null}

      <div className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              title={sidebarOpen ? tCommon('hideFilters', { fallback: 'إخفاء الفلاتر' }) : tCommon('showFilters', { fallback: 'إظهار الفلاتر' })}
              onClick={() => setSidebarOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E0D8] bg-background-card text-text-secondary transition hover:border-primary"
            >
              <SlidersHorizontal size={17} />
            </button>
            <h1 className="text-xl font-black text-text-primary">
              {t('productsTitle', { fallback: 'المنتجات' })}
              {filterData ? (
                <span className="mr-2 text-sm font-semibold text-[#8B8172]">({filterData.total})</span>
              ) : null}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void load();
              }}
              className="flex overflow-hidden rounded-xl border border-[#E5E0D8] bg-background-card focus-within:border-primary"
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tCommon('search', { fallback: 'بحث...' })}
                className="min-w-[180px] bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                title={tCommon('search', { fallback: 'بحث' })}
                className={`flex w-10 items-center justify-center ${isAr ? "border-r" : "border-l"} border-[#E5E0D8] text-text-secondary transition hover:bg-background hover:text-text-primary`}
              >
                <Search size={16} />
              </button>
            </form>
            <Link
              href="/products/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1C1917] px-4 text-sm font-black text-white transition hover:bg-[#2D2926]"
            >
              <Plus size={16} />
              {t('newProduct', { fallback: 'منتج جديد' })}
            </Link>
          </div>
        </div>

        {notice && !selected ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-44 rounded-2xl bg-[#F1E8DA] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-14 text-center text-[#8B8172]">
            <p className="text-lg font-black">{t('noProducts', { fallback: 'لا توجد منتجات' })}</p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-3 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-bold text-primary hover:bg-background"
            >
              {t('clearFilters', { fallback: 'مسح الفلاتر' })}
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => openProduct(product)}
                className="group flex min-h-48 flex-col rounded-2xl border border-[#E5E0D8] bg-background-card p-3 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <div className="mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F1E8DA]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={isAr ? product.name_ar : (product.name_en || product.name_ar)}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-text-muted">
                      {t('noImage', { fallback: 'لا توجد صورة' })}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-text-primary">{isAr ? product.name_ar : (product.name_en || product.name_ar)}</p>
                  <p className="truncate text-xs text-[#8B8172]">{isAr ? product.name_en : product.name_ar}</p>
                  {product.minPrice ? (
                    <p className="mt-1 text-xs font-black text-primary">{formatSYP(product.minPrice)}</p>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      product.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {product.is_active ? t('active', { fallback: 'نشط' }) : t('inactive', { fallback: 'معطّل' })}
                  </span>
                  {product.is_featured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                      <Star size={10} fill="currentColor" />
                      {t('featured', { fallback: 'مميز' })}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeProduct ? (
        <Modal title={isAr ? (activeProduct.name_ar || t('productTitle', { fallback: 'منتج' })) : (activeProduct.name_en || activeProduct.name_ar || t('productTitle', { fallback: 'منتج' }))} subtitle={activeProduct.slug} onClose={closeProduct}>
          {modalLoading ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <div className="h-80 rounded-2xl bg-[#F1E8DA] animate-pulse" />
              <div className="h-80 rounded-2xl bg-[#F1E8DA] animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              {notice ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {notice}
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
                <Section title={t('quickImages', { fallback: 'الصور السريعة' })}>
                  <div className="overflow-hidden rounded-2xl border border-[#EFE7DA] bg-[#F8F3EA]">
                    {primaryImage ? (
                      <img
                        src={primaryImage.url}
                        alt={primaryImage.alt_ar ?? (isAr ? activeProduct.name_ar : (activeProduct.name_en || activeProduct.name_ar))}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center text-sm font-bold text-[#8B8172]">
                        {t('noImage', { fallback: 'لا توجد صورة' })}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {images.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        title={t('setAsPrimary', { fallback: 'تعيين كصورة رئيسية' })}
                        onClick={() => {
                          if (!image.is_primary) void patchImage(image, { is_primary: true });
                        }}
                        className={`relative overflow-hidden rounded-xl border-2 bg-[#F8F3EA] transition ${
                          image.is_primary ? 'border-primary' : 'border-[#E5E0D8] hover:border-primary'
                        }`}
                      >
                        <img src={image.url} alt={image.alt_ar ?? ''} className="aspect-square w-full object-cover" />
                        {image.is_primary ? (
                          <span className={`absolute ${isAr ? "right-1" : "left-1"} top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black text-text-primary`}>
                            {t('primary', { fallback: 'رئيسية' })}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title={t('productDetails', { fallback: 'بيانات المنتج' })}>
                  <div className="space-y-2">
                    <Field label={t('productNameAr', { fallback: 'الاسم العربي' })}>
                      <InlineText value={activeProduct.name_ar} dir={isAr ? "rtl" : "ltr"} onSave={(value) => patchProduct({ name_ar: value })} />
                    </Field>
                    <Field label={t('productNameEn', { fallback: 'الاسم الإنجليزي' })}>
                      <InlineText
                        value={activeProduct.name_en}
                        dir="ltr"
                        onSave={(value) => patchProduct({ name_en: value })}
                      />
                    </Field>
                    <Field label={t('productSlug', { fallback: 'الرابط' })}>
                      <InlineText
                        value={activeProduct.slug}
                        dir="ltr"
                        onSave={(value) => patchProduct({ slug: value })}
                      />
                    </Field>
                    <Field label={t('category', { fallback: 'التصنيف' })}>
                      <InlineSelect
                        value={activeProduct.category_id ?? ''}
                        options={categoryOptions}
                        onSave={(value) => patchProduct({ category_id: value })}
                      />
                    </Field>
                    <Field label={t('brand', { fallback: 'الماركة' })}>
                      <InlineSelect
                        value={activeProduct.brand_id ?? ''}
                        options={brandOptions}
                        onSave={(value) => patchProduct({ brand_id: value })}
                      />
                    </Field>
                    <Field label={t('descriptionAr', { fallback: 'الوصف العربي' })}>
                      <InlineText
                        value={productDetails?.description_ar ?? ''}
                        multiline
                        dir={isAr ? "rtl" : "ltr"}
                        onSave={(value) => patchProduct({ description_ar: value })}
                      />
                    </Field>
                    <Field label={t('descriptionEn', { fallback: 'الوصف الإنجليزي' })}>
                      <InlineText
                        value={productDetails?.description_en ?? ''}
                        dir="ltr"
                        multiline
                        onSave={(value) => patchProduct({ description_en: value })}
                      />
                    </Field>
                    <Field label={t('visibility', { fallback: 'النشر' })}>
                      <ChoicePills
                        value={Boolean(activeProduct.is_active)}
                        options={[
                          { value: true, label: t('active', { fallback: 'نشط' }), activeClass: 'border-green-200 bg-green-50 text-green-700' },
                          { value: false, label: t('inactive', { fallback: 'معطّل' }), activeClass: 'border-red-200 bg-red-50 text-red-700' },
                        ]}
                        onSave={(value) => patchProduct({ is_active: value })}
                      />
                    </Field>
                    <Field label={t('highlighting', { fallback: 'التمييز' })}>
                      <ChoicePills
                        value={Boolean(activeProduct.is_featured)}
                        options={[
                          { value: true, label: t('featured', { fallback: 'مميز' }), activeClass: 'border-amber-200 bg-amber-50 text-amber-700' },
                          { value: false, label: t('normal', { fallback: 'عادي' }), activeClass: 'border-[#E5E0D8] bg-background text-text-secondary' },
                        ]}
                        onSave={(value) => patchProduct({ is_featured: value })}
                      />
                    </Field>
                  </div>
                </Section>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#E5E0D8] bg-background-card px-4 py-3">
                  <p className="text-xs font-bold text-[#8B8172]">{t('variants', { fallback: 'الخيارات' })}</p>
                  <p className="mt-1 text-2xl font-black text-text-primary">{variants.length}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E0D8] bg-background-card px-4 py-3">
                  <p className="text-xs font-bold text-[#8B8172]">{t('stock', { fallback: 'المخزون' })}</p>
                  <p className="mt-1 text-2xl font-black text-text-primary">{totalStock}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E0D8] bg-background-card px-4 py-3">
                  <p className="text-xs font-bold text-[#8B8172]">{t('lowestPrice', { fallback: 'أدنى سعر' })}</p>
                  <p className="mt-1 text-lg font-black text-primary">{minPrice ? formatSYP(minPrice) : '—'}</p>
                </div>
              </div>

              <Section
                title={`${t('variantsAndPrices', { fallback: 'المتغيرات والأسعار' })} (${variants.length})`}
                action={
                  <button
                    type="button"
                    onClick={() => setShowAddVariant((current) => !current)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1C1917] px-3 text-xs font-black text-white hover:bg-[#2D2926]"
                  >
                    <Plus size={14} />
                    {t('addVariant', { fallback: 'خيار' })}
                  </button>
                }
              >
                {showAddVariant ? (
                  <div className="mb-4 rounded-2xl border border-[#EFE7DA] bg-[#FFFCF7] p-3">
                    <div className="grid gap-3 md:grid-cols-6">
                      <input
                        value={newVariant.sku}
                        onChange={(event) => setNewVariant((draft) => ({ ...draft, sku: event.target.value }))}
                        placeholder="SKU"
                        dir="ltr"
                        className={`${inputClass} md:col-span-2`}
                      />
                        <input
                        type="number"
                        value={newVariant.price_syp}
                        onChange={(event) =>
                          setNewVariant((draft) => ({ ...draft, price_syp: event.target.value }))
                        }
                        placeholder={t('price', { fallback: 'السعر' })}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        value={newVariant.compare_price_syp}
                        onChange={(event) =>
                          setNewVariant((draft) => ({ ...draft, compare_price_syp: event.target.value }))
                        }
                        placeholder={t('comparePrice', { fallback: 'المقارنة' })}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        value={newVariant.stock_quantity}
                        onChange={(event) =>
                          setNewVariant((draft) => ({ ...draft, stock_quantity: event.target.value }))
                        }
                        placeholder={t('stock', { fallback: 'المخزون' })}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={createVariant}
                        disabled={savingKey === 'variant:new' || !newVariant.sku.trim() || !newVariant.price_syp.trim()}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-text-primary transition hover:bg-[#9A7209] disabled:opacity-50"
                      >
                        {tCommon('add', { fallback: 'إضافة' })}
                      </button>
                    </div>
                    {attrTypes.length ? (
                      <div className="mt-3 space-y-2">
                        {attrTypes.map((type) => (
                          <div key={type.id} className="flex flex-wrap items-center gap-2">
                            <span className="w-20 text-xs font-black text-[#8B8172]">{isAr ? type.name_ar : (type.name_en || type.name_ar)}</span>
                            {getAttrValues(type).map((value) => {
                              const checked = newVariantAttrIds.includes(value.id);
                              return (
                                <button
                                  key={value.id}
                                  type="button"
                                  onClick={() => setNewVariantAttributeValue(type, value.id)}
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition ${
                                    checked
                                      ? 'border-primary bg-[#FFF4D8] text-text-primary'
                                      : 'border-[#E5E0D8] bg-background-card text-text-secondary hover:border-primary'
                                  }`}
                                >
                                  <ColorDot hex={value.hex_color} />
                                  {isAr ? value.value_ar : (value.value_en || value.value_ar)}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {variants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E5E0D8] p-8 text-center text-sm font-bold text-[#8B8172]">
                    {t('noVariants', { fallback: 'لا توجد متغيرات' })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variants.map((variant) => {
                      const attrIds = getVariantAttrIds(variant);
                      return (
                        <div key={variant.id} className="rounded-2xl border border-[#EFE7DA] bg-[#FFFCF7] p-3">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-[220px] flex-1">
                              <p className="mb-1 text-[11px] font-black text-[#8B8172]">{getVariantLabel(variant)}</p>
                              <InlineText
                                value={variant.sku}
                                dir="ltr"
                                onSave={(value) => patchVariant(variant, { sku: value })}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <ChoicePills
                                value={Boolean(variant.is_active)}
                                options={[
                                  {
                                    value: true,
                                    label: t('active', { fallback: 'نشط' }),
                                    activeClass: 'border-green-200 bg-green-50 text-green-700',
                                  },
                                  {
                                    value: false,
                                    label: t('inactive', { fallback: 'معطّل' }),
                                    activeClass: 'border-red-200 bg-red-50 text-red-700',
                                  },
                                ]}
                                onSave={(value) => patchVariant(variant, { is_active: value })}
                              />
                              <button
                                type="button"
                                title={tCommon('delete', { fallback: 'حذف الخيار' })}
                                onClick={() => void deleteVariant(variant)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-4">
                            <Field label={t('price', { fallback: 'السعر' })}>
                              <InlineNumber
                                value={asNumber(variant.price_syp)}
                                onSave={(value) => patchVariant(variant, { price_syp: asNumber(value) })}
                              />
                            </Field>
                            <Field label={t('comparePrice', { fallback: 'المقارنة' })}>
                              <InlineNumber
                                value={variant.compare_price_syp}
                                allowNull
                                onSave={(value) => patchVariant(variant, { compare_price_syp: value })}
                              />
                            </Field>
                            <Field label={t('stock', { fallback: 'المخزون' })}>
                              <InlineNumber
                                value={asNumber(variant.stock_quantity)}
                                onSave={(value) => patchVariant(variant, { stock_quantity: asNumber(value) })}
                              />
                            </Field>
                            <Field label={t('weightGrams', { fallback: 'الوزن (غرام)' })}>
                              <InlineNumber
                                value={variant.weight_grams ?? null}
                                allowNull
                                onSave={(value) => patchVariant(variant, { weight_grams: value })}
                              />
                            </Field>
                          </div>

                          {attrTypes.length ? (
                            <div className="mt-3 space-y-2">
                              {attrTypes.map((type) => (
                                <div key={type.id} className="flex flex-wrap items-center gap-2">
                                  <span className="w-20 text-xs font-black text-[#8B8172]">{isAr ? type.name_ar : (type.name_en || type.name_ar)}</span>
                                  {getAttrValues(type).map((value) => {
                                    const checked = attrIds.includes(value.id);
                                    return (
                                      <button
                                        key={value.id}
                                        type="button"
                                        onClick={() => setVariantAttributeValue(variant, type, value.id)}
                                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition ${
                                          checked
                                            ? 'border-primary bg-[#FFF4D8] text-text-primary'
                                            : 'border-[#E5E0D8] bg-background-card text-text-secondary hover:border-primary'
                                        }`}
                                      >
                                        <ColorDot hex={value.hex_color} />
                                        {isAr ? value.value_ar : (value.value_en || value.value_ar)}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              <Section
                title={`${t('productImages', { fallback: 'صور المنتج' })} (${images.length})`}
                action={
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={savingKey === 'image:new' || !newImageUrl.trim()}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1C1917] px-3 text-xs font-black text-white hover:bg-[#2D2926] disabled:opacity-50"
                  >
                    <ImagePlus size={14} />
                    {tCommon('add', { fallback: 'إضافة' })}
                  </button>
                }
              >
                <div className="mb-3">
                  <input
                    value={newImageUrl}
                    onChange={(event) => setNewImageUrl(event.target.value)}
                    placeholder={t('imageUrl', { fallback: 'رابط الصورة' })}
                    dir="ltr"
                    className={inputClass}
                  />
                </div>

                {images.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E5E0D8] p-8 text-center text-sm font-bold text-[#8B8172]">
                    {t('noImages', { fallback: 'لا توجد صور' })}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {images.map((image) => (
                      <div key={image.id} className="rounded-2xl border border-[#EFE7DA] bg-[#FFFCF7] p-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (!image.is_primary) void patchImage(image, { is_primary: true });
                          }}
                          className={`relative mb-3 block w-full overflow-hidden rounded-xl border-2 bg-[#F8F3EA] ${
                            image.is_primary ? 'border-primary' : 'border-[#E5E0D8] hover:border-primary'
                          }`}
                        >
                          <img src={image.url} alt={image.alt_ar ?? ''} className="aspect-video w-full object-cover" />
                          {image.is_primary ? (
                            <span className={`absolute ${isAr ? "right-2" : "left-2"} top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-text-primary`}>
                              {t('primary', { fallback: 'رئيسية' })}
                            </span>
                          ) : null}
                        </button>
                        <div className="space-y-2">
                          <Field label={t('link', { fallback: 'الرابط' })}>
                            <InlineText
                              value={image.url}
                              dir="ltr"
                              onSave={(value) => patchImage(image, { url: value })}
                            />
                          </Field>
                          <Field label={t('altText', { fallback: 'النص البديل' })}>
                            <InlineText
                              value={image.alt_ar ?? ''}
                              dir={isAr ? "rtl" : "ltr"}
                              onSave={(value) => patchImage(image, { alt_ar: value })}
                            />
                          </Field>
                          <Field label="الترتيب">
                            <InlineNumber
                              value={image.sort_order}
                              onSave={(value) => patchImage(image, { sort_order: asNumber(value) })}
                            />
                          </Field>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <ChoicePills
                            value={Boolean(image.is_primary)}
                            options={[
                              {
                                value: true,
                                label: 'رئيسية',
                                activeClass: 'border-primary bg-[#FFF4D8] text-text-primary',
                              },
                              {
                                value: false,
                                label: 'عادية',
                                activeClass: 'border-[#E5E0D8] bg-background text-text-secondary',
                              },
                            ]}
                            onSave={(value) => patchImage(image, { is_primary: value })}
                          />
                          <button
                            type="button"
                            title="حذف الصورة"
                            onClick={() => void deleteImage(image)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
