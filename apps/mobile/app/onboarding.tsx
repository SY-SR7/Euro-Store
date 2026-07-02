import React, { useState, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Dimensions, ImageBackground, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../store/onboardingStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'مرحباً بك في يورو ستور',
    description: 'اكتشف عالم الموضة الفاخرة، مع تشكيلة واسعة من أحدث الأزياء الأوروبية المنتقاة بعناية.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800'
  },
  {
    id: '2',
    title: 'تسوق بأناقة',
    description: 'نوفر لك تجربة تسوق سلسة وآمنة، مع خيارات دفع متعددة تناسب احتياجاتك.',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800'
  },
  {
    id: '3',
    title: 'توصيل سريع ومضمون',
    description: 'نلتزم بتوصيل مشترياتك بأسرع وقت ممكن وبأعلى معايير الجودة لضمان رضاك التام.',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800'
  }
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const completeOnboarding = useOnboardingStore(state => state.completeOnboarding);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const slide = SLIDES[currentIndex];

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <StatusBar barStyle='light-content' />
      
      <ImageBackground
        source={{ uri: slide.image }}
        className='flex-1 justify-end'
        resizeMode='cover'
      >
        <LinearGradient
          colors={['transparent', 'rgba(15, 15, 15, 0.8)', '#0F0F0F']}
          className='h-[60%] justify-end px-8 pb-16'
        >
          {/* Pagination Indicators */}
          <View className='flex-row justify-center mb-8 gap-2'>
            {SLIDES.map((_, index) => (
              <View 
                key={index} 
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-8 bg-primary' : 'w-4 bg-white/30'}`}
              />
            ))}
          </View>

          <Text className='text-4xl font-black text-white text-center mb-4 leading-[50px]'>
            {slide.title}
          </Text>
          
          <Text className='text-text-secondary text-center text-base mb-12 leading-7'>
            {slide.description}
          </Text>

          <TouchableOpacity 
            className='bg-primary py-4 rounded-xl items-center shadow-lg'
            onPress={handleNext}
          >
            <Text className='text-[#0F0F0F] font-black text-lg'>
              {currentIndex === SLIDES.length - 1 ? 'ابدأ التسوق' : 'التالي'}
            </Text>
          </TouchableOpacity>

        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}
