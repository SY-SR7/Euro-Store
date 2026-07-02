import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useCartStore } from '../../store/cartStore';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(price_syp, sku), product_images(url)')
        .eq('id', id)
        .single();
      if (data) setProduct(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-background justify-center items-center'>
        <ActivityIndicator size='large' color='#B8860B' />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className='flex-1 bg-background justify-center items-center'>
        <Text className='text-text-primary text-lg'>?????? ??? ?????</Text>
        <TouchableOpacity onPress={() => router.back()} className='mt-4 bg-primary px-6 py-2 rounded-lg'>
          <Text className='text-[#0F0F0F] font-bold'>??????</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const price = product.product_variants?.[0]?.price_syp || 0;
  const image = product.product_images?.[0]?.url || 'https://via.placeholder.com/300';
  const name = product.name_ar || product.name_en;

  return (
    <SafeAreaView className='flex-1 bg-background'>
      {/* Header */}
      <View className='absolute top-12 left-6 z-50'>
        <TouchableOpacity 
          onPress={() => router.back()}
          className='w-10 h-10 bg-[#0F0F0F]/60 rounded-full items-center justify-center border border-border/50'
        >
          <Text className='text-primary text-xl font-bold'>{'<'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className='flex-1'>
        {/* Product Image */}
        <View className='w-full h-96 bg-background-secondary'>
          <Image
            source={{ uri: image }}
            className='w-full h-full'
            resizeMode='cover'
          />
        </View>

        {/* Product Info */}
        <View className='p-6'>
          <Text className='text-primary text-sm font-bold tracking-widest mb-2'>???? ????</Text>
          <Text className='text-text-primary text-2xl font-black mb-4 leading-tight'>{name}</Text>
          <Text className='text-primary text-2xl font-bold mb-6'>{price.toLocaleString('ar-SY')} ?.?</Text>

          <View className='h-[1px] bg-border mb-6' />

          <Text className='text-text-primary text-lg font-bold mb-2'>?????:</Text>
          <Text className='text-text-secondary leading-relaxed mb-8 text-base'>
            {product.description_ar || '????? ???? ???? ??? ??????? ???????. ???? ?????? ?????? ???? ?????? ?????? ?????? ?????? ???? ?????.'}
          </Text>
        </View>
      </ScrollView>

      {/* Footer Add To Cart */}
      <View className='p-6 bg-background-secondary border-t border-border flex-row items-center justify-between'>
        <View>
          <Text className='text-text-secondary text-sm'>????? ?????</Text>
          <Text className='text-text-primary font-bold text-xl'>{price.toLocaleString('ar-SY')} ?.?</Text>
        </View>
        <TouchableOpacity 
          className='bg-primary px-8 py-4 rounded-xl shadow-lg'
          onPress={() => {
            addItem({
              productId: product.id,
              title: name,
              price: price,
              quantity: 1,
              imageUrl: image,
            });
            router.push('/(tabs)/cart');
          }}
        >
          <Text className='text-[#0F0F0F] font-bold text-lg'>??? ?????</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

