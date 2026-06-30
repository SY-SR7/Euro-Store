// @ts-nocheck
/* eslint-disable */
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCard } from './catalog-components';

function formatSYP(n: number, isAr: boolean, t: any) {
  return Number(n || 0).toLocaleString(isAr ? 'ar-SY' : 'en-US') + ' ' + t('syp', { fallback: 'ل.س' });
}

type Facet<T> = T & { count: number; selected: boolean };

type CategoryFacet = Facet<{ id: string; name_ar: string; name_en: string; slug: string }>;
type BrandFacet    = Facet<{ id: string; name: string; slug: string }>;
type AttrValue     = Facet<{ id: string; slug: string; value_ar: string; value_en: string; hex_color?: string | null }>;
type AttrTypeFacet = { id: string; slug: string; name_ar: string; name_en: string; values: AttrValue[] };

type FilterData = {
  products:  any[];
  total:     number;
  facets: {
    categories: CategoryFacet[];
    brands:     BrandFacet[];
    attributes: AttrTypeFacet[];
    priceRange: { min: number; max: number };
  };
};

type Props = {
  /** If set, this category is locked (category page) and cannot be changed */
  lockedCategorySlug?: string;
};

export function FilterableProductGrid({ lockedCategorySlug }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const t = useTranslations('catalog');
  const isAr = locale === 'ar';

  // ── read initial state from URL ──────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (lockedCategorySlug) return [lockedCategorySlug];
    return (searchParams.get('categories') ?? '').split(',').filter(Boolean);
  });
  const [selectedBrands,    setSelectedBrands]    = useState<string[]>(() =>
    (searchParams.get('brands') ?? '').split(',').filter(Boolean));
  const [selectedAttrs,     setSelectedAttrs]     = useState<string[]>(() =>
    (searchParams.get('attrs') ?? '').split(',').filter(Boolean));
  const [priceMin,          setPriceMin]          = useState<number | null>(() => {
    const v = searchParams.get('minPrice'); return v ? Number(v) : null;
  });
  const [priceMax,          setPriceMax]          = useState<number | null>(() => {
    const v = searchParams.get('maxPrice'); return v ? Number(v) : null;
  });
  const [q,                 setQ]                 = useState(() => searchParams.get('q') ?? '');
  const [featuredOnly,      setFeaturedOnly]      = useState(() => searchParams.get('featured') === '1');

  const [data,    setData]    = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── build URL params & fetch ─────────────────────────────────────────
  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    const cats = lockedCategorySlug ? [lockedCategorySlug] : selectedCategories;
    if (cats.length)          p.set('categories', cats.join(','));
    if (selectedBrands.length) p.set('brands', selectedBrands.join(','));
    if (selectedAttrs.length)  p.set('attrs',  selectedAttrs.join(','));
    if (priceMin !== null)    p.set('minPrice', String(priceMin));
    if (priceMax !== null)    p.set('maxPrice', String(priceMax));
    if (q)                    p.set('q', q);
    if (featuredOnly)         p.set('featured', '1');
    return p;
  }, [selectedCategories, selectedBrands, selectedAttrs, priceMin, priceMax, q, featuredOnly, lockedCategorySlug]);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res  = await fetch(`/api/catalog/filters?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchFilters();
    // sync URL (only for non-locked pages)
    if (!lockedCategorySlug) {
      startTransition(() => {
        const params = buildParams();
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }
  }, [fetchFilters]);

  // ── toggle helpers ────────────────────────────────────────────────────
  const toggle = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  };

  const clearAll = () => {
    if (!lockedCategorySlug) setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedAttrs([]);
    setPriceMin(null);
    setPriceMax(null);
    setQ('');
    setFeaturedOnly(false);
  };

  // re-fetch whenever state changes
  useEffect(() => { fetchFilters(); }, [
    selectedCategories, selectedBrands, selectedAttrs, priceMin, priceMax, featuredOnly
  ]);

  const hasActiveFilters =
    (lockedCategorySlug ? false : selectedCategories.length > 0) ||
    selectedBrands.length > 0 || selectedAttrs.length > 0 ||
    priceMin !== null || priceMax !== null || q || featuredOnly;

  const facets = data?.facets;

  // ── search submit ─────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilters();
  };

  return (
    <div className="flex gap-8" dir="rtl">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`flex-none transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="sticky top-24 space-y-6 min-w-[16rem]">

          {/* header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1F1B16] uppercase tracking-wider">{t('filters', { fallback: 'الفلاتر' })}</h3>
            {hasActiveFilters && (
              <button onClick={clearAll} className="text-xs text-[#C9A84C] font-bold hover:underline">
                {t('clearAll', { fallback: 'مسح الكل' })}
              </button>
            )}
          </div>

          {/* search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={t('searchPlaceholder', { fallback: 'ابحث...' })}
              className="flex-1 rounded-lg border border-[#E8DCC3] px-3 py-2 text-sm outline-none focus:border-[#C9A84C] bg-white"
            />
            <button type="submit" className="rounded-lg bg-[#C9A84C] px-3 py-2 text-white text-sm font-bold hover:bg-[#B8860B]">
              🔍
            </button>
          </form>

          {/* featured toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E8DCC3] bg-white px-3 py-2 hover:border-[#C9A84C]">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={e => setFeaturedOnly(e.target.checked)}
              className="accent-[#C9A84C]"
            />
            <span className="text-sm font-bold text-[#1F1B16]">⭐ {t('featuredOnly', { fallback: 'المنتجات المميزة' })}</span>
          </label>

          {/* categories (only shown if not locked) */}
          {!lockedCategorySlug && facets && facets.categories.length > 0 && (
            <FilterSection title={t('categories', { fallback: 'التصنيفات' })}>
              {facets.categories.map(cat => (
                <CheckItem
                  key={cat.id}
                  label={isAr ? cat.name_ar : (cat.name_en || cat.name_ar)}
                  count={cat.count}
                  checked={selectedCategories.includes(cat.slug)}
                  onChange={() => { toggle(selectedCategories, cat.slug, setSelectedCategories); }}
                />
              ))}
            </FilterSection>
          )}

          {/* brands */}
          {facets && facets.brands.length > 0 && (
            <FilterSection title={t('brands', { fallback: 'العلامات التجارية' })}>
              {facets.brands.map(b => (
                <CheckItem
                  key={b.id}
                  label={b.name}
                  count={b.count}
                  checked={selectedBrands.includes(b.slug)}
                  onChange={() => { toggle(selectedBrands, b.slug, setSelectedBrands); }}
                />
              ))}
            </FilterSection>
          )}

          {/* dynamic attribute facets */}
          {facets && facets.attributes.map(attrType => (
            <FilterSection key={attrType.id} title={isAr ? attrType.name_ar : (attrType.name_en || attrType.name_ar)}>
              <div className={attrType.slug === 'color' ? 'flex flex-wrap gap-2' : 'space-y-1.5'}>
                {attrType.values.map(val => {
                  const attrKey = `${attrType.slug}:${val.slug}`;
                  const checked = selectedAttrs.includes(attrKey) || selectedAttrs.includes(`${attrType.slug}:${val.id}`);

                  if (attrType.slug === 'color' && val.hex_color) {
                    return (
                      <button
                        key={val.id}
                        title={`${isAr ? val.value_ar : (val.value_en || val.value_ar)} (${val.count})`}
                        onClick={() => toggle(selectedAttrs, attrKey, setSelectedAttrs)}
                        className={`relative h-7 w-7 rounded-full border-2 transition-all ${
                          checked ? 'border-[#1F1B16] scale-110 shadow-md' : 'border-[#E8DCC3] hover:border-[#C9A84C]'
                        }`}
                        style={{ backgroundColor: val.hex_color }}
                      >
                        {checked && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-black drop-shadow">✓</span>
                        )}
                      </button>
                    );
                  }

                  return (
                    <CheckItem
                      key={val.id}
                      label={isAr ? val.value_ar : (val.value_en || val.value_ar)}
                      count={val.count}
                      checked={checked}
                      onChange={() => toggle(selectedAttrs, attrKey, setSelectedAttrs)}
                    />
                  );
                })}
              </div>
            </FilterSection>
          ))}

          {/* price range */}
          {facets && facets.priceRange.max > 0 && (
            <FilterSection title={t('priceRange', { fallback: 'نطاق السعر' })}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#A8A29E] font-bold mb-1 block">{t('from', { fallback: 'من' })}</label>
                    <input
                      type="number"
                      value={priceMin ?? ''}
                      onChange={e => setPriceMin(e.target.value ? Number(e.target.value) : null)}
                      placeholder={String(facets.priceRange.min)}
                      className="w-full rounded-lg border border-[#E8DCC3] px-2 py-1.5 text-xs outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-[#A8A29E] font-bold mb-1 block">{t('to', { fallback: 'إلى' })}</label>
                    <input
                      type="number"
                      value={priceMax ?? ''}
                      onChange={e => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                      placeholder={String(facets.priceRange.max)}
                      className="w-full rounded-lg border border-[#E8DCC3] px-2 py-1.5 text-xs outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-[#A8A29E] font-medium">
                  <span>{formatSYP(facets.priceRange.min, isAr, t)}</span>
                  <span>{formatSYP(facets.priceRange.max, isAr, t)}</span>
                </div>
                {(priceMin !== null || priceMax !== null) && (
                  <button
                    onClick={() => { setPriceMin(null); setPriceMax(null); }}
                    className="text-[11px] text-[#C9A84C] hover:underline font-bold"
                  >
                    {t('clearPrice', { fallback: 'مسح السعر' })}
                  </button>
                )}
              </div>
            </FilterSection>
          )}
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="flex items-center gap-2 rounded-lg border border-[#E8DCC3] bg-white px-3 py-2 text-sm font-bold text-[#57534E] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              {sidebarOpen ? t('hideFilters', { fallback: 'إخفاء الفلاتر' }) : t('showFilters', { fallback: 'إظهار الفلاتر' })}
            </button>

            {/* active filter chips */}
            {selectedCategories.length > 0 && !lockedCategorySlug && (
              <FilterChip
                label={`${selectedCategories.length} ${t('categoryCount', { fallback: 'تصنيف' })}`}
                onRemove={() => setSelectedCategories([])}
              />
            )}
            {selectedBrands.length > 0 && (
              <FilterChip label={`${selectedBrands.length} ${t('brandCount', { fallback: 'ماركة' })}`} onRemove={() => setSelectedBrands([])} />
            )}
            {selectedAttrs.length > 0 && (
              <FilterChip label={`${selectedAttrs.length} ${t('attrCount', { fallback: 'خاصية' })}`} onRemove={() => setSelectedAttrs([])} />
            )}
            {(priceMin !== null || priceMax !== null) && (
              <FilterChip label={t('priceRange', { fallback: 'نطاق السعر' })} onRemove={() => { setPriceMin(null); setPriceMax(null); }} />
            )}
          </div>

          <p className="text-sm text-[#6F6658] font-medium">
            {loading ? t('loading', { fallback: 'جارٍ التحميل...' }) : `${data?.total ?? 0} ${t('productCount', { fallback: 'منتج' })}`}
          </p>
        </div>

        {/* products grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-[#F3EDE3] animate-pulse" />
            ))}
          </div>
        ) : !data?.products.length ? (
          <div className="rounded-2xl border border-[#E8DCC3] bg-white p-16 text-center">
            <p className="text-xl text-[#6F6658]">{t('noProducts', { fallback: 'لا توجد منتجات تطابق الفلاتر المحددة' })}</p>
            {hasActiveFilters && (
              <button onClick={clearAll} className="mt-4 text-sm text-[#C9A84C] hover:underline font-bold">
                {t('clearAllFilters', { fallback: 'مسح جميع الفلاتر' })}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product: any) => (
              <ProductCard key={product.id} product={product} minPrice={product.minPrice} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-[#F0EBE0] pt-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="mb-3 flex w-full items-center justify-between text-xs font-black uppercase tracking-wider text-[#A8A29E] hover:text-[#1F1B16]"
      >
        {title}
        <span className="text-base leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function CheckItem({ label, count, checked, onChange }: {
  label: string; count: number; checked: boolean; onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-[#F8F3EA] transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded accent-[#C9A84C] cursor-pointer"
      />
      <span className="flex-1 text-sm text-[#1F1B16] font-medium">{label}</span>
      <span className="text-xs text-[#A8A29E] font-medium tabular-nums">{count}</span>
    </label>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-3 py-1 text-xs font-bold text-[#8B6914]">
      {label}
      <button onClick={onRemove} className="ml-1 text-[#C9A84C] hover:text-[#8B6914] font-black text-sm leading-none">×</button>
    </span>
  );
}
