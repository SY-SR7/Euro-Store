import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useCartStore } from '../../store/cartStore';
import { router } from 'expo-router';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function CartScreen() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const { l, formatCurrency } = usePreferences();

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='px-6 py-4 border-b border-border'>
        <Text className='text-2xl font-bold text-primary'>{l('السلة', 'Cart')}</Text>
      </View>

      {items.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-text-secondary text-lg'>{l('سلة التسوق فارغة', 'Your cart is empty')}</Text>
        </View>
      ) : (
        <ScrollView className='flex-1 p-6' showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <View key={item.id} className='flex-row bg-background-secondary rounded-xl p-3 mb-4 border border-border'>
              <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/icon.png')} className='w-20 h-24 rounded-lg bg-background-card' resizeMode='cover' />
              <View className='ms-4 flex-1 justify-between py-1'>
                <View>
                  <Text className='text-text-primary font-bold text-base' numberOfLines={1}>{item.title}</Text>
                  <Text className='text-primary font-bold mt-1'>{formatCurrency(item.price)}</Text>
                </View>
                <View className='flex-row items-center justify-between'>
                  <View className='flex-row items-center bg-background px-2 py-1 rounded-lg border border-border'>
                    <TouchableOpacity accessibilityLabel={l('تقليل الكمية', 'Decrease quantity')} disabled={item.quantity <= 1} onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className='px-2 disabled:opacity-40'>
                      <Minus size={17} color='#B8860B' />
                    </TouchableOpacity>
                    <Text className='text-text-primary font-bold px-2'>{item.quantity}</Text>
                    <TouchableOpacity accessibilityLabel={l('زيادة الكمية', 'Increase quantity')} disabled={item.quantity >= item.maxQuantity} onPress={() => updateQuantity(item.id, Math.min(item.maxQuantity, item.quantity + 1))} className='px-2 disabled:opacity-40'>
                      <Plus size={17} color='#B8860B' />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity accessibilityLabel={l('حذف من السلة', 'Remove from cart')} onPress={() => removeItem(item.id)}>
                    <Trash2 size={19} color='#DC2626' />
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
            <Text className='text-text-primary text-lg font-bold'>{l('المجموع الكلي', 'Total')}</Text>
            <Text className='text-primary text-xl font-bold'>{formatCurrency(totalPrice())}</Text>
          </View>
          <TouchableOpacity 
            className='bg-primary py-4 rounded-xl'
            onPress={() => router.push('/checkout')}
          >
            <Text className='text-[#0F0F0F] font-bold text-center text-lg'>{l('متابعة الدفع', 'Continue to checkout')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
