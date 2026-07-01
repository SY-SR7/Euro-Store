import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useCartStore } from '../../store/cartStore';

export default function CartScreen() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='px-6 py-4 border-b border-border'>
        <Text className='text-2xl font-bold text-primary'>?????</Text>
      </View>

      {items.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-text-secondary text-lg'>???? ????? ??????</Text>
        </View>
      ) : (
        <ScrollView className='flex-1 p-6' showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <View key={item.id} className='flex-row bg-background-secondary rounded-xl p-3 mb-4 border border-border'>
              <Image source={{ uri: item.imageUrl }} className='w-20 h-24 rounded-lg bg-background-card' resizeMode='cover' />
              <View className='flex-1 ml-4 justify-between py-1'>
                <View>
                  <Text className='text-text-primary font-bold text-base' numberOfLines={1}>{item.title}</Text>
                  <Text className='text-primary font-bold mt-1'>{item.price.toLocaleString('ar-SY')} ?.?</Text>
                </View>
                <View className='flex-row items-center justify-between'>
                  <View className='flex-row items-center bg-background px-2 py-1 rounded-lg border border-border'>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className='px-2'>
                      <Text className='text-text-primary text-lg'>-</Text>
                    </TouchableOpacity>
                    <Text className='text-text-primary font-bold px-2'>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} className='px-2'>
                      <Text className='text-text-primary text-lg'>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Text className='text-error font-bold'>???</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {items.length > 0 && (
        <View className='p-6 bg-background-secondary border-t border-border'>
          <View className='flex-row justify-between mb-4'>
            <Text className='text-text-primary text-lg font-bold'>??????? ?????:</Text>
            <Text className='text-primary text-xl font-bold'>{totalPrice().toLocaleString('ar-SY')} ?.?</Text>
          </View>
          <TouchableOpacity className='bg-primary py-4 rounded-xl'>
            <Text className='text-[#0F0F0F] font-bold text-center text-lg'>?????? ?????</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
