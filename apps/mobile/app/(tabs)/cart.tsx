import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../../store/cartStore';
import { router } from 'expo-router';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function CartScreen() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const { l, formatCurrency } = usePreferences();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='border-b border-border bg-background-card px-5 py-5'>
        <Pressable accessibilityRole='link' onPress={() => router.push('/products')}><Text className='text-xs font-bold text-primary'>{l('متابعة التسوق', 'Continue shopping')}</Text></Pressable>
        <View className='mt-1 flex-row items-center gap-2'><Text className='text-3xl font-black text-text-primary'>{l('سلة التسوق', 'Shopping cart')}</Text>{itemCount ? <View className='rounded-full bg-primary/10 px-2.5 py-1'><Text className='text-xs font-bold text-primary'>{itemCount}</Text></View> : null}</View>
      </View>

      {items.length === 0 ? (
        <View className='flex-1 items-center justify-center px-8 pb-16'>
          <View className='mb-5 h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
            <ShoppingBag size={34} color='#B8860B' strokeWidth={1.6} />
          </View>
          <Text className='text-center text-xl font-black text-text-primary'>{l('سلة التسوق فارغة', 'Your cart is empty')}</Text>
          <Text className='mt-2 text-center leading-6 text-text-secondary'>{l('أضف منتجاتك المفضلة، وسنحفظها لك هنا.', 'Add your favorite products and we will keep them here.')}</Text>
          <Pressable accessibilityRole='button' onPress={() => router.push('/products')} className='mt-7 min-h-12 items-center justify-center rounded-lg bg-primary px-7'>
            <Text className='font-bold text-[#17130A]'>{l('ابدأ التسوق', 'Start shopping')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView className='flex-1' contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <View key={item.id} className='mb-4 flex-row rounded-xl bg-background-card p-3'>
              <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/icon.png')} className='h-28 w-24 rounded-lg bg-background-secondary' resizeMode='cover' accessibilityLabel={item.title} />
              <View className='ms-4 flex-1 justify-between py-1'>
                <View>
                  <Text className='text-text-primary font-bold text-base' numberOfLines={1}>{item.title}</Text>
                  {item.itemType === 'bundle' ? <Text className='mt-0.5 text-xs font-bold text-primary'>{l('حزمة', 'Bundle')}</Text> : null}
                  {item.sku ? <Text className='mt-0.5 text-xs text-text-muted'>SKU: {item.sku}</Text> : null}
                  <Text className='text-primary font-bold mt-1'>{formatCurrency(item.price)}</Text>
                </View>
                <View className='flex-row items-center justify-between'>
                  <View className='flex-row items-center bg-background px-2 py-1 rounded-lg border border-border'>
                    <Pressable accessibilityRole='button' accessibilityLabel={l('تقليل الكمية', 'Decrease quantity')} disabled={item.quantity <= 1} onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className='min-h-9 min-w-9 items-center justify-center disabled:opacity-40'>
                      <Minus size={17} color='#B8860B' />
                    </Pressable>
                    <Text className='text-text-primary font-bold px-2'>{item.quantity}</Text>
                    <Pressable accessibilityRole='button' accessibilityLabel={l('زيادة الكمية', 'Increase quantity')} disabled={item.quantity >= item.maxQuantity} onPress={() => updateQuantity(item.id, Math.min(item.maxQuantity, item.quantity + 1))} className='min-h-9 min-w-9 items-center justify-center disabled:opacity-40'>
                      <Plus size={17} color='#B8860B' />
                    </Pressable>
                  </View>
                  <Pressable accessibilityRole='button' accessibilityLabel={l('حذف من السلة', 'Remove from cart')} onPress={() => removeItem(item.id)} className='h-10 w-10 items-center justify-center rounded-lg bg-error/10'>
                    <Trash2 size={19} color='#DC2626' />
                  </Pressable>
                </View>
                <Text className='mt-2 text-end text-sm font-black text-primary'>{formatCurrency(item.price * item.quantity)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {items.length > 0 && (
        <View className='border-t border-border bg-background-card px-5 pb-5 pt-4'>
          <View className='flex-row justify-between mb-4'>
            <View><Text className='text-text-primary text-lg font-bold'>{l('المجموع الكلي', 'Total')}</Text><Text className='mt-1 text-xs text-text-secondary'>{l(`${itemCount} قطعة`, `${itemCount} items`)}</Text></View>
            <Text className='text-primary text-xl font-bold'>{formatCurrency(totalPrice())}</Text>
          </View>
          <Pressable
            accessibilityRole='button'
            className='min-h-14 items-center justify-center rounded-lg bg-primary'
            onPress={() => router.push('/checkout')}
          >
            <Text className='text-text-primary font-bold text-center text-lg'>{l('متابعة الدفع', 'Continue to checkout')}</Text>
          </Pressable>
          <Pressable accessibilityRole='link' onPress={() => router.push('/products')} className='mt-3 min-h-12 items-center justify-center rounded-lg border border-border'><Text className='font-bold text-text-secondary'>{l('متابعة التسوق', 'Continue shopping')}</Text></Pressable>
          <Text className='mt-3 text-center text-xs leading-5 text-text-secondary'>{l('سنتواصل معك لتأكيد الطلب وموعد التوصيل.', 'We will contact you to confirm the order and delivery time.')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
