import React from 'react';
import { CheckCircle2, ShoppingBag } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function CheckoutSuccessScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber?: string }>();
  const { l } = usePreferences();
  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 items-center justify-center">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
          <CheckCircle2 size={48} color="#15803D" />
        </View>
        <Text className="text-center text-3xl font-black text-text-primary">{l('تم تأكيد طلبك', 'Your order is confirmed')}</Text>
        <Text className="mt-3 text-center leading-7 text-text-secondary">{l('شكراً لك. سنراجع الطلب ونتواصل معك لتأكيد التوصيل.', 'Thank you. We will review your order and contact you to confirm delivery.')}</Text>
        {orderNumber ? <Text className="mt-5 rounded-xl border border-border bg-background-card px-5 py-3 font-black text-primary">{l('رقم الطلب', 'Order number')}: {orderNumber}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => router.replace('/orders')} className="mt-8 min-h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5">
          <ShoppingBag size={19} color="#1C1917" />
          <Text className="font-black text-text-primary">{l('عرض طلباتي', 'View my orders')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/products')} className="mt-3 min-h-12 w-full items-center justify-center rounded-xl border border-border bg-background-card px-5">
          <Text className="font-bold text-text-secondary">{l('متابعة التسوق', 'Continue shopping')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
