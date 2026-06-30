import { CinematicShowcaseSection, type StoryBeat } from '@/components/home/CinematicShowcaseSection';
import { HeroSection } from '@/components/home/HeroSection';
import { getLocale, getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

const FRAME_COUNT  = 100; // Because the new scripts extract 100 frames

export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const isAr = locale === 'ar';

  const SHOES_STORY_BEATS: StoryBeat[] = [
    { from: 0.0, to: 0.18, title: t('shoes.beat1.title', { fallback: 'فن يُرتدى' }), subtitle: t('shoes.beat1.subtitle', { fallback: 'أحذية أوروبية تصنع بشغف — كل تفصيلة حكاية' }) },
    { from: 0.22, to: 0.42, title: t('shoes.beat2.title', { fallback: 'جلد أصيل' }), subtitle: t('shoes.beat2.subtitle', { fallback: 'خامات منتقاة من أفضل مصابغ إيطاليا' }) },
    { from: 0.46, to: 0.64, title: t('shoes.beat3.title', { fallback: 'راحة لا تُساوم' }), subtitle: t('shoes.beat3.subtitle', { fallback: 'نعل مُهندس بدقة لإراحة قدميك طوال اليوم' }) },
    { from: 0.68, to: 0.86, title: t('shoes.beat4.title', { fallback: 'تصميم خالد' }), subtitle: t('shoes.beat4.subtitle', { fallback: 'قطع لا تعرف الموضة — ترتديها في كل موسم' }) },
    { from: 0.88, to: 1.0, title: t('shoes.beat5.title', { fallback: 'تسوق الآن' }), subtitle: t('shoes.beat5.subtitle', { fallback: 'تشكيلة الموسم متاحة الآن' }), ctaLabel: t('shoes.beat5.cta', { fallback: 'اكتشف التشكيلة' }), ctaHref: '/categories/shoes' },
  ];

  const MEN_STORY_BEATS: StoryBeat[] = [
    { from: 0.0, to: 0.18, title: t('men.beat1.title', { fallback: 'هيبة الحضور' }), subtitle: t('men.beat1.subtitle', { fallback: 'أناقة رجالية تعكس قوة شخصيتك' }) },
    { from: 0.22, to: 0.42, title: t('men.beat2.title', { fallback: 'دقة التفاصيل' }), subtitle: t('men.beat2.subtitle', { fallback: 'قصّات مصممة خصيصاً لتناسبك' }) },
    { from: 0.46, to: 0.64, title: t('men.beat3.title', { fallback: 'خامات استثنائية' }), subtitle: t('men.beat3.subtitle', { fallback: 'أقمشة إيطالية مستوردة بعناية فائقة' }) },
    { from: 0.68, to: 0.86, title: t('men.beat4.title', { fallback: 'أسلوب حياة' }), subtitle: t('men.beat4.subtitle', { fallback: 'من اجتماعات العمل إلى المناسبات الفاخرة' }) },
    { from: 0.88, to: 1.0, title: t('men.beat5.title', { fallback: 'اكتشف الآن' }), subtitle: t('men.beat5.subtitle', { fallback: 'المجموعة الرجالية الجديدة' }), ctaLabel: t('men.beat5.cta', { fallback: 'تسوق الرجالي' }), ctaHref: '/categories/men' },
  ];

  const WOMEN_STORY_BEATS: StoryBeat[] = [
    { from: 0.0, to: 0.18, title: t('women.beat1.title', { fallback: 'أناقة لا تُنسى' }), subtitle: t('women.beat1.subtitle', { fallback: 'فساتين وعبايات مصممة لتخطفي الأنظار' }) },
    { from: 0.22, to: 0.42, title: t('women.beat2.title', { fallback: 'لمسات فنية' }), subtitle: t('women.beat2.subtitle', { fallback: 'تطريز يدوي يعكس الرقي والفخامة' }) },
    { from: 0.46, to: 0.64, title: t('women.beat3.title', { fallback: 'عبايات فاخرة' }), subtitle: t('women.beat3.subtitle', { fallback: 'أصالة التقاليد بلمسة عصرية مبتكرة' }) },
    { from: 0.68, to: 0.86, title: t('women.beat4.title', { fallback: 'فساتين سهرة' }), subtitle: t('women.beat4.subtitle', { fallback: 'تصاميم تسرد قصة جمالك في كل مناسبة' }) },
    { from: 0.88, to: 1.0, title: t('women.beat5.title', { fallback: 'تسوقي الآن' }), subtitle: t('women.beat5.subtitle', { fallback: 'أحدث التشكيلات الحصرية' }), ctaLabel: t('women.beat5.cta', { fallback: 'تشكيلة النساء' }), ctaHref: '/categories/women' },
  ];

  const KIDS_STORY_BEATS: StoryBeat[] = [
    { from: 0.0, to: 0.18, title: t('kids.beat1.title', { fallback: 'عالم المرح' }), subtitle: t('kids.beat1.subtitle', { fallback: 'أزياء مريحة تواكب حيوية أطفالك' }) },
    { from: 0.22, to: 0.42, title: t('kids.beat2.title', { fallback: 'ألوان نابضة' }), subtitle: t('kids.beat2.subtitle', { fallback: 'تصاميم تملأ يومهم بالبهجة' }) },
    { from: 0.46, to: 0.64, title: t('kids.beat3.title', { fallback: 'راحة تامة' }), subtitle: t('kids.beat3.subtitle', { fallback: 'قطن طبيعي 100% لبشرة ناعمة' }) },
    { from: 0.68, to: 0.86, title: t('kids.beat4.title', { fallback: 'لكل مناسبة' }), subtitle: t('kids.beat4.subtitle', { fallback: 'ملابس اللعب والاحتفالات' }) },
    { from: 0.88, to: 1.0, title: t('kids.beat5.title', { fallback: 'تسوق للأطفال' }), subtitle: t('kids.beat5.subtitle', { fallback: 'اكتشف التشكيلة الجديدة' }), ctaLabel: t('kids.beat5.cta', { fallback: 'عالم الأطفال' }), ctaHref: '/categories/kids' },
  ];

  return (
    <main className="bg-[#0C0C0C] text-[#E2E2E2]" dir={isAr ? "rtl" : "ltr"}>
      {/* 0. HERO — Full-screen autoplay video with animated content */}
      <HeroSection />

      {/* 1. SHOES (scroll-driven cinematic sequence) */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/shoes/frame_{index:04d}.jpg"
        frameCount={120}
        scrollHeight="150vh"
        storyBeats={SHOES_STORY_BEATS}
        bgColor="#dfdcd3"
      />

      {/* 2. MEN */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/men/frame_{index:04d}.jpg"
        frameCount={FRAME_COUNT}
        scrollHeight="150vh"
        storyBeats={MEN_STORY_BEATS}
        bgColor="#0F1012"
      />

      {/* 3. WOMEN (Dresses & Abayas) */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/women/frame_{index:04d}.jpg"
        frameCount={FRAME_COUNT}
        scrollHeight="150vh"
        storyBeats={WOMEN_STORY_BEATS}
        bgColor="#120A0B"
      />

      {/* 4. KIDS */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/kids/frame_{index:04d}.jpg"
        frameCount={FRAME_COUNT}
        scrollHeight="150vh"
        storyBeats={KIDS_STORY_BEATS}
        bgColor="#0A0F11"
      />
    </main>
  );
}