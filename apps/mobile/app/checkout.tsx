import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

export default function CheckoutScreen() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleCheckout = async () => {
    if (!address || !phone) {
      Alert.alert('?????', '???? ????? ??? ?????? ?????? ???????');
      return;
    }

    setLoading(true);
    try {
      // Create the order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id,
          total_syp: totalPrice(),
          shipping_address: address,
          status: 'pending',
          payment_method: 'cash_on_delivery'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        variant_id: item.productId, // Using product ID as variant ID for simplicity in MVP
        quantity: item.quantity,
        unit_price_syp: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      Alert.alert('????!', '?? ?????? ???? ????? ?????? ???????? ??? ??????.', [
        { text: '?????', onPress: () => {
            clearCart();
            router.replace('/(tabs)');
          } 
        }
      ]);

    } catch (err) {
      console.error(err);
      Alert.alert('???', '??? ??? ????? ?????? ????');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className='flex-1'
      >
        <View className='px-6 py-4 border-b border-border flex-row items-center'>
          <TouchableOpacity onPress={() => router.back()} className='mr-4'>
            <Text className='text-primary text-2xl'>{'<'}</Text>
          </TouchableOpacity>
          <Text className='text-2xl font-bold text-primary'>????? ?????</Text>
        </View>

        <ScrollView className='flex-1 p-6'>
          <View className='bg-background-secondary p-5 rounded-2xl border border-border mb-6'>
            <Text className='text-text-primary text-lg font-bold mb-4'>???? ?????</Text>
            {items.map(item => (
              <View key={item.id} className='flex-row justify-between mb-2'>
                <Text className='text-text-secondary'>{item.title} (x{item.quantity})</Text>
                <Text className='text-text-primary'>{(item.price * item.quantity).toLocaleString('ar-SY')} ?.?</Text>
              </View>
            ))}
            <View className='h-[1px] bg-border my-3' />
            <View className='flex-row justify-between'>
              <Text className='text-primary font-bold text-lg'>??????? ?????</Text>
              <Text className='text-primary font-bold text-lg'>{totalPrice().toLocaleString('ar-SY')} ?.?</Text>
            </View>
          </View>

          <Text className='text-text-primary text-lg font-bold mb-4'>?????? ?????</Text>
          <View className='space-y-4 mb-8'>
            <TextInput
              className='bg-background-secondary text-text-primary px-4 py-4 rounded-xl border border-border'
              placeholder='??? ?????? (????: 09XX...)'
              placeholderTextColor='#737373'
              value={phone}
              onChangeText={setPhone}
              keyboardType='phone-pad'
            />
            <TextInput
              className='bg-background-secondary text-text-primary px-4 py-4 rounded-xl border border-border mt-4'
              placeholder='??????? ?????? (???????? ????? ??????)'
              placeholderTextColor='#737373'
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity 
            className='bg-primary py-4 rounded-xl mb-10'
            onPress={handleCheckout}
            disabled={loading}
          >
            <Text className='text-[#0F0F0F] font-bold text-center text-lg'>
              {loading ? '???? ???????...' : '????? ?????'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
