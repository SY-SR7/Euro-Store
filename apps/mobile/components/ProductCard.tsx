import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

export function ProductCard({ title, price, imageUrl }: { title: string; price: number; imageUrl: string }) {
  return (
    <TouchableOpacity className='w-40 mr-4 bg-background-card rounded-2xl overflow-hidden border border-border shadow-sm'>
      <View className='h-48 w-full bg-background-secondary'>
        <Image
          source={{ uri: imageUrl }}
          className='w-full h-full'
          resizeMode='cover'
        />
        <View className='absolute top-2 right-2 bg-[#0F0F0F]/60 px-2 py-1 rounded-full'>
          <Text className='text-white text-xs font-bold'>????</Text>
        </View>
      </View>
      <View className='p-3'>
        <Text className='text-text-primary text-sm font-bold truncate' numberOfLines={1}>
          {title}
        </Text>
        <Text className='text-primary font-bold mt-1'>
          {price.toLocaleString('ar-SY')} ?.?
        </Text>
      </View>
    </TouchableOpacity>
  );
}
