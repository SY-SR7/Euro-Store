import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ProductCard, type ProductCardProps } from '../../components/ProductCard';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiFetch } from '../../utils/api';
import type { CatalogFilterOption, CatalogFilters, CatalogResponse } from '../../utils/catalog';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';
type Suggestion = { type: 'category' | 'product'; id: string; name: string; slug: string };

const EMPTY_FILTERS: CatalogFilters = { categories: [], brands: [], attributes: [] };

export default function ProductsScreen() {
  const params = useLocalSearchParams<{ categoryId?: string; title?: string }>();
  const { locale, isAr, t } = usePreferences();
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(params.categoryId ? [params.categoryId] : []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const filterSignature = JSON.stringify({ selectedCategories, selectedBrands, selectedAttributes, minPrice, maxPrice });

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
        const result = await fetchCatalog(1);
        if (!active) return;
        setProducts(result.data.map(toCard));
        setFilters(result.filters ?? EMPTY_FILTERS);
        setTotal(result.total);
        setPage(1);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [debouncedQuery, locale, sort, filterSignature, reloadToken]);

  async function fetchCatalog(targetPage: number): Promise<CatalogResponse> {
    const search = new URLSearchParams({ page: String(targetPage), per_page: '20', sort });
    if (debouncedQuery) search.set('search', debouncedQuery);
    selectedCategories.forEach((id) => search.append('category_id', id));
    selectedBrands.forEach((id) => search.append('brand_id', id));
    Object.entries(selectedAttributes).forEach(([slug, values]) => values.forEach((id) => search.append('attrs', `${slug}:${id}`)));
    if (minPrice.trim()) search.set('min_price', minPrice.trim());
    if (maxPrice.trim()) search.set('max_price', maxPrice.trim());
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

  async function loadMore() {
    if (loadingMore || products.length >= total) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchCatalog(nextPage);
      setProducts((current) => [...current, ...result.data.map(toCard)]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
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
      <View className="border-b border-border px-5 py-4">
        <View className="mb-4 flex-row items-center gap-3">
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full border border-border">
            <BackIcon size={20} color="#B8860B" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text-primary">{params.title || t('catalog.allProducts')}</Text>
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
        <View className="flex-1 items-center justify-center px-6"><Text className="mb-5 text-center text-text-secondary">{t('catalog.searchError')}</Text><Pressable onPress={() => setReloadToken((value) => value + 1)} className="rounded-lg bg-primary px-5 py-3"><Text className="font-bold text-[#0F0F0F]">{t('common.retry')}</Text></Pressable></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => <View style={{ flex: 1, maxWidth: '50%', marginBottom: 12 }}><ProductCard {...item} /></View>}
          ListEmptyComponent={<Text className="py-20 text-center text-text-secondary">{t('catalog.noResults')}</Text>}
          ListFooterComponent={products.length < total ? <Pressable disabled={loadingMore} onPress={() => void loadMore()} className="mx-auto mt-4 rounded-lg border border-primary px-6 py-3">{loadingMore ? <ActivityIndicator color="#B8860B" /> : <Text className="font-bold text-primary">{t('catalog.loadMore')}</Text>}</Pressable> : null}
        />
      )}

      <Modal visible={filterOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFilterOpen(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <Text className="text-xl font-bold text-text-primary">{t('catalog.filters')}</Text>
            <Pressable accessibilityLabel={t('common.cancel')} onPress={() => setFilterOpen(false)} className="h-10 w-10 items-center justify-center"><X size={22} color="#B8860B" /></Pressable>
          </View>
          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 20 }}>
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
            <Pressable onPress={() => setFilterOpen(false)} className="flex-1 rounded-lg bg-primary p-4"><Text className="text-center font-bold text-[#0F0F0F]">{t('catalog.apply')}</Text></Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
