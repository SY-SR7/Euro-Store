import React from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { ProductCard } from '../../components/ProductCard';
import { LinearGradient } from 'expo-linear-gradient';

const MOCK_PRODUCTS = [
  { id: '1', title: '????? ???? ??????? ????', price: 1500000, imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800' },
  { id: '2', title: '???? ?????? ?????', price: 2100000, imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800' },
  { id: '3', title: '????? ?? ?????', price: 750000, imageUrl: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800' },
  { id: '4', title: '???? ??????? ??????', price: 950000, imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView className='flex-1 bg-background'>
      <StatusBar barStyle='light-content' />
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        
        {/* Cinematic Hero Section */}
        <View className='h-[60vh] w-full relative'>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200' }}
            className='w-full h-full'
            resizeMode='cover'
          >
            <LinearGradient
              colors={['transparent', '#0F0F0F']}
              className='absolute inset-0 top-1/2'
            />
            <View className='absolute bottom-0 w-full p-6'>
              <Text className='text-primary text-sm font-bold tracking-[0.2em] mb-2'>?????? ????? 2026</Text>
              <Text className='text-white text-4xl font-bold mb-4'>??????? ???????{'\n'}?? ?????? ???</Text>
              
              <TouchableOpacity className='bg-primary self-start px-8 py-3 rounded-xl'>
                <Text className='text-[#0F0F0F] font-bold'>???? ????</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* Featured Products */}
        <View className='mt-8 px-6 mb-8'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-text-primary text-xl font-bold'>???? ????????</Text>
            <TouchableOpacity>
              <Text className='text-primary text-sm font-bold'>??? ????</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className='overflow-visible' contentContainerStyle={{ paddingRight: 24 }}>
            {MOCK_PRODUCTS.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
