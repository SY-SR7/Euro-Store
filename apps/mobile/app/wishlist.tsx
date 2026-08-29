import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';

export default function WishlistScreen() {
  const { items, removeItem, replaceItems } = useWishlistStore();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
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
            await apiFetch('/api/wishlist', { method: 'POST', body: JSON.stringify({ product_id: localItem.productId }) });
          }
        }
        const result = await apiFetch<{ items: Array<Record<string, unknown>> }>('/api/wishlist');
        if (!active) return;
        replaceItems(result.items.flatMap((item) => {
          if (!item.variant_id) return [];
          return [{
            productId: String(item.product_id),
            variantId: String(item.variant_id),
            title: String((isAr ? item.name_ar : item.name_en) || item.name_ar || item.name_en || ''),
            price: Number(item.min_price_syp || 0),
            imageUrl: String(item.image_url || ''),
            maxQuantity: Number(item.max_quantity || 0),
          }];
        }));
      } finally {
        if (active) setSyncing(false);
      }
    }
    void sync();
    return () => { active = false; };
  }, [isAr, user?.id]);

  const handleAddToCart = (item: any) => {
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
  };

  const handleRemove = async (productId: string) => {
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
      // Keep the item visible when the server could not confirm removal.
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader title={l('المفضلة', 'Wishlist')} action={syncing ? <Text className='text-xs text-text-secondary'>{l('مزامنة...', 'Syncing...')}</Text> : null} />

      <ScrollView className='flex-1 p-6'>
        {items.length === 0 ? (
          <View className='items-center justify-center py-20'>
            <Text className='text-text-secondary text-lg font-bold'>{l('لا توجد منتجات في المفضلة', 'Your wishlist is empty')}</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.productId} className='bg-background-secondary p-4 rounded-xl border border-border mb-4 flex-row'>
              <View className='w-24 h-24 bg-background rounded-lg overflow-hidden border border-border'>
                <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/icon.png')} className='w-full h-full' resizeMode='cover' />
              </View>
              
              <View className='ms-4 flex-1 justify-center'>
                <Text className='text-text-primary font-bold text-base mb-1' numberOfLines={2}>{item.title}</Text>
                <Text className='text-primary font-bold'>{formatCurrency(item.price)}</Text>
                
                <View className='flex-row mt-3 justify-between items-center'>
                  <TouchableOpacity 
                    className='bg-primary/20 px-4 py-2 rounded-lg'
                    onPress={() => handleAddToCart(item)}
                  >
                    <Text className='text-primary font-bold text-xs'>{l('أضف للسلة', 'Add to cart')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className='bg-error/10 px-3 py-2 rounded-lg'
                    onPress={() => { void handleRemove(item.productId); }}
                  >
                    <Text className='text-error font-bold text-xs'>{l('حذف', 'Delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

