import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Minus, Plus, Ruler, Share2, ShoppingBag, X } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, SafeAreaView, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useCartStore } from '../../store/cartStore';
import { apiFetch } from '../../utils/api';
import type { ProductAttributeValue, ProductBundle, ProductDetailResponse, ProductVariant, ReviewResponse, SizeGuide } from '../../utils/catalog';

type MediaItem = { id: string; type: 'image' | 'video'; url: string; alt?: string };

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const slug = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const { isAr, t, formatCurrency, formatDate } = usePreferences();
  const addItem = useCartStore((state) => state.addItem);
  const [payload, setPayload] = useState<ProductDetailResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse>({ average: 0, count: 0, reviews: [] });
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { width: viewportWidth } = useWindowDimensions();

  useEffect(() => {
    let active = true;
    async function load() {
      if (!slug) return;
      setLoading(true);
      setError(false);
      try {
        const detail = await apiFetch<ProductDetailResponse>(`/api/products/${encodeURIComponent(slug)}`);
        if (!active) return;
        setPayload(detail);
        const firstVariant = detail.product.product_variants.find((variant) => variant.stock_quantity > 0) ?? detail.product.product_variants[0] ?? null;
        setSelectedVariant(firstVariant);
        if (detail.product.id) {
          apiFetch<ReviewResponse>(`/api/reviews?product_id=${encodeURIComponent(detail.product.id)}`)
            .then((result) => { if (active) setReviews(result); })
            .catch(() => undefined);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [slug]);

  const product = payload?.product ?? null;
  const name = product ? (isAr ? product.name_ar : product.name_en) : '';
  const description = product ? (isAr ? product.description_ar : product.description_en) : null;
  const imageUrl = product?.product_images[0]?.url ?? '';
  const media = useMemo<MediaItem[]>(() => product ? [
    ...product.product_images.map((item) => ({ id: item.id, type: 'image' as const, url: item.url, alt: isAr ? item.alt_ar ?? name : item.alt_en ?? name })),
    ...product.product_videos.map((item) => ({ id: item.id, type: 'video' as const, url: item.url })),
  ] : [], [isAr, name, product]);
  const attributeGroups = useMemo(() => collectAttributes(product?.product_variants ?? []), [product]);
  const maxQuantity = Math.max(0, Number(selectedVariant?.stock_quantity ?? 0));
  const price = Number(selectedVariant?.price_syp ?? 0);
  const comparePrice = Number(selectedVariant?.compare_price_syp ?? 0);
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  function selectAttribute(value: ProductAttributeValue) {
    if (!product) return;
    const candidates = product.product_variants.filter((variant) => variant.variant_attributes.some((attribute) => attribute.attribute_values.id === value.id));
    const next = candidates.find((variant) => variant.stock_quantity > 0) ?? candidates[0] ?? null;
    setSelectedVariant(next);
    setQuantity(1);
  }

  function selectedValueId(slugValue: string): string | null {
    return selectedVariant?.variant_attributes.find((attribute) => attribute.attribute_values.attribute_types.slug === slugValue)?.attribute_values.id ?? null;
  }

  async function subscribeToStock() {
    if (!user) { router.push('/login'); return; }
    if (!selectedVariant) return;
    setNotifying(true);
    try {
      await apiFetch(`/api/product-variants/${encodeURIComponent(selectedVariant.id)}/notify-me`, { method: 'POST' });
      Alert.alert(t('product.notifySuccessTitle'), t('product.notifySuccessBody'));
    } catch {
      Alert.alert(t('product.notifyErrorTitle'), t('product.notifyErrorBody'));
    } finally {
      setNotifying(false);
    }
  }

  function addSelectedVariant() {
    if (!product || !selectedVariant || maxQuantity <= 0) return;
    addItem({
      itemType: 'variant',
      itemId: selectedVariant.id,
      productId: product.id,
      variantId: selectedVariant.id,
      title: name,
      price,
      quantity,
      imageUrl,
      maxQuantity,
    });
    router.push('/(tabs)/cart');
  }

  function addBundle(bundle: ProductBundle) {
    const available = Math.min(...bundle.bundle_items.map((item) => Math.floor(Number(item.product_variant.stock_quantity ?? 0) / Math.max(1, item.quantity))));
    if (available <= 0) return;
    const firstProduct = bundle.bundle_items[0]?.product_variant.products;
    const bundleName = isAr ? bundle.name_ar : bundle.name_en;
    const bundleImage = firstProduct?.product_images.find((item) => item.is_primary)?.url ?? firstProduct?.product_images[0]?.url ?? '';
    addItem({
      itemType: 'bundle',
      itemId: bundle.id,
      productId: bundle.id,
      variantId: bundle.id,
      title: bundleName,
      price: Number(bundle.bundle_price),
      quantity: 1,
      imageUrl: bundleImage,
      maxQuantity: available,
    });
    router.push('/(tabs)/cart');
  }

  if (loading) return <SafeAreaView className="flex-1 items-center justify-center bg-background"><ActivityIndicator size="large" color="#B8860B" /></SafeAreaView>;
  if (error || !product || !payload) return <SafeAreaView className="flex-1 items-center justify-center bg-background px-6"><Text className="mb-5 text-center text-text-secondary">{error ? t('product.loadError') : t('product.notFound')}</Text><Pressable onPress={() => router.back()} className="rounded-lg bg-primary px-6 py-3"><Text className="font-bold text-[#0F0F0F]">{t('common.back')}</Text></Pressable></SafeAreaView>;

  const productUrl = `${(process.env.EXPO_PUBLIC_APP_URL || '').replace(/\/$/, '')}/products/${encodeURIComponent(product.slug)}`;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="absolute start-4 end-4 top-12 z-30 flex-row justify-between">
        <Pressable accessibilityLabel={t('common.back')} onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full bg-black/70"><BackIcon size={21} color="#FFFFFF" /></Pressable>
        <Pressable accessibilityLabel={t('product.share')} onPress={() => void Share.share({ message: `${name}\n${productUrl}`, url: productUrl })} className="h-11 w-11 items-center justify-center rounded-full bg-black/70"><Share2 size={20} color="#FFFFFF" /></Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <FlatList
          data={media.length ? media : [{ id: 'fallback', type: 'image', url: '' } as MediaItem]}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ width: viewportWidth, height: 430 }} className="bg-background-secondary">
              {item.type === 'video' ? (
                <Video source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} useNativeControls resizeMode={ResizeMode.CONTAIN} />
              ) : (
                <Image source={item.url ? { uri: item.url } : require('../../assets/icon.png')} className="h-full w-full" resizeMode="cover" accessibilityLabel={item.alt ?? name} />
              )}
            </View>
          )}
        />

        <View className="px-5 py-6">
          <View className="mb-2 flex-row flex-wrap items-center gap-2">
            {product.brands?.name ? <Text className="text-sm font-bold text-primary">{product.brands.name}</Text> : null}
            {product.is_on_sale && product.discount_percentage ? <Text className="rounded bg-error px-2 py-1 text-xs font-bold text-white">{t('common.sale', { percent: product.discount_percentage })}</Text> : null}
          </View>
          <Text className="text-3xl font-black leading-tight text-text-primary">{name}</Text>
          <View className="mt-3 flex-row items-center gap-3">
            <Text className="text-2xl font-black text-primary">{formatCurrency(price)}</Text>
            {comparePrice > price ? <Text className="text-base text-text-muted line-through">{formatCurrency(comparePrice)}</Text> : null}
          </View>
          <Text className={`mt-2 text-sm font-bold ${maxQuantity > 0 ? 'text-success' : 'text-error'}`}>{maxQuantity > 0 ? t('product.inStock', { count: maxQuantity }) : t('product.outOfStock')}</Text>

          {attributeGroups.length ? (
            <View className="mt-7 border-t border-border pt-6">
              <Text className="mb-4 text-lg font-bold text-text-primary">{t('product.selectOptions')}</Text>
              {attributeGroups.map((group) => (
                <View key={group.slug} className="mb-5">
                  <Text className="mb-2 font-bold text-text-secondary">{isAr ? group.name_ar : group.name_en}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {group.values.map((value) => {
                      const active = selectedValueId(group.slug) === value.id;
                      return <Pressable key={value.id} accessibilityState={{ selected: active }} onPress={() => selectAttribute(value)} className={`flex-row items-center gap-2 rounded-lg border px-4 py-3 ${active ? 'border-primary bg-primary/10' : 'border-border bg-background-secondary'}`}>{value.hex_color ? <View style={{ backgroundColor: value.hex_color }} className="h-5 w-5 rounded-full border border-border" /> : null}<Text className={`font-bold ${active ? 'text-primary' : 'text-text-primary'}`}>{isAr ? value.value_ar : value.value_en}</Text></Pressable>;
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View className="mt-2 flex-row items-center justify-between border-y border-border py-5">
            <Text className="font-bold text-text-primary">{t('product.quantity')}</Text>
            <View className="flex-row items-center gap-4">
              <Pressable accessibilityLabel="-" disabled={quantity <= 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 items-center justify-center rounded-full border border-border disabled:opacity-40"><Minus size={17} color="#B8860B" /></Pressable>
              <Text className="min-w-8 text-center text-lg font-bold text-text-primary">{quantity}</Text>
              <Pressable accessibilityLabel="+" disabled={quantity >= maxQuantity} onPress={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} className="h-10 w-10 items-center justify-center rounded-full border border-border disabled:opacity-40"><Plus size={17} color="#B8860B" /></Pressable>
            </View>
          </View>

          {payload.size_guide ? <Pressable onPress={() => setSizeGuideOpen(true)} className="mt-5 flex-row items-center justify-between border-b border-border py-4"><View className="flex-row items-center gap-3"><Ruler size={20} color="#B8860B" /><Text className="font-bold text-text-primary">{t('product.sizeGuide')}</Text></View><ChevronDown size={18} color="#737373" /></Pressable> : null}

          <View className="mt-7">
            <Text className="mb-2 text-lg font-bold text-text-primary">{t('product.description')}</Text>
            <Text className="leading-7 text-text-secondary">{description || t('product.noDescription')}</Text>
          </View>

          {payload.bundles.length ? <View className="mt-8"><Text className="mb-4 text-xl font-bold text-text-primary">{t('product.bundles')}</Text>{payload.bundles.map((bundle) => <BundleRow key={bundle.id} bundle={bundle} isAr={isAr} onAdd={() => addBundle(bundle)} formatCurrency={formatCurrency} t={t} />)}</View> : null}

          <View className="mt-8">
            <View className="mb-4 flex-row items-end justify-between"><Text className="text-xl font-bold text-text-primary">{t('product.reviews')}</Text><Text className="font-bold text-primary">★ {reviews.average.toFixed(1)} · {t('product.reviewCount', { count: reviews.count })}</Text></View>
            {!reviews.reviews.length ? <Text className="text-text-secondary">{t('product.noReviews')}</Text> : reviews.reviews.map((review) => <View key={review.id} className="border-t border-border py-4"><View className="flex-row justify-between gap-3"><Text className="font-bold text-text-primary">{review.customer_name}</Text><Text className="text-primary">{'★'.repeat(review.rating)}</Text></View>{review.comment ? <Text className="mt-2 leading-6 text-text-secondary">{review.comment}</Text> : null}<Text className="mt-2 text-xs text-text-muted">{formatDate(review.created_at, false)}</Text></View>)}
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 start-0 end-0 flex-row items-center justify-between gap-4 border-t border-border bg-background-card px-5 py-4">
        <View><Text className="text-xs text-text-muted">{t('product.totalPrice')}</Text><Text className="text-lg font-black text-text-primary">{formatCurrency(price * quantity)}</Text></View>
        <Pressable disabled={!selectedVariant || notifying} onPress={() => { if (maxQuantity > 0) addSelectedVariant(); else void subscribeToStock(); }} className="min-w-48 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 disabled:opacity-50"><ShoppingBag size={19} color="#0F0F0F" /><Text className="font-bold text-[#0F0F0F]">{maxQuantity > 0 ? t('common.addToCart') : notifying ? t('product.notifying') : t('product.notify')}</Text></Pressable>
      </View>

      <SizeGuideModal guide={payload.size_guide} visible={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} t={t} />
    </SafeAreaView>
  );
}

function collectAttributes(variants: ProductVariant[]) {
  const groups = new Map<string, { slug: string; name_ar: string; name_en: string; values: ProductAttributeValue[] }>();
  variants.forEach((variant) => variant.variant_attributes.forEach(({ attribute_values: value }) => {
    const type = value.attribute_types;
    const group = groups.get(type.slug) ?? { slug: type.slug, name_ar: type.name_ar, name_en: type.name_en, values: [] };
    if (!group.values.some((item) => item.id === value.id)) group.values.push(value);
    groups.set(type.slug, group);
  }));
  const list = [...groups.values()];
  const order: Record<string, number> = { color: 1, size: 2, material: 3 };
  list.sort((a, b) => (order[a.slug] ?? 99) - (order[b.slug] ?? 99));
  return list;
}

function BundleRow({ bundle, isAr, onAdd, formatCurrency, t }: { bundle: ProductBundle; isAr: boolean; onAdd: () => void; formatCurrency: (value: number) => string; t: (key: string, params?: Record<string, string | number>) => string }) {
  const available = bundle.bundle_items.every((item) => Number(item.product_variant.stock_quantity) >= item.quantity);
  return <View className="mb-3 border border-border bg-background-secondary p-4"><View className="flex-row justify-between gap-4"><View className="flex-1"><Text className="font-bold text-text-primary">{isAr ? bundle.name_ar : bundle.name_en}</Text><Text className="mt-1 text-xs text-text-muted">{t('product.bundleItems', { count: bundle.bundle_items.length })}</Text><Text className="mt-2 text-lg font-black text-primary">{formatCurrency(Number(bundle.bundle_price))}</Text></View><Pressable disabled={!available} onPress={onAdd} className="self-center rounded-lg border border-primary px-4 py-3 disabled:opacity-40"><Text className="font-bold text-primary">{available ? t('product.bundleAdd') : t('common.unavailable')}</Text></Pressable></View></View>;
}

function SizeGuideModal({ guide, visible, onClose, t }: { guide: SizeGuide; visible: boolean; onClose: () => void; t: (key: string) => string }) {
  const table = parseSizeGuide(guide?.content);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View className="flex-1 justify-end bg-black/60"><View className="max-h-[80%] bg-background-card"><View className="flex-row items-center justify-between border-b border-border p-5"><Text className="text-xl font-bold text-text-primary">{guide?.name ?? t('product.sizeGuide')}</Text><Pressable accessibilityLabel={t('product.close')} onPress={onClose} className="h-10 w-10 items-center justify-center"><X size={22} color="#B8860B" /></Pressable></View><ScrollView horizontal contentContainerStyle={{ padding: 20 }}><View>{table.headers.length ? <View className="flex-row bg-background-elevated">{table.headers.map((header) => <Text key={header} className="w-28 border border-border p-3 text-center font-bold text-text-primary">{header}</Text>)}</View> : null}{table.rows.map((row, rowIndex) => <View key={rowIndex} className="flex-row">{row.map((cell, cellIndex) => <Text key={`${rowIndex}-${cellIndex}`} className="w-28 border border-border p-3 text-center text-text-secondary">{cell}</Text>)}</View>)}</View></ScrollView></View></View></Modal>;
}

function parseSizeGuide(content: unknown): { headers: string[]; rows: string[][] } {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return { headers: [], rows: [] };
  const value = content as Record<string, unknown>;
  const headers = Array.isArray(value.headers) ? value.headers.map(String) : [];
  const rows = Array.isArray(value.rows)
    ? value.rows.filter((row): row is unknown[] => Array.isArray(row)).map((row) => row.map(String).slice(0, headers.length))
    : [];
  return { headers, rows };
}
