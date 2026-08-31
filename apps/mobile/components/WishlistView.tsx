import { router } from 'expo-router';
import { Heart, Share2, ShoppingBag, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useCartStore } from '../store/cartStore';
import { type WishlistItem, useWishlistStore } from '../store/wishlistStore';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from './ScreenHeader';

export function WishlistView({ tab = false }: { tab?: boolean }) {
  const { items, removeItem, replaceItems } = useWishlistStore();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const addItemToCart = useCartStore((state) => state.addItem);
  const { isAr, l, formatCurrency } = usePreferences();

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function sync() {
      setSyncing(true);
      try {
        const first = await apiFetch<{ items: Array<Record<string, unknown>> }>('/api/wishlist');
        const existing = new Set(first.items.map((item) => String(item.product_id)));
        for (const localItem of items) {
          if (!existing.has(localItem.productId)) {
            await apiFetch('/api/wishlist', {
              method: 'POST',
              body: JSON.stringify({ product_id: localItem.productId }),
            });
          }
        }
        const result = await apiFetch<{ items: Array<Record<string, unknown>> }>('/api/wishlist');
        if (!active) return;
        replaceItems(result.items.flatMap((item) => {
          if (!item.variant_id) return [];
          return [{
            productId: String(item.product_id),
            slug: typeof item.slug === 'string' ? item.slug : undefined,
            variantId: String(item.variant_id),
            title: String((isAr ? item.name_ar : item.name_en) || item.name_ar || item.name_en || ''),
            price: Number(item.min_price_syp || 0),
            imageUrl: String(item.image_url || ''),
            maxQuantity: Number(item.max_quantity || 0),
          }];
        }));
      } catch {
        // Keep the local wishlist available offline.
      } finally {
        if (active) setSyncing(false);
      }
    }

    void sync();
    return () => { active = false; };
  }, [isAr, user?.id]);

  function addToCart(item: WishlistItem) {
    addItemToCart({
      itemType: 'variant',
      itemId: item.variantId,
      productId: item.productId,
      variantId: item.variantId,
      title: item.title,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      maxQuantity: item.maxQuantity,
    });
  }

  async function remove(productId: string) {
    if (!user) {
      removeItem(productId);
      return;
    }
    try {
      const result = await apiFetch<{ in_wishlist: boolean }>('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      });
      if (!result.in_wishlist) removeItem(productId);
    } catch {
      // Preserve the item until the server confirms the mutation.
    }
  }

  async function shareWishlist() {
    if (!user) {
      Alert.alert(l('تسجيل الدخول مطلوب', 'Sign in required'), l('سجّل الدخول لمشاركة قائمة متزامنة.', 'Sign in to share a synced wishlist.'));
      return;
    }
    setSharing(true);
    try {
      const result = await apiFetch<{ url: string }>('/api/wishlist/share', { method: 'POST' });
      await Share.share({ message: result.url, url: result.url });
    } catch {
      Alert.alert(l('تعذرت المشاركة', 'Could not share'), l('تأكد أن القائمة غير فارغة ثم حاول مجدداً.', 'Make sure the wishlist is not empty and try again.'));
    } finally {
      setSharing(false);
    }
  }

  const syncAction = syncing ? <ActivityIndicator size="small" color="#B8860B" /> : items.length ? <Pressable accessibilityRole="button" accessibilityLabel={l('مشاركة المفضلة', 'Share wishlist')} disabled={sharing} onPress={() => void shareWishlist()} className="h-10 w-10 items-center justify-center rounded-full border border-border"><Share2 size={18} color="#B8860B" /></Pressable> : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {tab ? (
        <View className="min-h-16 flex-row items-center justify-between border-b border-border bg-background-card px-5">
          <Text className="text-2xl font-black text-text-primary">{l('المفضلة', 'Wishlist')}</Text>
          {syncAction}
        </View>
      ) : <ScreenHeader title={l('المفضلة', 'Wishlist')} action={syncAction} />}

      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 pb-16">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Heart size={34} color="#B8860B" strokeWidth={1.6} />
          </View>
          <Text className="text-center text-xl font-black text-text-primary">{l('مفضلتك بانتظار اختياراتك', 'Your wishlist is ready')}</Text>
          <Text className="mt-2 text-center leading-6 text-text-secondary">{l('احفظ المنتجات التي تعجبك لتجدها بسرعة لاحقًا.', 'Save products you love and find them quickly later.')}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/categories')} className="mt-7 min-h-12 items-center justify-center rounded-lg bg-primary px-7">
            <Text className="font-bold text-[#17130A]">{l('استكشف التصنيفات', 'Explore categories')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <View
              key={item.productId}
              className="mb-4 flex-row rounded-xl bg-background-card p-3"
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => router.push(`/products/${encodeURIComponent(item.slug ?? item.productId)}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
              >
                <Image
                  source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/icon.png')}
                  className="h-28 w-24 rounded-lg bg-background-secondary"
                  resizeMode="cover"
                  accessibilityLabel={item.title}
                />
              </Pressable>
              <View className="ms-4 min-w-0 flex-1 py-1">
                <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={() => router.push(`/products/${encodeURIComponent(item.slug ?? item.productId)}`)}>
                  <Text className="text-base font-bold leading-6 text-text-primary" numberOfLines={2}>{item.title}</Text>
                </Pressable>
                <Text className="mt-1 font-black text-primary">{formatCurrency(item.price)}</Text>
                <View className="mt-auto flex-row items-center gap-2 pt-3">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={l('إضافة إلى السلة', 'Add to cart')}
                    onPress={() => addToCart(item)}
                    className="min-h-10 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary/10"
                  >
                    <ShoppingBag size={16} color="#9A7209" />
                    <Text className="text-xs font-bold text-primary">{l('أضف للسلة', 'Add to cart')}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={l('حذف من المفضلة', 'Remove from wishlist')}
                    onPress={() => void remove(item.productId)}
                    className="h-10 w-10 items-center justify-center rounded-lg bg-error/10"
                  >
                    <Trash2 size={17} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
