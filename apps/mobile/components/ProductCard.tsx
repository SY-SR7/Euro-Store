import React from 'react';
import { CheckCircle2, Heart, Layers3, TriangleAlert } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useWishlistStore } from '../store/wishlistStore';

export type ProductCardProps = {
  id: string;
  slug: string;
  title: string;
  secondaryTitle?: string;
  price: number;
  comparePrice?: number | null;
  imageUrl: string;
  maxQuantity: number;
  variantId: string | null;
  hasMultipleVariants?: boolean;
  isNew?: boolean;
  discountPercentage?: number | null;
  variantCount?: number;
};

export const ProductCard = React.memo(function ProductCard(props: ProductCardProps) {
  const { id, slug, title, secondaryTitle, price, comparePrice, imageUrl, maxQuantity, variantId, hasMultipleVariants, isNew, discountPercentage, variantCount } = props;
  const { addItem: addWishlist, removeItem: removeWishlist, hasItem } = useWishlistStore();
  const { user } = useAuth();
  const { t, l, formatCurrency } = usePreferences();
  const isWishlisted = hasItem(id);
  const imageSource = imageUrl ? { uri: imageUrl } : require('../assets/icon.png');

  function openProduct() {
    router.push(`/products/${encodeURIComponent(slug)}`);
  }

  async function toggleWishlist() {
    if (user) {
      try {
        const result = await apiFetch<{ in_wishlist: boolean }>('/api/wishlist', {
          method: 'POST',
          body: JSON.stringify({ product_id: id }),
        });
        if (result.in_wishlist && variantId) addWishlist({ productId: id, slug, variantId, title, price, imageUrl, maxQuantity });
        else removeWishlist(id);
      } catch {
        return;
      }
      return;
    }
    if (isWishlisted) removeWishlist(id);
    else if (variantId) addWishlist({ productId: id, slug, variantId, title, price, imageUrl, maxQuantity });
  }

  return (
    <View className="w-full overflow-hidden rounded-2xl border border-border bg-background-card">
      <View className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          className="h-full w-full"
          onPress={openProduct}
          style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}
        >
          <Image source={imageSource} className="h-full w-full" resizeMode="contain" accessibilityLabel={title} />
          <View pointerEvents="none" className="absolute end-2 top-2 items-end gap-1">
            {isNew ? <View className="rounded-full border border-border bg-white px-2 py-1"><Text className="text-[9px] font-black text-text-primary">{t('common.new')}</Text></View> : null}
          </View>
          {discountPercentage && discountPercentage > 0 ? <View className="absolute bottom-2 start-2 rounded-lg border border-amber-300 bg-amber-500 px-2 py-1"><Text className="text-[10px] font-black text-amber-950">-{discountPercentage}%</Text></View> : null}
          <View className={`absolute bottom-2 end-2 flex-row items-center gap-1 rounded-full px-2 py-1 ${maxQuantity > 5 ? 'bg-green-50' : maxQuantity > 0 ? 'bg-amber-50' : 'bg-red-50'}`}>
            {maxQuantity > 5 ? <CheckCircle2 size={11} color="#15803D" /> : <TriangleAlert size={11} color={maxQuantity > 0 ? '#B45309' : '#B91C1C'} />}
            <Text className={`text-[9px] font-bold ${maxQuantity > 5 ? 'text-green-700' : maxQuantity > 0 ? 'text-amber-700' : 'text-red-700'}`}>
              {maxQuantity > 5 ? l('متوفر', 'In stock') : maxQuantity > 0 ? l(`${maxQuantity} فقط`, `Only ${maxQuantity}`) : t('product.outOfStock')}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isWishlisted ? `${t('common.delete')} ${title}` : `${t('profile.wishlist')}: ${title}`}
          onPress={() => void toggleWishlist()}
          className="absolute start-2 top-2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90"
        >
          <Heart size={18} color={isWishlisted ? '#B91C1C' : '#44403C'} fill={isWishlisted ? '#B91C1C' : 'transparent'} />
        </Pressable>
      </View>
      <View className="min-h-[132px] px-3 pb-3 pt-3">
        <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={openProduct}>
          <Text className="text-sm font-black leading-5 text-text-primary" numberOfLines={2}>{title}</Text>
        </Pressable>
        {secondaryTitle ? <Text className="mt-0.5 text-[10px] text-text-muted" numberOfLines={1}>{secondaryTitle}</Text> : null}
        {(hasMultipleVariants || (variantCount ?? 0) > 1) ? (
          <View className="mt-2 self-start flex-row items-center gap-1 rounded-full bg-background px-2 py-1">
            <Layers3 size={10} color="#B8860B" />
            <Text className="text-[9px] font-bold text-text-secondary">{l(`${variantCount ?? 2} خيارات`, `${variantCount ?? 2} options`)}</Text>
          </View>
        ) : null}
        <View className="mt-auto flex-row flex-wrap items-center gap-2 pt-2">
          <Text className="text-sm font-black text-primary">{formatCurrency(price)}</Text>
          {comparePrice && comparePrice > price ? <Text className="text-xs text-text-muted line-through">{formatCurrency(comparePrice)}</Text> : null}
        </View>
      </View>
    </View>
  );
});
