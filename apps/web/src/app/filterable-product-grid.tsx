/* eslint-disable */
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCard } from './catalog-components';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star } from 'lucide-react';

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
  page:      number;
  per_page:  number;
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
  initialSaleOnly?: boolean;
  initialSort?: string;
  pageTitle?: string;
  pageSubtitle?: string;
};

export function FilterableProductGrid({ lockedCategorySlug, initialSaleOnly = false, initialSort = 'newest', pageTitle, pageSubtitle }: Props) {
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
  const [featuredOnly,      setFeaturedOnly]      = useState(() => searchParams.get('featured') === '1' || searchParams.get('featured') === 'true');
  const [saleOnly,          setSaleOnly]          = useState(() => initialSaleOnly || searchParams.get('sale') === 'true' || searchParams.get('sale') === '1' || searchParams.get('has_discount') === 'true');
  const [sort, setSort] = useState(() => searchParams.get('sort') ?? initialSort);
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page') ?? 1)));

  const [data,    setData]    = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);


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
    if (saleOnly)             p.set('sale', 'true');
    if (sort !== 'newest')    p.set('sort', sort);
    if (page > 1)             p.set('page', String(page));
    p.set('per_page', '24');
    return p;
  }, [selectedCategories, selectedBrands, selectedAttrs, priceMin, priceMax, q, featuredOnly, saleOnly, sort, page, lockedCategorySlug]);

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
    setPage(1);
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
    setPage(1);
  };

  const hasActiveFilters =
    (lockedCategorySlug ? false : selectedCategories.length > 0) ||
    selectedBrands.length > 0 || selectedAttrs.length > 0 ||
    priceMin !== null || priceMax !== null || q || featuredOnly;

  const facets = data?.facets;

  // ── search submit ─────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
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
          <SlidersHorizontal size={16} />
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
            <button type="submit" title={isAr ? 'بحث' : 'Search'} className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-text-primary hover:bg-primary">
              <Search size={16} />
            </button>
          </form>

          {/* featured toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background-card px-3 py-2 hover:border-primary">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={e => { setFeaturedOnly(e.target.checked); setPage(1); }}
              className="accent-primary"
            />
            <Star size={15} className="text-primary" /><span className="text-sm font-bold text-text-primary">{t('featuredOnly')}</span>
          </label>

          {/* sale / discounts toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-300/80 bg-amber-500/10 px-3 py-2 hover:border-amber-500 transition-colors">
            <input
              type="checkbox"
              checked={saleOnly}
              onChange={e => { setSaleOnly(e.target.checked); setPage(1); }}
              className="accent-amber-600"
            />
            <span className="text-xs font-black text-amber-600">🏷️</span>
            <span className="text-sm font-bold text-amber-900">
              {isAr ? 'العروض والتخفيضات فقط' : 'Sale Items Only'}
            </span>
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
                  isAr={isAr}
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
                  isAr={isAr}
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
                    const isZero = val.count === 0 && !checked;
                    return (
                      <button
                        type="button"
                        key={val.id}
                        disabled={isZero}
                        title={`${isAr ? val.value_ar : (val.value_en || val.value_ar)} (${val.count})${isZero ? (isAr ? ' - غير متوفر' : ' - Unavailable') : ''}`}
                        onClick={(e) => {
                          if (isZero) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          toggle(selectedAttrs, attrKey, setSelectedAttrs);
                        }}
                        className={`relative h-8 w-8 rounded-full border-2 transition-all overflow-hidden flex items-center justify-center ${
                          checked 
                            ? 'border-[#1F1B16] scale-110 shadow-md ring-2 ring-primary ring-offset-2' 
                            : isZero 
                              ? 'border-dashed border-red-300/80 opacity-35 cursor-not-allowed grayscale-[40%]' 
                              : 'border-border hover:border-primary hover:scale-105 cursor-pointer shadow-sm'
                        }`}
                        style={{ backgroundColor: val.hex_color }}
                      >
                        {checked && (
                          <span className="absolute inset-0 flex items-center justify-center text-text-primary text-[10px] font-black drop-shadow">✓</span>
                        )}
                        {isZero && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="w-[140%] h-[2px] bg-red-600/90 -rotate-45 shadow-[0_0_2px_rgba(255,255,255,0.8)]" />
                          </div>
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
                      isAr={isAr}
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
                      onChange={e => { setPriceMin(e.target.value ? Number(e.target.value) : null); setPage(1); }}
                      placeholder={String(facets.priceRange.min)}
                      className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-text-muted font-bold mb-1 block">{t('to')}</label>
                    <input
                      type="number"
                      value={priceMax ?? ''}
                      onChange={e => { setPriceMax(e.target.value ? Number(e.target.value) : null); setPage(1); }}
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
              <SlidersHorizontal size={16} />
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

          <div className="flex items-center gap-3">
            <select aria-label={isAr ? 'ترتيب المنتجات' : 'Sort products'} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="rounded-lg border border-border bg-background-card px-3 py-2 text-xs font-bold text-text-primary">
              <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
              <option value="popular">{isAr ? 'الأكثر طلبا' : 'Most popular'}</option>
              <option value="price_asc">{isAr ? 'السعر: الأقل' : 'Price: low to high'}</option>
              <option value="price_desc">{isAr ? 'السعر: الأعلى' : 'Price: high to low'}</option>
            </select>
            <p className="text-sm text-[#6F6658] font-medium">{loading ? t('loading') : `${data?.total ?? 0} ${t('productCount')}`}</p>
          </div>
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
          <>
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
          {Math.ceil(data.total / data.per_page) > 1 ? <nav className="mt-8 flex items-center justify-center gap-3" aria-label={isAr ? 'صفحات المنتجات' : 'Product pages'}>
            <button type="button" title={isAr ? 'الصفحة السابقة' : 'Previous page'} disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid h-10 w-10 place-items-center rounded-lg border border-border disabled:opacity-40"><ChevronRight size={18} className={isAr ? '' : 'rotate-180'} /></button>
            <span className="min-w-24 text-center text-sm font-bold text-text-primary">{data.page} / {Math.ceil(data.total / data.per_page)}</span>
            <button type="button" title={isAr ? 'الصفحة التالية' : 'Next page'} disabled={page >= Math.ceil(data.total / data.per_page) || loading} onClick={() => setPage((current) => current + 1)} className="grid h-10 w-10 place-items-center rounded-lg border border-border disabled:opacity-40"><ChevronLeft size={18} className={isAr ? '' : 'rotate-180'} /></button>
          </nav> : null}
          </>
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

function CheckItem({ label, count, checked, onChange, isAr = true }: {
  label: string; count: number; checked: boolean; onChange: () => void; isAr?: boolean;
}) {
  const isZero = count === 0 && !checked;
  return (
    <label
      onClick={(e) => {
        if (isZero) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      title={isZero ? (isAr ? `${label} (غير متوفر)` : `${label} (Unavailable)`) : label}
      className={`relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all select-none ${
        isZero
          ? 'opacity-40 cursor-not-allowed bg-black/[0.02] border border-dashed border-border/40 text-[#8C8275]'
          : 'cursor-pointer hover:bg-[#F8F3EA]'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={isZero}
        onChange={isZero ? undefined : onChange}
        className="h-4 w-4 rounded accent-primary cursor-pointer disabled:cursor-not-allowed"
      />
      <span className={`flex-1 text-sm font-medium ${isZero ? 'line-through decoration-red-500/80 decoration-[1.5px] text-[#8C8275]' : 'text-[#1F1B16]'}`}>
        {label}
      </span>
      <span className={`text-xs font-bold tabular-nums ${isZero ? 'text-red-400/80' : 'text-text-muted'}`}>
        {count}
      </span>
      {isZero && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-[104%] h-[1.5px] bg-red-500/50 -rotate-2" />
        </div>
      )}
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
