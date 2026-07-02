import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { ProductCard } from '../../components/ProductCard';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../utils/supabase';
import { useNotificationStore } from '../../store/notificationStore';
import { router } from 'expo-router';

type ProductData = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
};

export default function HomeScreen() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = useNotificationStore((state) => state.unreadCount());

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name_ar, product_variants(price_syp), product_images(url)')
          .eq('is_active', true)
          .limit(4);

        if (error) throw error;

        if (data) {
          const formatted = data.map((p: any) => ({
            id: p.id,
            title: p.name_ar,
            price: p.product_variants?.[0]?.price_syp || 0,
            imageUrl: p.product_images?.[0]?.url || 'https://via.placeholder.com/300',
          }));
          setProducts(formatted);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <StatusBar barStyle='light-content' />
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        
        {/* Cinematic Hero Section */}
        <View className='h-[60vh] w-full relative'>
          
          {/* Top Bar Overlay */}
          <View className='absolute top-12 left-0 right-0 px-6 flex-row justify-between items-center z-10'>
            <Text className='text-2xl font-black text-white tracking-widest' style={{ fontFamily: 'serif' }}>EUROSTORE</Text>
            <TouchableOpacity 
              className='w-10 h-10 bg-background/50 rounded-full items-center justify-center relative'
              onPress={() => router.push('/notifications')}
            >
              <Text className='text-white text-lg'>🔔</Text>
              {unreadCount > 0 && (
                <View className='absolute -top-1 -right-1 bg-error w-5 h-5 rounded-full items-center justify-center border border-background'>
                  <Text className='text-white text-[10px] font-bold'>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

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
              <Text className='text-primary text-sm font-bold tracking-[0.2em] mb-2'>مجموعة الصيف 2026</Text>
              <Text className='text-white text-4xl font-bold mb-4'>الأناقة العصرية{'\n'}في متناول يدك</Text>
              
              <TouchableOpacity className='bg-primary self-start px-8 py-3 rounded-xl'>
                <Text className='text-[#0F0F0F] font-bold'>تسوق الآن</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* Featured Products */}
        <View className='mt-8 px-6 mb-8'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-text-primary text-xl font-bold'>أحدث الإضافات</Text>
            <TouchableOpacity>
              <Text className='text-primary text-sm font-bold'>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#B8860B" className="mt-4" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className='overflow-visible' contentContainerStyle={{ paddingRight: 24 }}>
              {products.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </ScrollView>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
