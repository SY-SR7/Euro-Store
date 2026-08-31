import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { usePreferences } from '../contexts/PreferencesContext';
import { orderStatusLabel } from '../utils/orderStatus';

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_syp: number;
  created_at: string;
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isAr, l, formatCurrency, formatDate } = usePreferences();

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const result = await apiFetch<{ data: Order[] }>('/api/orders');
      setOrders(result.data);
    } catch {
      Alert.alert(l('تعذر تحميل الطلبات', 'Could not load orders'), l('تحقق من الاتصال ثم اسحب للأسفل للمحاولة مجدداً.', 'Check your connection, then pull down to try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [l, user]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScreenHeader title={l('طلباتي', 'My orders')} />

      {!user ? (
        <View className='flex-1 items-center justify-center px-6'>
          <Text className='mb-3 text-xl font-bold text-text-primary'>{l('سجّل الدخول لعرض طلباتك', 'Sign in to view your orders')}</Text>
          <TouchableOpacity className='mt-5 w-full rounded-xl bg-primary p-4' onPress={() => router.replace('/login')}><Text className='text-center font-bold text-text-primary'>{l('تسجيل الدخول', 'Sign in')}</Text></TouchableOpacity>
        </View>
      ) : loading ? (
        <View className='flex-1 items-center justify-center'><ActivityIndicator size='large' color='#B8860B' /></View>
      ) : (
        <ScrollView className='flex-1 px-6' contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadOrders(); }} tintColor='#B8860B' />}>
          {orders.length === 0 ? (
            <Text className='py-20 text-center text-lg font-bold text-text-secondary'>{l('لا توجد طلبات بعد', 'No orders yet')}</Text>
          ) : orders.map((order) => (
            <TouchableOpacity key={order.id} className='mb-4 rounded-xl border border-border bg-background-secondary p-4' onPress={() => router.push(`/orders/${order.order_number}`)}>
              <View className='mb-3 flex-row items-center justify-between'>
                <Text className='font-bold text-text-primary'>{order.order_number}</Text>
                <Text className='font-bold text-primary'>{orderStatusLabel(order.status, isAr)}</Text>
              </View>
              <Text className='mb-3 text-sm text-text-secondary'>{formatDate(order.created_at, false)}</Text>
              <View className='h-px bg-border' />
              <View className='mt-3 flex-row items-center justify-between'>
                <Text className='text-text-secondary'>{l('الإجمالي', 'Total')}</Text>
                <Text className='text-lg font-bold text-primary'>{formatCurrency(Number(order.total_syp))}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
