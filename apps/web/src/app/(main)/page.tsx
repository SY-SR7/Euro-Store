import { CinematicShowcaseSection, type StoryBeat } from '@/components/home/CinematicShowcaseSection';
import { HeroSection } from '@/components/home/HeroSection';

export const dynamic = 'force-dynamic';

const SHOES_STORY_BEATS: StoryBeat[] = [
  { from: 0.0, to: 0.18, title: 'فن يُرتدى', subtitle: 'أحذية أوروبية تصنع بشغف — كل تفصيلة حكاية' },
  { from: 0.22, to: 0.42, title: 'جلد أصيل', subtitle: 'خامات منتقاة من أفضل مصابغ إيطاليا' },
  { from: 0.46, to: 0.64, title: 'راحة لا تُساوم', subtitle: 'نعل مُهندس بدقة لإراحة قدميك طوال اليوم' },
  { from: 0.68, to: 0.86, title: 'تصميم خالد', subtitle: 'قطع لا تعرف الموضة — ترتديها في كل موسم' },
  { from: 0.88, to: 1.0, title: 'تسوق الآن', subtitle: 'تشكيلة الموسم متاحة الآن', ctaLabel: 'اكتشف التشكيلة', ctaHref: '/categories/shoes' },
];

const MEN_STORY_BEATS: StoryBeat[] = [
  { from: 0.0, to: 0.18, title: 'هيبة الحضور', subtitle: 'أناقة رجالية تعكس قوة شخصيتك' },
  { from: 0.22, to: 0.42, title: 'دقة التفاصيل', subtitle: 'قصّات مصممة خصيصاً لتناسبك' },
  { from: 0.46, to: 0.64, title: 'خامات استثنائية', subtitle: 'أقمشة إيطالية مستوردة بعناية فائقة' },
  { from: 0.68, to: 0.86, title: 'أسلوب حياة', subtitle: 'من اجتماعات العمل إلى المناسبات الفاخرة' },
  { from: 0.88, to: 1.0, title: 'اكتشف الآن', subtitle: 'المجموعة الرجالية الجديدة', ctaLabel: 'تسوق الرجالي', ctaHref: '/categories/men' },
];

const WOMEN_STORY_BEATS: StoryBeat[] = [
  { from: 0.0, to: 0.18, title: 'أناقة لا تُنسى', subtitle: 'فساتين وعبايات مصممة لتخطفي الأنظار' },
  { from: 0.22, to: 0.42, title: 'لمسات فنية', subtitle: 'تطريز يدوي يعكس الرقي والفخامة' },
  { from: 0.46, to: 0.64, title: 'عبايات فاخرة', subtitle: 'أصالة التقاليد بلمسة عصرية مبتكرة' },
  { from: 0.68, to: 0.86, title: 'فساتين سهرة', subtitle: 'تصاميم تسرد قصة جمالك في كل مناسبة' },
  { from: 0.88, to: 1.0, title: 'تسوقي الآن', subtitle: 'أحدث التشكيلات الحصرية', ctaLabel: 'تشكيلة النساء', ctaHref: '/categories/women' },
];

const KIDS_STORY_BEATS: StoryBeat[] = [
  { from: 0.0, to: 0.18, title: 'عالم المرح', subtitle: 'أزياء مريحة تواكب حيوية أطفالك' },
  { from: 0.22, to: 0.42, title: 'ألوان نابضة', subtitle: 'تصاميم تملأ يومهم بالبهجة' },
  { from: 0.46, to: 0.64, title: 'راحة تامة', subtitle: 'قطن طبيعي 100% لبشرة ناعمة' },
  { from: 0.68, to: 0.86, title: 'لكل مناسبة', subtitle: 'ملابس اللعب والاحتفالات' },
  { from: 0.88, to: 1.0, title: 'تسوق للأطفال', subtitle: 'اكتشف التشكيلة الجديدة', ctaLabel: 'عالم الأطفال', ctaHref: '/categories/kids' },
];

const FRAME_COUNT  = 100; // Because the new scripts extract 100 frames

export default function HomePage() {
  return (
    <main className="bg-[#0C0C0C] text-[#E2E2E2]" dir="rtl">
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