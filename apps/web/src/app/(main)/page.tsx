import { CinematicShowcaseSection, type StoryBeat } from '@/components/home/CinematicShowcaseSection';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCategoryProducts } from '@/components/home/FeaturedCategoryProducts';
import { getLocale, getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

const FRAME_COUNT  = 100;

export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const isAr = locale === 'ar';

  const SHOES_STORY_BEATS: StoryBeat[] = [
    { from: 0.0, to: 0.15, title: t('shoes.beat1.title'), subtitle: t('shoes.beat1.subtitle') },
    { from: 0.22, to: 0.37, title: t('shoes.beat2.title'), subtitle: t('shoes.beat2.subtitle') },
    { from: 0.44, to: 0.59, title: t('shoes.beat3.title'), subtitle: t('shoes.beat3.subtitle') },
    { from: 0.66, to: 0.81, title: t('shoes.beat4.title'), subtitle: t('shoes.beat4.subtitle') },
    { from: 0.88, to: 1.0, title: t('shoes.beat5.title'), subtitle: t('shoes.beat5.subtitle'), ctaLabel: t('shoes.beat5.cta'), ctaHref: '/categories/shoes' },
  ];

  const MEN_STORY_BEATS: StoryBeat[] = [
    { from: 0.0, to: 0.15, title: t('men.beat1.title'), subtitle: t('men.beat1.subtitle') },
    { from: 0.22, to: 0.37, title: t('men.beat2.title'), subtitle: t('men.beat2.subtitle') },
    { from: 0.44, to: 0.59, title: t('men.beat3.title'), subtitle: t('men.beat3.subtitle') },
    { from: 0.66, to: 0.81, title: t('men.beat4.title'), subtitle: t('men.beat4.subtitle') },
    { from: 0.88, to: 1.0, title: t('men.beat5.title'), subtitle: t('men.beat5.subtitle'), ctaLabel: t('men.beat5.cta'), ctaHref: '/categories/men' },
  ];

  const WOMEN_STORY_BEATS: StoryBeat[] = [
    { from: 0.0, to: 0.15, title: t('women.beat1.title'), subtitle: t('women.beat1.subtitle') },
    { from: 0.22, to: 0.37, title: t('women.beat2.title'), subtitle: t('women.beat2.subtitle') },
    { from: 0.44, to: 0.59, title: t('women.beat3.title'), subtitle: t('women.beat3.subtitle') },
    { from: 0.66, to: 0.81, title: t('women.beat4.title'), subtitle: t('women.beat4.subtitle') },
    { from: 0.88, to: 1.0, title: t('women.beat5.title'), subtitle: t('women.beat5.subtitle'), ctaLabel: t('women.beat5.cta'), ctaHref: '/categories/women' },
  ];

  const KIDS_STORY_BEATS: StoryBeat[] = [
    { from: 0.0, to: 0.15, title: t('kids.beat1.title'), subtitle: t('kids.beat1.subtitle') },
    { from: 0.22, to: 0.37, title: t('kids.beat2.title'), subtitle: t('kids.beat2.subtitle') },
    { from: 0.44, to: 0.59, title: t('kids.beat3.title'), subtitle: t('kids.beat3.subtitle') },
    { from: 0.66, to: 0.81, title: t('kids.beat4.title'), subtitle: t('kids.beat4.subtitle') },
    { from: 0.88, to: 1.0, title: t('kids.beat5.title'), subtitle: t('kids.beat5.subtitle'), ctaLabel: t('kids.beat5.cta'), ctaHref: '/categories/kids' },
  ];

  return (
    <main className="bg-[#0C0C0C] text-[#E2E2E2]" dir={isAr ? "rtl" : "ltr"}>
      {/* 0. HERO — Full-screen autoplay video with animated content */}
      <HeroSection />



      {/* 1. SHOES (scroll-driven cinematic sequence) */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/shoes/frame_{index:04d}.jpg"
        frameCount={236}
        frameOffset={5}
        scrollHeight="250vh"
        storyBeats={SHOES_STORY_BEATS}
        bgColor="#dfdcd3"
      />
      <FeaturedCategoryProducts 
        categorySlugs={['shoes']} 
        title={isAr ? 'أحذية مميزة' : 'Featured Shoes'} 
      />

      {/* 2. MEN */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/men/frame_{index:04d}.jpg"
        frameCount={FRAME_COUNT}
        scrollHeight="250vh"
        storyBeats={MEN_STORY_BEATS}
        bgColor="#FDFBF7"
      />
      <FeaturedCategoryProducts 
        categorySlugs={['men-shirts']} 
        title={isAr ? 'أزياء رجالية مميزة' : 'Featured Men'} 
      />

      {/* 3. WOMEN (Dresses & Abayas) */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/women/frame_{index:04d}.jpg"
        frameCount={FRAME_COUNT}
        scrollHeight="250vh"
        storyBeats={WOMEN_STORY_BEATS}
        bgColor="#FDFBF7"
      />
      <FeaturedCategoryProducts 
        categorySlugs={['women-dresses', 'modest-wear']} 
        title={isAr ? 'أزياء نسائية مميزة' : 'Featured Women'} 
      />

      {/* 4. KIDS */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/kids/frame_{index:04d}.jpg"
        frameCount={FRAME_COUNT}
        scrollHeight="250vh"
        storyBeats={KIDS_STORY_BEATS}
        bgColor="#FDFBF7"
      />
      <FeaturedCategoryProducts 
        categorySlugs={['kids']} 
        title={isAr ? 'أزياء أطفال مميزة' : 'Featured Kids'} 
      />
    </main>
  );
}