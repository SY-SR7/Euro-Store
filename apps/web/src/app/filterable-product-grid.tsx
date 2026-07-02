// @ts-nocheck
/* eslint-disable */
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCard } from './catalog-components';

function formatSYP(n: number, isAr: boolean, t: any) {
  return Number(n || 0).toLocaleString(isAr ? 'ar-SY' : 'en-US') + ' ' + t('syp');
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

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
    <div className="flex flex-col gap-4 md:gap-8" dir="rtl">
      {/* Mobile Toggle Button (Above Filters) */}
      <div className="md:hidden flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="flex items-center gap-2 rounded-lg border border-border bg-background-card px-4 py-2 text-sm font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors w-full justify-center"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          {sidebarOpen ? t('hideFilters') : t('showFilters')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className={`flex-none transition-all duration-200 ${sidebarOpen ? 'w-full md:w-64' : 'w-0 overflow-hidden hidden md:block'}`}>
          <div className="md:sticky md:top-24 space-y-6 min-w-0 md:min-w-[16rem]">

            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-[#1F1B16] uppercase tracking-wider">{t('filters')}</h3>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button onClick={clearAll} className="text-xs text-primary font-bold hover:underline">
                    {t('clearAll')}
                  </button>
                )}
              </div>
            </div>

          {/* search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary bg-background-card"
            />
            <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-text-primary text-sm font-bold hover:bg-primary">
              🔍
            </button>
          </form>

          {/* featured toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background-card px-3 py-2 hover:border-primary">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={e => setFeaturedOnly(e.target.checked)}
              className="accent-[#C9A84C]"
            />
            <span className="text-sm font-bold text-[#1F1B16]">⭐ {t('featuredOnly')}</span>
          </label>

          {/* categories (only shown if not locked) */}
          {!lockedCategorySlug && facets && facets.categories.length > 0 && (
            <FilterSection title={t('categories')}>
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
            <FilterSection title={t('brands')}>
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
                          checked ? 'border-[#1F1B16] scale-110 shadow-md' : 'border-border hover:border-primary'
                        }`}
                        style={{ backgroundColor: val.hex_color }}
                      >
                        {checked && (
                          <span className="absolute inset-0 flex items-center justify-center text-text-primary text-[10px] font-black drop-shadow">✓</span>
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
            <FilterSection title={t('priceRange')}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-text-muted font-bold mb-1 block">{t('from')}</label>
                    <input
                      type="number"
                      value={priceMin ?? ''}
                      onChange={e => setPriceMin(e.target.value ? Number(e.target.value) : null)}
                      placeholder={String(facets.priceRange.min)}
                      className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-text-muted font-bold mb-1 block">{t('to')}</label>
                    <input
                      type="number"
                      value={priceMax ?? ''}
                      onChange={e => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                      placeholder={String(facets.priceRange.max)}
                      className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-text-muted font-medium">
                  <span>{formatSYP(facets.priceRange.min, isAr, t)}</span>
                  <span>{formatSYP(facets.priceRange.max, isAr, t)}</span>
                </div>
                {(priceMin !== null || priceMax !== null) && (
                  <button
                    onClick={() => { setPriceMin(null); setPriceMax(null); }}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    {t('clearPrice')}
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
              className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-background-card px-3 py-2 text-sm font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              {sidebarOpen ? t('hideFilters') : t('showFilters')}
            </button>

            {/* active filter chips */}
            {selectedCategories.length > 0 && !lockedCategorySlug && (
              <FilterChip
                label={`${selectedCategories.length} ${t('categoryCount')}`}
                onRemove={() => setSelectedCategories([])}
              />
            )}
            {selectedBrands.length > 0 && (
              <FilterChip label={`${selectedBrands.length} ${t('brandCount')}`} onRemove={() => setSelectedBrands([])} />
            )}
            {selectedAttrs.length > 0 && (
              <FilterChip label={`${selectedAttrs.length} ${t('attrCount')}`} onRemove={() => setSelectedAttrs([])} />
            )}
            {(priceMin !== null || priceMax !== null) && (
              <FilterChip label={t('priceRange')} onRemove={() => { setPriceMin(null); setPriceMax(null); }} />
            )}
          </div>

          <p className="text-sm text-[#6F6658] font-medium">
            {loading ? t('loading') : `${data?.total ?? 0} ${t('productCount')}`}
          </p>
        </div>

        {/* products grid */}
        {loading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-background-elevated border border-border/40 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] skew-x-12" />
                <div className="h-full w-full flex flex-col justify-end p-4 gap-3 bg-background-secondary/50">
                  <div className="h-3 w-1/3 bg-background-card rounded-full" />
                  <div className="h-4 w-3/4 bg-background-card rounded-full" />
                  <div className="h-4 w-1/2 bg-background-card rounded-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.products.length ? (
          <div className="rounded-2xl border border-border bg-background-card p-16 text-center">
            <p className="text-xl text-[#6F6658]">{t('noProducts')}</p>
            {hasActiveFilters && (
              <button onClick={clearAll} className="mt-4 text-sm text-primary hover:underline font-bold">
                {t('clearAllFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product: any) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                minPrice={product.minPrice} 
                varyingAttributes={product.varyingAttributes}
                variantCount={product.variants_count}
                totalStock={product.total_stock}
              />
            ))}
          </div>
        )}
      </div>
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
        className="mb-3 flex w-full items-center justify-between text-xs font-black uppercase tracking-wider text-text-muted hover:text-[#1F1B16]"
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
      <span className="text-xs text-text-muted font-medium tabular-nums">{count}</span>
    </label>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-bold text-[#8B6914]">
      {label}
      <button onClick={onRemove} className="ml-1 text-primary hover:text-[#8B6914] font-black text-sm leading-none">×</button>
    </span>
  );
}
