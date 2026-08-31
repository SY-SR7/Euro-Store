import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../store/onboardingStore';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../utils/api';
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
    apiFetch<{ banners: Array<Record<string, unknown>> }>('/api/storefront/home')
      .then(({ banners }) => {
        const imageUrls = banners
          .filter((banner) => banner.is_active !== false && (typeof banner.mobile_image_url === 'string' || typeof banner.image_url === 'string'))
          .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
          .map((banner) => String(banner.mobile_image_url ?? banner.image_url));
        if (imageUrls.length) setSlides(BASE_SLIDES.map((slide, index) => ({ ...slide, image: imageUrls[index % imageUrls.length] })));
      }).catch(() => undefined);
  }, []);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const slide = slides[currentIndex];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle='dark-content' backgroundColor='#FAF7EF' />

      <ImageBackground
        source={slide.image ? { uri: slide.image } : require('../assets/splash.png')}
        style={styles.background}
        resizeMode={slide.image ? 'cover' : 'contain'}
      />
      <LinearGradient
        colors={['rgba(250, 247, 239, 0.04)', 'rgba(250, 247, 239, 0.46)', 'rgba(250, 247, 239, 0.99)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View className='flex-row items-center justify-between'>
          <View className='border border-border bg-background-card/90 px-3 py-2'>
            <Text className='text-[11px] font-black tracking-[3px] text-text-primary'>EURO STORE</Text>
          </View>
          <Pressable
            accessibilityRole='button'
            accessibilityLabel={l('تخطي المقدمة', 'Skip onboarding')}
            onPress={handleSkip}
            className='min-h-11 min-w-11 items-center justify-center px-3 active:opacity-60'
          >
            <Text className='text-sm font-bold text-text-primary'>{l('تخطي', 'Skip')}</Text>
          </Pressable>
        </View>

        <View className='mt-auto'>
          {/* Pagination Indicators */}
          <View className='mb-7 flex-row justify-center gap-2'>
            {slides.map((_, index) => (
              <View
                key={index}
                className={`h-1.5 rounded-full ${index === currentIndex ? 'w-9 bg-primary' : 'w-4 bg-border-accent'}`}
              />
            ))}
          </View>

          <Text className='mb-4 text-center text-[34px] font-black leading-[45px] text-text-primary'>
            {isAr ? slide.title : slide.title_en}
          </Text>

          <Text className='mb-9 text-center text-base leading-7 text-text-secondary'>
            {isAr ? slide.description : slide.description_en}
          </Text>

          <Pressable
            accessibilityRole='button'
            onPress={handleNext}
            className='min-h-14 items-center justify-center rounded-2xl bg-primary px-5 active:scale-[0.98] active:opacity-90'
          >
            <Text className='text-lg font-black text-text-primary'>
              {currentIndex === slides.length - 1 ? l('ابدأ التسوق', 'Start shopping') : l('التالي', 'Next')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7EF',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 42,
  },
});
