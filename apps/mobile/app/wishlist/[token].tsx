import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ProductCard, type ProductCardProps } from '../../components/ProductCard';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiFetch } from '../../utils/api';

type SharedWishlistResponse = {
  owner_name: string;
  items: Array<{ wishlist_id: string; product_id: string; slug: string; name_ar: string; name_en: string; image_url: string; min_price_syp: number; in_stock: boolean }>;
};

export default function SharedWishlistScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { isAr, l } = usePreferences();
  const [data, setData] = useState<SharedWishlistResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<SharedWishlistResponse>(`/api/wishlist/shared/${encodeURIComponent(token)}`).then(setData).catch(() => setError(true));
  }, [token]);

  if (!data && !error) return <SafeAreaView className="flex-1 items-center justify-center bg-background"><ActivityIndicator size="large" color="#B8860B" /></SafeAreaView>;
  const firstName = data?.owner_name?.split(' ')[0] ?? '';
  const title = data ? (isAr ? `قائمة أمنيات ${firstName}` : `${firstName}'s Wishlist`) : l('قائمة الأمنيات', 'Wishlist');
  const cards: ProductCardProps[] = (data?.items ?? []).map((item) => ({ id: item.product_id, slug: item.slug, title: isAr ? item.name_ar : item.name_en, secondaryTitle: isAr ? item.name_en : item.name_ar, price: item.min_price_syp, imageUrl: item.image_url, maxQuantity: item.in_stock ? 1 : 0, variantId: null }));
  return <SafeAreaView className="flex-1 bg-background"><ScreenHeader title={title} />{error ? <View className="flex-1 items-center justify-center px-6"><Text className="text-center text-text-secondary">{l('هذه القائمة غير متاحة.', 'This wishlist is unavailable.')}</Text></View> : <FlatList data={cards} numColumns={2} keyExtractor={(item) => item.id} columnWrapperStyle={{ gap: 12 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} ListHeaderComponent={<View className="mb-6 flex-row items-center gap-3"><Heart size={24} color="#B8860B" fill="#B8860B" /><Text className="text-2xl font-black text-text-primary">{title}</Text></View>} ListEmptyComponent={<Text className="py-20 text-center text-text-muted">{l('هذه القائمة فارغة حالياً', 'This wishlist is currently empty')}</Text>} renderItem={({ item }) => <View style={{ flex: 1, maxWidth: '50%', marginBottom: 12 }}><ProductCard {...item} /></View>} />}</SafeAreaView>;
}
