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
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const subtotal = totalPrice();
  const total = subtotal - discount;

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'EURO2026') {
      setDiscount(subtotal * 0.10); // 10% discount
      Alert.alert('نجاح', 'تم تطبيق الخصم 10% بنجاح!');
    } else {
      Alert.alert('خطأ', 'كود الخصم غير صالح أو منتهي الصلاحية.');
      setDiscount(0);
    }
  };

  const handleCheckout = async () => {
    if (!address || !phone) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف وعنوان التوصيل');
      return;
    }

    setLoading(true);
    try {
      // Create the order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id,
          total_syp: total,
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
        unit_price_syp: item.price,
        total_price_syp: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      Alert.alert('شكراً لك!', 'تم استلام طلبك بنجاح وسيقوم فريقنا بالتواصل معك قريباً.', [
        { text: 'موافق', onPress: () => {
            clearCart();
            router.replace('/(tabs)');
          } 
        }
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'حدث مشكلة أثناء إرسال الطلب، يرجى المحاولة لاحقاً');
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
        {/* Header */}
        <View className='px-6 py-4 border-b border-border flex-row items-center'>
          <TouchableOpacity onPress={() => router.back()} className='mr-4'>
            <Text className='text-primary text-xl font-bold'>{'<'}</Text>
          </TouchableOpacity>
          <Text className='text-xl font-bold text-primary'>إتمام الدفع</Text>
        </View>

        <ScrollView className='flex-1 p-6'>
          {/* Order Summary */}
          <Text className='text-white font-bold text-lg mb-4'>ملخص الطلب</Text>
          <View className='bg-background-secondary p-4 rounded-xl border border-border mb-6'>
            {items.map((item) => (
              <View key={item.productId} className='flex-row justify-between mb-3'>
                <Text className='text-text-primary flex-1 mr-4' numberOfLines={1}>
                  {item.quantity}x {item.title}
                </Text>
                <Text className='text-primary font-bold'>
                  {(item.price * item.quantity).toLocaleString('ar-SY')} ل.س
                </Text>
              </View>
            ))}
            
            <View className='h-[1px] bg-border my-3' />
            
            {/* Coupon Code Section */}
            <View className='flex-row items-center mb-4'>
              <TextInput 
                className='flex-1 bg-background border border-border text-white px-4 py-2 rounded-lg text-right mr-2 font-bold'
                placeholder='كوبون الخصم (مثال: EURO2026)'
                placeholderTextColor='#6F6658'
                value={couponCode}
                onChangeText={setCouponCode}
              />
              <TouchableOpacity 
                className='bg-primary/20 px-4 py-3 rounded-lg border border-primary/50'
                onPress={applyCoupon}
              >
                <Text className='text-primary font-bold text-xs'>تطبيق</Text>
              </TouchableOpacity>
            </View>

            <View className='flex-row justify-between mb-2'>
              <Text className='text-text-secondary'>المجموع الفرعي:</Text>
              <Text className='text-white font-bold'>{subtotal.toLocaleString('ar-SY')} ل.س</Text>
            </View>

            {discount > 0 && (
              <View className='flex-row justify-between mb-2'>
                <Text className='text-error'>قيمة الخصم:</Text>
                <Text className='text-error font-bold'>- {discount.toLocaleString('ar-SY')} ل.س</Text>
              </View>
            )}

            <View className='flex-row justify-between mt-2'>
              <Text className='text-text-secondary font-bold text-lg'>الإجمالي النهائي:</Text>
              <Text className='text-primary font-black text-xl'>
                {total.toLocaleString('ar-SY')} ل.س
              </Text>
            </View>
          </View>

          {/* Shipping Form */}
          <Text className='text-white font-bold text-lg mb-4'>معلومات التوصيل</Text>
          <View className='space-y-4 mb-8'>
            <View>
              <Text className='text-text-secondary mb-2 ml-1'>العنوان الكامل</Text>
              <TextInput
                className='bg-background-secondary border border-border text-white px-4 py-4 rounded-xl text-right font-bold'
                placeholder='المدينة، المنطقة، الشارع، البناء...'
                placeholderTextColor='#6F6658'
                value={address}
                onChangeText={setAddress}
                multiline
                textAlign='right'
              />
            </View>
            
            <View>
              <Text className='text-text-secondary mb-2 ml-1 mt-4'>رقم الهاتف</Text>
              <TextInput
                className='bg-background-secondary border border-border text-white px-4 py-4 rounded-xl text-right font-bold'
                placeholder='09xx xxx xxx'
                placeholderTextColor='#6F6658'
                value={phone}
                onChangeText={setPhone}
                keyboardType='phone-pad'
                textAlign='right'
              />
            </View>
          </View>

          {/* Payment Method Notice */}
          <View className='bg-primary/10 border border-primary/30 p-4 rounded-xl mb-8'>
            <Text className='text-primary text-center font-bold'>
              الدفع سيكون نقداً عند الاستلام (COD)
            </Text>
          </View>

        </ScrollView>

        {/* Footer */}
        <View className='p-6 bg-background-secondary border-t border-border pb-8'>
          <TouchableOpacity 
            className={\`bg-primary py-4 rounded-xl shadow-lg items-center \${loading ? 'opacity-50' : ''}\`}
            onPress={handleCheckout}
            disabled={loading}
          >
            <Text className='text-[#0F0F0F] font-black text-lg'>
              {loading ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب الآن'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
