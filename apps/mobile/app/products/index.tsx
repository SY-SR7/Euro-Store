import React, { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Compass, Flame, Percent, Search, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ProductCard, type ProductCardProps } from '../../components/ProductCard';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiFetch } from '../../utils/api';
import type { CatalogFilterOption, CatalogFilters, CatalogResponse } from '../../utils/catalog';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';
type Suggestion = { type: 'category' | 'product'; id: string; name: string; slug: string };

const EMPTY_FILTERS: CatalogFilters = { categories: [], brands: [], attributes: [] };

type ProductsScreenProps = {
  preset?: { category?: string; brand?: string; sale?: boolean; featured?: boolean; sort?: SortOption; title?: string; hero?: 'offers' | 'new-arrivals' };
};

export default function ProductsScreen({ preset }: ProductsScreenProps = {}) {
  const params = useLocalSearchParams<{ categoryId?: string; category?: string; categories?: string; brand?: string; brands?: string; attrs?: string; sale?: string; featured?: string; sort?: SortOption; title?: string; q?: string; search?: string; minPrice?: string; maxPrice?: string; page?: string }>();
  const { locale, isAr, t } = usePreferences();
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const initialQuery = params.q ?? params.search ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sort, setSort] = useState<SortOption>(preset?.sort ?? params.sort ?? 'newest');
  const initialCategory = preset?.category ?? params.categoryId ?? params.category;
  const initialBrand = preset?.brand ?? params.brand;
  const [saleOnly, setSaleOnly] = useState(preset?.sale ?? (params.sale === 'true' || params.sale === '1'));
  const [featuredOnly, setFeaturedOnly] = useState(preset?.featured ?? (params.featured === 'true' || params.featured === '1'));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : splitParam(params.categories));
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : splitParam(params.brands));
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>(() => parseAttributeParams(params.attrs));
  const [minPrice, setMinPrice] = useState(params.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(params.maxPrice ?? '');
  const [page, setPage] = useState(Math.max(1, Number(params.page ?? 1) || 1));
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const filterSignature = JSON.stringify({ selectedCategories, selectedBrands, selectedAttributes, minPrice, maxPrice, saleOnly, featuredOnly });

  useEffect(() => {
    const attrs = Object.entries(selectedAttributes).flatMap(([slug, values]) => values.map((value) => `${slug}:${value}`));
    router.setParams({
      q: query.trim() || undefined,
      categories: selectedCategories.length ? selectedCategories.join(',') : undefined,
      brands: selectedBrands.length ? selectedBrands.join(',') : undefined,
      attrs: attrs.length ? attrs.join(',') : undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sale: saleOnly ? 'true' : undefined,
      featured: featuredOnly ? '1' : undefined,
      sort: sort === 'newest' ? undefined : sort,
      page: page > 1 ? String(page) : undefined,
    });
  }, [featuredOnly, maxPrice, minPrice, page, query, saleOnly, selectedAttributes, selectedBrands, selectedCategories, sort]);

  useEffect(() => { setPage(1); }, [debouncedQuery, locale, sort, filterSignature, reloadToken]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      apiFetch<{ suggestions: Suggestion[] }>(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}&lang=${locale}`)
        .then((result) => setSuggestions(result.suggestions ?? []))
        .catch(() => setSuggestions([]));
    }, 180);
    return () => clearTimeout(timeout);
  }, [locale, query]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const result = await fetchCatalog(page);
        if (!active) return;
        setProducts(result.data.map(toCard));
        setFilters(result.filters ?? EMPTY_FILTERS);
        setTotal(result.total);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [debouncedQuery, locale, page, sort, filterSignature, reloadToken]);

  async function fetchCatalog(targetPage: number): Promise<CatalogResponse> {
    const search = new URLSearchParams({ page: String(targetPage), per_page: '24', sort });
    if (debouncedQuery) search.set('search', debouncedQuery);
    selectedCategories.forEach((id) => search.append('category_id', id));
    selectedBrands.forEach((id) => search.append('brand_id', id));
    Object.entries(selectedAttributes).forEach(([slug, values]) => values.forEach((id) => search.append('attrs', `${slug}:${id}`)));
    if (minPrice.trim()) search.set('min_price', minPrice.trim());
    if (maxPrice.trim()) search.set('max_price', maxPrice.trim());
    if (saleOnly) search.set('sale', 'true');
    if (featuredOnly) search.set('featured', 'true');
    return apiFetch<CatalogResponse>(`/api/products?${search.toString()}`);
  }

  function toCard(product: CatalogResponse['data'][number]): ProductCardProps {
    const createdAt = new Date(product.created_at).getTime();
    return {
      id: product.id,
      slug: product.slug,
      title: isAr ? product.name_ar : product.name_en,
      price: Number(product.minPrice ?? 0),
      comparePrice: Number(product.raw_min_price ?? 0) > Number(product.minPrice ?? 0) ? Number(product.raw_min_price) : null,
      imageUrl: product.image_url || '',
      maxQuantity: Math.max(0, Number(product.default_variant_stock ?? product.total_stock ?? 0)),
      variantId: product.default_variant_id,
      hasMultipleVariants: product.has_multiple_variants,
      isNew: Number.isFinite(createdAt) && Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000,
      discountPercentage: product.discount_percentage,
    };
  }

  function toggleValue(current: string[], value: string, setter: (values: string[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function toggleAttribute(slug: string, id: string) {
    setSelectedAttributes((current) => {
      const values = current[slug] ?? [];
      return { ...current, [slug]: values.includes(id) ? values.filter((value) => value !== id) : [...values, id] };
    });
  }

  function clearFilters() {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedAttributes({});
    setMinPrice('');
    setMaxPrice('');
    setSaleOnly(false);
    setFeaturedOnly(false);
  }

  function optionLabel(option: CatalogFilterOption) {
    if (option.name) return option.name;
    return isAr ? option.name_ar ?? option.value_ar ?? option.slug : option.name_en ?? option.value_en ?? option.slug;
  }

  function selectSuggestion(suggestion: Suggestion) {
    setSuggestions([]);
    if (suggestion.type === 'product') {
      router.push(`/products/${encodeURIComponent(suggestion.slug)}`);
      return;
    }
    setQuery('');
    setDebouncedQuery('');
    setSelectedCategories([suggestion.id]);
  }

  const sortOptions = useMemo<Array<{ value: SortOption; label: string }>>(() => [
    { value: 'newest', label: t('catalog.newest') },
    { value: 'popular', label: t('catalog.popular') },
    { value: 'price_asc', label: t('catalog.priceAsc') },
    { value: 'price_desc', label: t('catalog.priceDesc') },
  ], [t]);
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {preset?.hero ? <CatalogEditorialHero kind={preset.hero} /> : null}
      <View className="border-b border-border px-5 py-4">
        <View className="mb-4 flex-row items-center gap-3">
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full border border-border">
            <BackIcon size={20} color="#B8860B" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text-primary">{preset?.title || params.title || t('catalog.allProducts')}</Text>
            <Text className="text-xs text-text-muted">{t('catalog.results', { count: total })}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('catalog.filters')} onPress={() => setFilterOpen(true)} className="h-10 w-10 items-center justify-center rounded-full border border-border">
            <SlidersHorizontal size={19} color="#B8860B" />
          </Pressable>
        </View>
        <View className="relative">
          <View className="flex-row items-center rounded-xl border border-border bg-background-secondary px-3">
            <Search size={18} color="#737373" />
            <TextInput
              accessibilityLabel={t('catalog.search')}
              value={query}
              onChangeText={setQuery}
              placeholder={t('catalog.search')}
              placeholderTextColor="#737373"
              className={`flex-1 px-3 py-3 text-text-primary ${isAr ? 'text-right' : 'text-left'}`}
              returnKeyType="search"
            />
            {query ? <Pressable accessibilityLabel={t('catalog.clearFilters')} onPress={() => setQuery('')} className="p-1"><X size={17} color="#737373" /></Pressable> : null}
          </View>
          {suggestions.length ? (
            <View accessibilityLabel={t('catalog.suggestions')} className="absolute start-0 end-0 top-14 z-20 border border-border bg-background-card shadow-lg">
              {suggestions.map((suggestion) => (
                <Pressable key={`${suggestion.type}-${suggestion.id}`} onPress={() => selectSuggestion(suggestion)} className="border-b border-border px-4 py-3 last:border-b-0">
                  <Text className="font-bold text-text-primary">{suggestion.name}</Text>
                  <Text className="mt-1 text-xs text-text-muted">{suggestion.type === 'category' ? t('catalog.categories') : t('catalog.allProducts')}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8 }}>
          {sortOptions.map((option) => (
            <Pressable key={option.value} accessibilityState={{ selected: sort === option.value }} onPress={() => setSort(option.value)} className={`rounded-full border px-3 py-2 ${sort === option.value ? 'border-primary bg-primary/10' : 'border-border'}`}>
              <Text className={`text-xs font-bold ${sort === option.value ? 'text-primary' : 'text-text-secondary'}`}>{option.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#B8860B" /></View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6"><Text className="mb-5 text-center text-text-secondary">{t('catalog.searchError')}</Text><Pressable onPress={() => setReloadToken((value) => value + 1)} className="rounded-lg bg-primary px-5 py-3"><Text className="font-bold text-text-primary">{t('common.retry')}</Text></Pressable></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={50}
          windowSize={5}
          removeClippedSubviews
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => <View style={{ flex: 1, maxWidth: '50%', marginBottom: 12 }}><ProductCard {...item} /></View>}
          ListEmptyComponent={<Text className="py-20 text-center text-text-secondary">{t('catalog.noResults')}</Text>}
          ListFooterComponent={total > 24 ? <View className="mt-4 flex-row items-center justify-center gap-3"><Pressable accessibilityRole="button" disabled={page <= 1} onPress={() => setPage((value) => Math.max(1, value - 1))} className="min-h-11 min-w-24 items-center justify-center rounded-lg border border-border px-4 disabled:opacity-40"><Text className="font-bold text-text-secondary">{isAr ? 'السابق' : 'Previous'}</Text></Pressable><Text className="min-w-14 text-center font-bold text-text-primary">{page} / {Math.max(1, Math.ceil(total / 24))}</Text><Pressable accessibilityRole="button" disabled={page >= Math.ceil(total / 24)} onPress={() => setPage((value) => value + 1)} className="min-h-11 min-w-24 items-center justify-center rounded-lg border border-primary px-4 disabled:opacity-40"><Text className="font-bold text-primary">{isAr ? 'التالي' : 'Next'}</Text></Pressable></View> : null}
        />
      )}

      <Modal visible={filterOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFilterOpen(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <Text className="text-xl font-bold text-text-primary">{t('catalog.filters')}</Text>
            <Pressable accessibilityLabel={t('common.cancel')} onPress={() => setFilterOpen(false)} className="h-10 w-10 items-center justify-center"><X size={22} color="#B8860B" /></Pressable>
          </View>
          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 20 }}>
            <View className="mb-7 gap-3">
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: featuredOnly }} onPress={() => setFeaturedOnly((value) => !value)} className={`min-h-12 flex-row items-center justify-between rounded-xl border px-4 ${featuredOnly ? 'border-primary bg-primary/10' : 'border-border bg-background-card'}`}>
                <View className="flex-row items-center gap-2"><Star size={17} color="#B8860B" /><Text className="font-bold text-text-primary">{isAr ? 'المنتجات المميزة فقط' : 'Featured products only'}</Text></View>
                <View className={`h-6 w-11 rounded-full p-0.5 ${featuredOnly ? 'bg-primary' : 'bg-border'}`}><View className={`h-5 w-5 rounded-full bg-white ${featuredOnly ? 'self-end' : 'self-start'}`} /></View>
              </Pressable>
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: saleOnly }} onPress={() => setSaleOnly((value) => !value)} className={`min-h-12 flex-row items-center justify-between rounded-xl border px-4 ${saleOnly ? 'border-primary bg-primary/10' : 'border-border bg-background-card'}`}>
                <View className="flex-row items-center gap-2"><Percent size={17} color="#B8860B" /><Text className="font-bold text-text-primary">{isAr ? 'العروض والتخفيضات فقط' : 'Sale items only'}</Text></View>
                <View className={`h-6 w-11 rounded-full p-0.5 ${saleOnly ? 'bg-primary' : 'bg-border'}`}><View className={`h-5 w-5 rounded-full bg-white ${saleOnly ? 'self-end' : 'self-start'}`} /></View>
              </Pressable>
            </View>
            <FilterSection title={t('catalog.categories')} options={filters.categories} selected={selectedCategories} label={optionLabel} onToggle={(id) => toggleValue(selectedCategories, id, setSelectedCategories)} />
            <FilterSection title={t('catalog.brands')} options={filters.brands} selected={selectedBrands} label={optionLabel} onToggle={(id) => toggleValue(selectedBrands, id, setSelectedBrands)} />
            {filters.attributes.map((attribute) => <FilterSection key={attribute.id} title={isAr ? attribute.name_ar : attribute.name_en} options={attribute.values} selected={selectedAttributes[attribute.slug] ?? []} label={optionLabel} onToggle={(id) => toggleAttribute(attribute.slug, id)} />)}
            <View className="mb-7">
              <Text className="mb-3 text-lg font-bold text-text-primary">{t('catalog.priceRange')}</Text>
              <View className="flex-row gap-3">
                <TextInput accessibilityLabel={t('catalog.minPrice')} value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" placeholder={t('catalog.minPrice')} placeholderTextColor="#737373" className={`flex-1 rounded-lg border border-border bg-background-secondary px-3 py-3 text-text-primary ${isAr ? 'text-right' : 'text-left'}`} />
                <TextInput accessibilityLabel={t('catalog.maxPrice')} value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" placeholder={t('catalog.maxPrice')} placeholderTextColor="#737373" className={`flex-1 rounded-lg border border-border bg-background-secondary px-3 py-3 text-text-primary ${isAr ? 'text-right' : 'text-left'}`} />
              </View>
            </View>
          </ScrollView>
          <View className="flex-row gap-3 border-t border-border p-5">
            <Pressable onPress={clearFilters} className="flex-1 rounded-lg border border-border p-4"><Text className="text-center font-bold text-text-secondary">{t('catalog.clearFilters')}</Text></Pressable>
            <Pressable onPress={() => setFilterOpen(false)} className="flex-1 rounded-lg bg-primary p-4"><Text className="text-center font-bold text-text-primary">{t('catalog.apply')}</Text></Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function splitParam(value?: string) {
  return (value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function parseAttributeParams(value?: string) {
  return splitParam(value).reduce<Record<string, string[]>>((result, pair) => {
    const [slug, id] = pair.split(':');
    if (!slug || !id) return result;
    result[slug] = [...(result[slug] ?? []), id];
    return result;
  }, {});
}

function CatalogEditorialHero({ kind }: { kind: 'offers' | 'new-arrivals' }) {
  const { isAr, l } = usePreferences();
  const offers = kind === 'offers';
  const DecorativeIcon = offers ? Percent : Compass;
  return (
    <View className="px-4 pt-4">
      <LinearGradient
        colors={offers ? ['#FFFDF9', '#FEF3C7', '#FFF7E6'] : ['#FFFDF9', '#FAF6ED', '#F5EFE0']}
        className={`relative overflow-hidden rounded-3xl border p-7 ${offers ? 'border-amber-300' : 'border-border'}`}
      >
        <DecorativeIcon size={150} color={offers ? 'rgba(217,119,6,0.08)' : 'rgba(184,134,11,0.08)'} style={{ position: 'absolute', top: -25, end: -20 }} />
        <View className={`mb-4 self-start flex-row items-center gap-2 rounded-full border px-3 py-1.5 ${offers ? 'border-amber-400/50 bg-amber-500/10' : 'border-primary/30 bg-primary/10'}`}>
          {offers ? <Flame size={15} color="#D97706" /> : <Sparkles size={15} color="#B8860B" />}
          <Text className={`text-[11px] font-black ${offers ? 'text-amber-900' : 'text-primary'}`}>
            {offers ? l('عروض وتخفيضات موسمية حصرية', 'Exclusive Seasonal Offers') : l('وصل حديثاً لهذا الموسم', 'Latest Season Drops')}
          </Text>
        </View>
        <Text className={`${isAr ? 'text-right' : 'text-left'} text-3xl font-black leading-10 text-text-primary`}>
          {offers ? l('تخفيضات حصرية تصل حتى 25%', 'Exclusive Sale Up To 25% Off') : l('أحدث التشكيلات العالمية الأصلية', 'New In — Latest Authentic Arrivals')}
        </Text>
        <Text className={`${isAr ? 'text-right' : 'text-left'} mt-3 text-sm leading-6 text-text-secondary`}>
          {offers
            ? l('استمتع بأقوى العروض على أشهر الماركات الأوروبية والعالمية — جميع المنتجات أصلية 100%.', 'Discover top deals on iconic global brands — 100% authentic items.')
            : l('استكشف أحدث ما وصل إلى يورو ستور من السنيكرز، الملابس، العطور، والإكسسوارات الفاخرة من أشهر العلامات التجارية العالمية.', 'Explore our latest curated selection of sneakers, designer apparel, luxury fragrances, and accessories from iconic brands.')}
        </Text>
        {offers ? (
          <View className="mt-5 self-start flex-row flex-wrap items-center gap-2 rounded-2xl border border-amber-300 bg-white/90 px-4 py-2.5">
            <Percent size={15} color="#D97706" />
            <Text className="text-xs font-bold text-text-primary">{l('كود خصم ترحيبي إضافي 10%:', 'Extra 10% Welcome Coupon:')}</Text>
            <Text className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-black tracking-wider text-amber-900">WELCOME10</Text>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

function FilterSection({ title, options, selected, label, onToggle }: { title: string; options: CatalogFilterOption[]; selected: string[]; label: (option: CatalogFilterOption) => string; onToggle: (id: string) => void }) {
  if (!options.length) return null;
  return (
    <View className="mb-7">
      <Text className="mb-3 text-lg font-bold text-text-primary">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.id);
          return <Pressable key={option.id} accessibilityState={{ selected: active }} onPress={() => onToggle(option.id)} className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${active ? 'border-primary bg-primary/10' : 'border-border bg-background-secondary'}`}>{option.hex_color ? <View style={{ backgroundColor: option.hex_color }} className="h-4 w-4 rounded-full border border-border" /> : null}<Text className={`text-sm font-bold ${active ? 'text-primary' : 'text-text-primary'}`}>{label(option)} ({option.count})</Text></Pressable>;
        })}
      </View>
    </View>
  );
}
