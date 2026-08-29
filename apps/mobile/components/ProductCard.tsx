import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';

export type ProductCardProps = {
  id: string;
  slug: string;
  title: string;
  price: number;
  comparePrice?: number | null;
  imageUrl: string;
  maxQuantity: number;
  variantId: string | null;
  hasMultipleVariants?: boolean;
  isNew?: boolean;
  discountPercentage?: number | null;
};

export function ProductCard(props: ProductCardProps) {
  const { id, slug, title, price, comparePrice, imageUrl, maxQuantity, variantId, hasMultipleVariants, isNew, discountPercentage } = props;
  const addItem = useCartStore((state) => state.addItem);
  const { addItem: addWishlist, removeItem: removeWishlist, hasItem } = useWishlistStore();
  const { user } = useAuth();
  const { t, formatCurrency } = usePreferences();
  const isWishlisted = hasItem(id);
  const imageSource = imageUrl ? { uri: imageUrl } : require('../assets/icon.png');

  function openProduct() {
    router.push(`/products/${encodeURIComponent(slug)}`);
  }

  function handleAddToCart() {
    if (maxQuantity <= 0 || !variantId || hasMultipleVariants) {
      openProduct();
      return;
    }
    addItem({ itemType: 'variant', itemId: variantId, productId: id, variantId, title, price, quantity: 1, imageUrl, maxQuantity });
  }

  async function toggleWishlist() {
    if (user) {
      try {
        const result = await apiFetch<{ in_wishlist: boolean }>('/api/wishlist', {
          method: 'POST',
          body: JSON.stringify({ product_id: id }),
        });
        if (result.in_wishlist && variantId) addWishlist({ productId: id, variantId, title, price, imageUrl, maxQuantity });
        else removeWishlist(id);
      } catch {
        return;
      }
      return;
    }
    if (isWishlisted) removeWishlist(id);
    else if (variantId) addWishlist({ productId: id, variantId, title, price, imageUrl, maxQuantity });
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} className="w-full overflow-hidden rounded-lg border border-border bg-background-card" onPress={openProduct}>
      <View className="relative h-48 w-full bg-background-secondary">
        <Image source={imageSource} className="h-full w-full" resizeMode="cover" accessibilityLabel={title} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isWishlisted ? `${t('common.delete')} ${title}` : `${t('profile.wishlist')}: ${title}`}
          onPress={(event) => { event.stopPropagation(); void toggleWishlist(); }}
          className="absolute start-2 top-2 z-10 h-9 w-9 items-center justify-center rounded-full bg-black/65"
        >
          <Heart size={18} color={isWishlisted ? '#EF4444' : '#FFFFFF'} fill={isWishlisted ? '#EF4444' : 'transparent'} />
        </Pressable>
        <View className="absolute end-2 top-2 flex-row gap-1">
          {discountPercentage && discountPercentage > 0 ? <View className="rounded bg-error px-2 py-1"><Text className="text-xs font-bold text-white">{t('common.sale', { percent: discountPercentage })}</Text></View> : null}
          {isNew ? <View className="rounded bg-black/70 px-2 py-1"><Text className="text-xs font-bold text-white">{t('common.new')}</Text></View> : null}
        </View>
      </View>
      <View className="p-3">
        <Text className="text-sm font-bold text-text-primary" numberOfLines={2}>{title}</Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <Text className="font-bold text-primary">{formatCurrency(price)}</Text>
          {comparePrice && comparePrice > price ? <Text className="text-xs text-text-muted line-through">{formatCurrency(comparePrice)}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${maxQuantity > 0 ? t('common.addToCart') : t('common.unavailable')}: ${title}`}
          className={`mt-3 flex-row items-center justify-center gap-2 rounded-lg border py-2 ${maxQuantity > 0 ? 'border-primary/30 bg-primary/10' : 'border-border opacity-60'}`}
          onPress={(event) => { event.stopPropagation(); handleAddToCart(); }}
        >
          <ShoppingBag size={15} color="#B8860B" />
          <Text className="text-xs font-bold text-primary">{maxQuantity > 0 ? t('common.addToCart') : t('common.unavailable')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
