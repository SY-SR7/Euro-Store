import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { router } from 'expo-router';

export function ProductCard({ id, title, price, imageUrl }: { id: string; title: string; price: number; imageUrl: string }) {
  const addItem = useCartStore((state) => state.addItem);
  const { addItem: addWishlist, removeItem: removeWishlist, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(id);

  const handleAddToCart = () => {
    addItem({ productId: id, title, price, quantity: 1, imageUrl });
  };

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeWishlist(id);
    } else {
      addWishlist({ productId: id, title, price, imageUrl });
    }
  };

  return (
    <TouchableOpacity 
      className='w-40 mr-4 bg-background-card rounded-2xl overflow-hidden border border-border shadow-sm'
      onPress={() => router.push(`/products/${id}`)}
    >
      <View className='h-48 w-full bg-background-secondary relative'>
        <Image source={{ uri: imageUrl }} className='w-full h-full' resizeMode='cover' />
        
        {/* Wishlist Button */}
        <TouchableOpacity 
          className='absolute top-2 left-2 bg-[#0F0F0F]/60 w-8 h-8 rounded-full items-center justify-center z-10'
          onPress={toggleWishlist}
        >
          <Text className={isWishlisted ? 'text-red-500 font-bold' : 'text-white'}>{isWishlisted ? '♥' : '♡'}</Text>
        </TouchableOpacity>

        <View className='absolute top-2 right-2 bg-[#0F0F0F]/60 px-2 py-1 rounded-full'>
          <Text className='text-white text-xs font-bold'>جديد</Text>
        </View>
      </View>
      <View className='p-3'>
        <Text className='text-text-primary text-sm font-bold truncate' numberOfLines={1}>
          {title}
        </Text>
        <Text className='text-primary font-bold mt-1'>
          {price.toLocaleString('ar-SY')} ل.س
        </Text>
        <TouchableOpacity 
          className='mt-3 bg-primary/10 border border-primary/20 py-2 rounded-lg items-center'
          onPress={handleAddToCart}
        >
          <Text className='text-primary font-bold text-xs'>أضف للسلة</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
