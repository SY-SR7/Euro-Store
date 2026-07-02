import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';

export default function WishlistScreen() {
  const { items, removeItem } = useWishlistStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = (item: any) => {
    addItemToCart({
      productId: item.productId,
      title: item.title,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
    });
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='px-6 py-4 border-b border-border flex-row items-center'>
        <TouchableOpacity onPress={() => router.back()} className='mr-4'>
          <Text className='text-primary text-2xl font-bold'>{'<'}</Text>
        </TouchableOpacity>
        <Text className='text-2xl font-bold text-primary'>???????</Text>
      </View>

      <ScrollView className='flex-1 p-6'>
        {items.length === 0 ? (
          <View className='items-center justify-center py-20'>
            <Text className='text-text-secondary text-lg font-bold'>?? ???? ?????? ?? ???????</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.productId} className='bg-background-secondary p-4 rounded-xl border border-border mb-4 flex-row'>
              <View className='w-24 h-24 bg-background rounded-lg overflow-hidden border border-border'>
                <Image source={{ uri: item.imageUrl }} className='w-full h-full' resizeMode='cover' />
              </View>
              
              <View className='flex-1 ml-4 justify-center'>
                <Text className='text-white font-bold text-base mb-1' numberOfLines={2}>{item.title}</Text>
                <Text className='text-primary font-bold'>{item.price.toLocaleString('ar-SY')} ?.?</Text>
                
                <View className='flex-row mt-3 justify-between items-center'>
                  <TouchableOpacity 
                    className='bg-primary/20 px-4 py-2 rounded-lg'
                    onPress={() => handleAddToCart(item)}
                  >
                    <Text className='text-primary font-bold text-xs'>??? ?????</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className='bg-error/10 px-3 py-2 rounded-lg'
                    onPress={() => removeItem(item.productId)}
                  >
                    <Text className='text-error font-bold text-xs'>???</Text>
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

