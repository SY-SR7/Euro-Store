// @ts-nocheck
import Link from 'next/link';
import { createAdminSupabaseClient } from '@/supabase-server';
import { ScrollCategoryShowcase } from '@/components/home/ScrollCategoryShowcase';
import { CinematicShowcaseSection } from '@/components/home/CinematicShowcaseSection';
import type { StoryBeat } from '@/components/home/CinematicShowcaseSection';

export const dynamic = 'force-dynamic';

const CATEGORY_ORDER = ['shoes', 'bags', 'dresses', 'abayas', 'accessories', 'perfumes'];

/**
 * قصة الأحذية — 5 مشاهد تظهر وتختفي مع السكرول (مثل DJI)
 * from/to: نسبة السكرول 0–1
 */
const SHOES_STORY_BEATS: StoryBeat[] = [
  {
    from: 0.0,
    to: 0.18,
    title: 'فن يُرتدى',
    subtitle: 'أحذية أوروبية تصنع بشغف — كل تفصيلة حكاية',
  },
  {
    from: 0.22,
    to: 0.42,
    title: 'جلد أصيل',
    subtitle: 'خامات منتقاة من أفضل مصابغ إيطاليا',
  },
  {
    from: 0.46,
    to: 0.64,
    title: 'راحة لا تُساوم',
    subtitle: 'نعل مُهندس بدقة لإراحة قدميك طوال اليوم',
  },
  {
    from: 0.68,
    to: 0.86,
    title: 'تصميم خالد',
    subtitle: 'قطع لا تعرف الموضة — ترتديها في كل موسم',
  },
  {
    from: 0.88,
    to: 1.0,
    title: 'تسوق الآن',
    subtitle: 'تشكيلة الموسم متاحة الآن',
    ctaLabel: 'اكتشف التشكيلة',
    ctaHref: '/categories/shoes',
  },
];

/**
 * مسار الصور المتسلسلة.
 *
 * ① إذا استخرجت الصور بالسكريبت ستكون في public/frames/shoes/frame_0001.jpg ...
 *    → استخدم: (i) => `/frames/shoes/frame_${String(i + 1).padStart(4, '0')}.jpg`
 *
 * ② للتطوير المبدئي (قبل وجود الصور) سنستخدم placeholder تلقائي من API
 *    → استخدم: (i) => `/api/frame-placeholder?index=${i}&total=${FRAME_COUNT}`
 *
 * غيّر FRAMES_READY إلى true بعد استخراج الصور.
 */
const FRAMES_READY = true;
const FRAME_COUNT  = 120;

function shoesFrameSrc(index: number): string {
  if (FRAMES_READY) {
    return `/frames/shoes/frame_${String(index + 1).padStart(4, '0')}.jpg`;
  }
  // Demo: صورة تجريبية من Unsplash — ستُستبدل بالصور الحقيقية
  // نستخدم modulo لتدوير 10 صور وهمية لتحاكي الحركة
  const demoImages = [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&sat=-20',
    'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=1200&q=80',
    'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=1200&q=80&sat=-30',
    'https://images.unsplash.com/photo-1519035941-0e73a4f91fe8?w=1200&q=80',
    'https://images.unsplash.com/photo-1519035941-0e73a4f91fe8?w=1200&q=80&sat=-10',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80&sat=-25',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80&sat=-15',
  ];
  return demoImages[index % demoImages.length];
}

export default async function HomePage() {
  const supabase = createAdminSupabaseClient();

  const [categoriesRes, productsRes, variantsRes, brandsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id,name_ar,name_en,slug,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('products')
      .select('id,name_ar,name_en,slug,description_ar,description_en,category_id,brand_id,is_featured,is_active,image_url')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('product_variants')
      .select('id,product_id,sku,price_syp,compare_price_syp,stock_quantity,is_active')
      .eq('is_active', true),

    supabase
      .from('brands')
      .select('id,name,slug,is_active')
      .eq('is_active', true)
      .order('name'),
  ]);

  const categories = categoriesRes.data ?? [];
  const products   = productsRes.data ?? [];
  const variants   = variantsRes.data ?? [];
  const brands     = brandsRes.data ?? [];

  const orderedCategories = [...categories].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.slug);
    const bIndex = CATEGORY_ORDER.indexOf(b.slug);

    const safeA = aIndex === -1 ? 999 : aIndex;
    const safeB = bIndex === -1 ? 999 : bIndex;

    if (safeA !== safeB) return safeA - safeB;
    return Number(a.sort_order ?? 999) - Number(b.sort_order ?? 999);
  });

  const sections = orderedCategories.map((category) => {
    const categoryProducts = products.filter((product) => product.category_id === category.id);
    const introProduct = categoryProducts[0] ?? null;

    return {
      category,
      products: categoryProducts,
      introProduct,
      introVideoSrc: null, // تم استبدال الفيديو بالمكون السينمائي أعلاه
    };
  });

  return (
    <main className="min-h-screen bg-[#0C0C0C] text-[#E2E2E2]" dir="rtl">

      {/* ═══════════════════════════════════════════════════
          1. THE CINEMATIC HERO — DJI-style canvas sequence
          ═══════════════════════════════════════════════════ */}
      <CinematicShowcaseSection
        frameSrcPattern="/frames/shoes/frame_{index:04d}.jpg"
        frameCount={FRAME_COUNT}
        scrollHeight="380vh"
        storyBeats={SHOES_STORY_BEATS}
        bgColor="#0A0A0A"
      />

      {/* ═══════════════════════════════════════════════════
          2. CATEGORY NAV — transition from dark to light
          ═══════════════════════════════════════════════════ */}
      <div className="bg-[#FAF7EF] text-[#1F1B16]">
        <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="text-right">
              <p className="text-sm font-bold text-[#C9A84C] tracking-widest uppercase">أقسام المتجر</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight lg:text-5xl">
                اكتشف العالم الأوروبي لأزياء المرأة
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#6F6658]">
                من الأحذية الفاخرة إلى العطور الراقية — كل قسم تجربة بصرية قائمة بذاتها
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#E8DCC3] bg-[#FFFDF8] p-6 shadow-xl">
              <p className="text-sm font-bold text-[#C9A84C]">الأقسام</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {sections.map((section) => (
                  <a
                    key={section.category.id}
                    href={`#section-${section.category.slug}`}
                    className="rounded-xl border border-[#E8DCC3] px-4 py-2 text-sm font-bold text-[#6F6658] transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
                  >
                    {section.category.name_ar}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            3. SCROLL CATEGORY SHOWCASE — باقي الأقسام
            ═══════════════════════════════════════════════════ */}
        <div className="mx-auto max-w-7xl px-6">
          <ScrollCategoryShowcase sections={sections} variants={variants} brands={brands} />
        </div>
      </div>
    </main>
  );
}