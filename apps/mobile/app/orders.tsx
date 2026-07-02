import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_syp, products(name_ar))')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-500';
      case 'processing': return 'text-blue-500';
      case 'shipped': return 'text-indigo-500';
      case 'delivered': return 'text-green-500';
      case 'cancelled': return 'text-error';
      default: return 'text-text-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '??? ????????';
      case 'processing': return '??? ???????';
      case 'shipped': return '?? ?????';
      case 'delivered': return '?? ???????';
      case 'cancelled': return '????';
      default: return status;
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='px-6 py-4 border-b border-border flex-row items-center'>
        <TouchableOpacity onPress={() => router.back()} className='mr-4'>
          <Text className='text-primary text-2xl font-bold'>{'<'}</Text>
        </TouchableOpacity>
        <Text className='text-2xl font-bold text-primary'>??????</Text>
      </View>

      {loading ? (
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#B8860B' />
        </View>
      ) : (
        <ScrollView className='flex-1 p-6'>
          {orders.length === 0 ? (
            <View className='items-center justify-center py-20'>
              <Text className='text-text-secondary text-lg font-bold'>?? ???? ????? ?????</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} className='bg-background-secondary p-4 rounded-xl border border-border mb-4'>
                <View className='flex-row justify-between items-center mb-2'>
                  <Text className='text-white font-bold'>??? ?????: #{order.order_number}</Text>
                  <Text className={\ont-bold \\}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
                <Text className='text-text-secondary text-sm mb-4'>
                  {new Date(order.created_at).toLocaleDateString('ar-SY')}
                </Text>
                
                <View className='space-y-2 mb-4'>
                  {order.order_items?.map((item: any, idx: number) => (
                    <View key={idx} className='flex-row justify-between'>
                      <Text className='text-text-primary text-sm flex-1' numberOfLines={1}>
                        {item.quantity}x {item.products?.name_ar}
                      </Text>
                      <Text className='text-primary text-sm font-bold ml-4'>
                        {item.price_syp.toLocaleString('ar-SY')} ?.?
                      </Text>
                    </View>
                  ))}
                </View>

                <View className='h-[1px] bg-border mb-4' />
                
                <View className='flex-row justify-between items-center'>
                  <Text className='text-text-secondary'>????????:</Text>
                  <Text className='text-primary font-bold text-lg'>
                    {order.total_syp.toLocaleString('ar-SY')} ?.?
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

