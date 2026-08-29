import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react-native';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { ProductCard, type ProductCardProps } from '../../components/ProductCard';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../utils/supabase';
import { router, type Href } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import type { CatalogResponse } from '../../utils/catalog';

type HeroBanner = {
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaUrl: string;
  ctaLabel: string;
};

export default function HomeScreen() {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [hero, setHero] = useState<HeroBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAr, resolvedTheme, t } = usePreferences();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    apiFetch<{ count: number }>('/api/notifications/unread-count')
      .then((result) => setUnreadCount(result.count))
      .catch(() => setUnreadCount(0));
  }, [user]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const [productResult, heroResult] = await Promise.all([
          apiFetch<CatalogResponse>('/api/products?sort=newest&per_page=4'),
          supabase.from('homepage_sections')
            .select('content')
            .eq('section_key', 'main_banner')
            .eq('is_active', true)
            .maybeSingle(),
        ]);
        setProducts(productResult.data.map((product) => ({
          id: product.id,
          slug: product.slug,
          variantId: product.default_variant_id,
          title: isAr ? product.name_ar : product.name_en,
          price: Number(product.minPrice ?? 0),
          comparePrice: Number(product.raw_min_price ?? 0) > Number(product.minPrice ?? 0) ? Number(product.raw_min_price) : null,
          imageUrl: product.image_url || '',
          maxQuantity: Math.max(0, Number(product.default_variant_stock ?? product.total_stock ?? 0)),
          hasMultipleVariants: product.has_multiple_variants,
          isNew: Date.now() - new Date(product.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000,
          discountPercentage: product.discount_percentage,
        })));

        const content = heroResult.data?.content && typeof heroResult.data.content === 'object'
          ? heroResult.data.content as Record<string, unknown>
          : null;
        const banners = Array.isArray(content?.banners) ? content.banners as Array<Record<string, unknown>> : [];
        const banner = banners
          .filter((item) => item.is_active !== false && typeof item.image_url === 'string')
          .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))[0];
        if (banner) {
          setHero({
            imageUrl: String(banner.mobile_image_url ?? banner.image_url),
            title: String((isAr ? banner.title_ar : banner.title_en) ?? 'EuroStore'),
            subtitle: String((isAr ? banner.subtitle_ar : banner.subtitle_en) ?? ''),
            ctaUrl: typeof banner.cta_url === 'string' && banner.cta_url.startsWith('/products') ? banner.cta_url : '/products',
            ctaLabel: String((isAr ? banner.cta_label_ar : banner.cta_label_en) ?? t('home.shopNow')),
          });
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [isAr, t]);

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        
        {/* Cinematic Hero Section */}
        <View className='h-[60vh] w-full relative'>
          
          {/* Top Bar Overlay */}
          <View className='absolute top-12 left-0 right-0 px-6 flex-row justify-between items-center z-10'>
            <Text className='text-2xl font-black text-white tracking-widest' style={{ fontFamily: 'serif' }}>EUROSTORE</Text>
            <TouchableOpacity 
              className='w-10 h-10 bg-background/50 rounded-full items-center justify-center relative'
              onPress={() => router.push(user ? '/notifications' : '/login')}
            >
              <Bell size={20} color="#FFFFFF" accessibilityLabel={t('home.notifications')} />
              {unreadCount > 0 && (
                <View className='absolute -top-1 -right-1 bg-error w-5 h-5 rounded-full items-center justify-center border border-background'>
                  <Text className='text-white text-[10px] font-bold'>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ImageBackground
            source={hero?.imageUrl ? { uri: hero.imageUrl } : require('../../assets/splash.png')}
            className='w-full h-full'
            resizeMode='cover'
          >
            <LinearGradient
              colors={['transparent', resolvedTheme === 'dark' ? '#0F0F0F' : '#FAF9F7']}
              className='absolute inset-0 top-1/2'
            />
            <View className='absolute bottom-0 w-full p-6'>
              {hero?.subtitle ? <Text className='text-primary text-sm font-bold mb-2'>{hero.subtitle}</Text> : null}
              <Text className='text-white text-4xl font-bold mb-4'>{hero?.title ?? 'EuroStore'}</Text>
              
              <TouchableOpacity className='bg-primary self-start px-8 py-3 rounded-xl' onPress={() => router.push((hero?.ctaUrl ?? '/products') as Href)}>
                <Text className='text-[#0F0F0F] font-bold'>{hero?.ctaLabel ?? t('home.shopNow')}</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* Featured Products */}
        <View className='mt-8 px-6 mb-8'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-text-primary text-xl font-bold'>{t('home.latest')}</Text>
            <TouchableOpacity onPress={() => router.push('/products')}>
              <Text className='text-primary text-sm font-bold'>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#B8860B" className="mt-4" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className='overflow-visible' contentContainerStyle={{ paddingRight: 24 }}>
              {products.map(product => <View key={product.id} className='me-4 w-40'><ProductCard {...product} /></View>)}
            </ScrollView>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
