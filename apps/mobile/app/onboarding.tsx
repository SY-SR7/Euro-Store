import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../store/onboardingStore';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../utils/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

const BASE_SLIDES = [
  {
    id: '1',
    title: 'مرحباً بك في يورو ستور',
    title_en: 'Welcome to EuroStore',
    description: 'اكتشف عالم الموضة الفاخرة، مع تشكيلة واسعة من أحدث الأزياء الأوروبية المنتقاة بعناية.',
    description_en: 'Discover carefully selected European fashion and a refined shopping experience.',
  },
  {
    id: '2',
    title: 'تسوق بأناقة',
    title_en: 'Shop with confidence',
    description: 'نوفر لك تجربة تسوق سلسة وآمنة، مع دفع نقدي عند الاستلام وتسعير محمي من الخادم.',
    description_en: 'Enjoy secure server-priced checkout with cash payment on delivery.',
  },
  {
    id: '3',
    title: 'توصيل سريع ومضمون',
    title_en: 'Reliable delivery',
    description: 'تابع طلباتك وإشعاراتك واحتفظ بمنتجاتك المفضلة من مكان واحد.',
    description_en: 'Track orders and notifications and keep your favorite products in one place.',
  }
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState(BASE_SLIDES.map((slide) => ({ ...slide, image: '' })));
  const completeOnboarding = useOnboardingStore(state => state.completeOnboarding);
  const { isAr, l } = usePreferences();

  useEffect(() => {
    supabase.from('homepage_sections').select('content').eq('section_key', 'main_banner').eq('is_active', true).maybeSingle()
      .then(({ data }) => {
        const content = data?.content && typeof data.content === 'object' ? data.content as Record<string, unknown> : null;
        const banners = Array.isArray(content?.banners) ? content.banners as Array<Record<string, unknown>> : [];
        const imageUrls = banners
          .filter((banner) => banner.is_active !== false && (typeof banner.mobile_image_url === 'string' || typeof banner.image_url === 'string'))
          .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
          .map((banner) => String(banner.mobile_image_url ?? banner.image_url));
        if (imageUrls.length) setSlides(BASE_SLIDES.map((slide, index) => ({ ...slide, image: imageUrls[index % imageUrls.length] })));
      });
  }, []);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const slide = slides[currentIndex];

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <StatusBar barStyle='light-content' />
      
      <ImageBackground
        source={slide.image ? { uri: slide.image } : require('../assets/splash.png')}
        className='flex-1 justify-end'
        resizeMode='cover'
      >
        <LinearGradient
          colors={['transparent', 'rgba(15, 15, 15, 0.8)', '#0F0F0F']}
          className='h-[60%] justify-end px-8 pb-16'
        >
          {/* Pagination Indicators */}
          <View className='flex-row justify-center mb-8 gap-2'>
            {slides.map((_, index) => (
              <View 
                key={index} 
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-8 bg-primary' : 'w-4 bg-white/30'}`}
              />
            ))}
          </View>

          <Text className='text-4xl font-black text-white text-center mb-4 leading-[50px]'>
            {isAr ? slide.title : slide.title_en}
          </Text>
          
          <Text className='text-text-secondary text-center text-base mb-12 leading-7'>
            {isAr ? slide.description : slide.description_en}
          </Text>

          <TouchableOpacity 
            className='bg-primary py-4 rounded-xl items-center shadow-lg'
            onPress={handleNext}
          >
            <Text className='text-[#0F0F0F] font-black text-lg'>
              {currentIndex === slides.length - 1 ? l('ابدأ التسوق', 'Start shopping') : l('التالي', 'Next')}
            </Text>
          </TouchableOpacity>

        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}
