import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ProductCard, type ProductCardProps } from '../../components/ProductCard';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiFetch } from '../../utils/api';

type CollectionResponse = {
  collection: { name_ar: string; name_en: string; description_ar: string | null; description_en: string | null };
  products: Array<{ id: string; slug: string; name_ar: string; name_en: string; price: number; compare_price: number | null; discount_percentage: number | null; image_url: string; total_stock: number; default_variant_id: string | null; variants_count: number; created_at: string }>;
};

export default function CollectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAr, l } = usePreferences();
  const [data, setData] = useState<CollectionResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    apiFetch<CollectionResponse>(`/api/collections/${encodeURIComponent(slug)}`)
      .then(setData)
      .catch(() => setError(true));
  }, [slug]);

  if (!data && !error) return <SafeAreaView className="flex-1 items-center justify-center bg-background"><ActivityIndicator size="large" color="#B8860B" /></SafeAreaView>;
  if (!data) return <SafeAreaView className="flex-1 bg-background"><ScreenHeader title={l('التشكيلة', 'Collection')} /><View className="flex-1 items-center justify-center px-6"><Text className="text-center text-text-secondary">{l('تعذر تحميل هذه التشكيلة.', 'This collection could not be loaded.')}</Text></View></SafeAreaView>;

  const cards: ProductCardProps[] = data.products.map((product) => ({
    id: product.id, slug: product.slug, title: isAr ? product.name_ar : product.name_en,
    secondaryTitle: isAr ? product.name_en : product.name_ar, price: product.price,
    comparePrice: product.compare_price, imageUrl: product.image_url, maxQuantity: product.total_stock,
    variantId: product.default_variant_id, variantCount: product.variants_count,
    hasMultipleVariants: product.variants_count > 1, discountPercentage: product.discount_percentage,
    isNew: Date.now() - new Date(product.created_at).getTime() <= 30 * 86_400_000,
  }));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={isAr ? data.collection.name_ar : data.collection.name_en} />
      <FlatList
        data={cards}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={<View className="mb-8 rounded-3xl border border-border bg-background-card p-6"><Text className="text-3xl font-black text-text-primary">{isAr ? data.collection.name_ar : data.collection.name_en}</Text><Text className="mt-3 leading-6 text-text-secondary">{(isAr ? data.collection.description_ar : data.collection.description_en) || ''}</Text></View>}
        ListEmptyComponent={<Text className="py-20 text-center text-text-muted">{l('لا توجد منتجات في هذه التشكيلة حالياً', 'No products in this collection yet.')}</Text>}
        renderItem={({ item }) => <View style={{ flex: 1, maxWidth: '50%', marginBottom: 12 }}><ProductCard {...item} /></View>}
      />
    </SafeAreaView>
  );
}
