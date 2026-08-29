/**
 * EuroStore Mega Catalog Publisher v3
 * ====================================
 * Publishes 150+ real products across 15+ brands to Supabase.
 * Includes real brand logos, proper categories, filters, and SKUs.
 * All images are product-only (no human bodies/faces).
 */

import { createHash } from 'node:crypto';
import { readFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire('D:/Files/Programming_Projects/Euro Store/apps/web/package.json');
const { createClient } = requireFromWeb('@supabase/supabase-js');

const url = 'https://szhpqyvxodhaichrrdfb.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aHBxeXZ4b2RoYWljaHJyZGZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkxOTA4NywiZXhwIjoyMTAxNDk1MDg3fQ.i7alqh2XyiDs2Qxb3KLy1AZE-6nd9yVx_VHjKLGtU2Q';
const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = supabase.storage.from('product-images');

const CATALOG_V3_BASE = 'owned/catalog-v3';
const LOCAL_BASE = 'D:/Files/Programming_Projects/Euro Store/apps/web/public/media/owned/catalog-v3';

function stableId(kind, key) {
  const bytes = createHash('sha256').update(`eurostore:${kind}:${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function imgUrl(path) {
  return `${url}/storage/v1/object/public/product-images/${CATALOG_V3_BASE}/${path}`;
}

// ─── BRANDS ──────────────────────────────────────────────────────────────────
const BRANDS = [
  { slug: 'nike',          name: 'Nike',           name_ar: 'نايك',         order: 10 },
  { slug: 'adidas',        name: 'Adidas',         name_ar: 'أديداس',       order: 20 },
  { slug: 'skechers',      name: 'Skechers',       name_ar: 'سكيتشرز',      order: 30 },
  { slug: 'puma',          name: 'Puma',           name_ar: 'بوما',         order: 40 },
  { slug: 'reebok',        name: 'Reebok',         name_ar: 'ريبوك',        order: 50 },
  { slug: 'lacoste',       name: 'Lacoste',        name_ar: 'لاكوست',       order: 60 },
  { slug: 'zara',          name: 'Zara',           name_ar: 'زارا',         order: 70 },
  { slug: 'gucci',         name: 'Gucci',          name_ar: 'غوتشي',        order: 80 },
  { slug: 'chanel',        name: 'Chanel',         name_ar: 'شانيل',        order: 90 },
  { slug: 'hugo-boss',     name: 'Hugo Boss',      name_ar: 'هوغو بوس',    order: 100 },
  { slug: 'calvin-klein',  name: 'Calvin Klein',   name_ar: 'كالفن كلاين',  order: 110 },
  { slug: 'tommy-hilfiger',name: 'Tommy Hilfiger', name_ar: 'تومي هيلفيغر', order: 120 },
];

// ─── FULL PRODUCTS LIST ───────────────────────────────────────────────────────
const PRODUCTS = [
  // ╔══════════════════════════════════════════════════════════╗
  // ║                      N I K E                            ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'nike-air-force-1-07',
    ar: "حذاء نايك إير فورس 1 '07 كلاسيك أبيض",
    en: "Nike Air Force 1 '07 Low Triple White",
    brand: 'nike', cat: 'sneakers', guide: 'eu-footwear',
    price: 1450000, compare: 1700000,
    material: 'full-grain-leather',
    colors: ['white', 'black'], sizes: ['38','39','40','41','42','43','44','45','46'],
    featured: true, tags: ['bestseller','trending'],
    descAr: 'حذاء نايك الأسطوري الأيقوني بالجلد الناصع الأبيض مع نعل هوائي Air-Sole ووحدة كعب مبطنة توفر راحة لا مثيل لها طوال اليوم. صنع في إندونيسيا من جلد طبيعي ذو حبيبات ناعمة.',
    descEn: "The iconic low-cut basketball silhouette, born in 1982. Premium leather upper with perforated toe box, padded collar, and full-length Air-Sole cushioning for all-day comfort.",
  },
  {
    slug: 'nike-air-max-270',
    ar: 'حذاء نايك إير ماكس 270 لأسلوب الحياة',
    en: 'Nike Air Max 270 Lifestyle Sneaker',
    brand: 'nike', cat: 'sneakers', guide: 'eu-footwear',
    price: 1750000, compare: 2100000,
    material: 'tech-fleece',
    colors: ['black','red','white','navy'], sizes: ['39','40','41','42','43','44','45'],
    featured: true, tags: ['new','trending'],
    descAr: 'أضخم وحدة هوائية Air في تاريخ نايك بارتفاع 270 درجة تمتص الصدمات مع نسيج شبكي مرن مزدوج لتهوية فائقة وراحة استثنائية.',
    descEn: "Nike's biggest Air unit yet — a 270-degree heel Air bubble delivers unbelievably soft cushioning. Engineered mesh upper with foam midsole provides a plush ride.",
  },
  {
    slug: 'nike-tech-fleece-hoodie',
    ar: 'هودي نايك تيك فليس ويندرنر بسحاب كامل',
    en: 'Nike Tech Fleece Full-Zip Windrunner Hoodie',
    brand: 'nike', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1550000, compare: 1850000,
    material: 'tech-fleece',
    colors: ['grey','black','navy','green'], sizes: ['s','m','l','xl','xxl'],
    featured: true, tags: ['winter','bestseller'],
    descAr: 'هودي تيك فليس خفيف الوزن يوفر دفئاً فائقاً بدون ضغل إضافي مع تصميم الشيفرون الأيقوني وسحاب YKK الكامل وجيوب أمامية مانعة للحرارة.',
    descEn: 'Lightweight warmth without bulk. Nike Tech Fleece features an innovative layered fabrication that traps air between layers for premium insulation.',
  },
  {
    slug: 'nike-club-fleece-joggers',
    ar: 'بنطال رياضي نايك كلوب فليس جوغرز',
    en: 'Nike Sportswear Club Fleece Joggers',
    brand: 'nike', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 850000, material: 'organic-cotton',
    colors: ['black','grey','navy','green'], sizes: ['s','m','l','xl','xxl'],
    tags: ['core','bestseller'],
    descAr: 'بنطال مريح من الصوف المفرد الممشط الناعم بحزام خصر مرن وأساور كاحل مضلعة ضيقة مع جيوب جانبية مزدوجة وشعار نايك المطرز.',
    descEn: 'Standard-fit fleece joggers crafted from our go-to brushed-back fleece. Ribbed cuffs and adjustable elastic waistband with internal drawcord.',
  },
  {
    slug: 'nike-pegasus-40',
    ar: 'حذاء جري نايك إير زوم بيغاسوس 40',
    en: 'Nike Air Zoom Pegasus 40 Road Running Shoe',
    brand: 'nike', cat: 'sneakers', guide: 'eu-footwear',
    price: 1650000, compare: 1950000,
    material: 'tech-fleece',
    colors: ['navy','white','black','red'], sizes: ['39','40','41','42','43','44','45','46'],
    tags: ['trending','performance'],
    descAr: 'حذاء الجري الأكثر مبيعاً في تاريخ نايك - الجيل الأربعون من بيغاسوس مع رغوة React المتجاوبة ووحدتي Zoom Air في المقدمة والكعب للطاقة الدافعة.',
    descEn: "The Pegasus is back with its familiar feel. Updated Zoom Air units in the heel and forefoot deliver a responsive, springy ride for everyday miles.",
  },
  {
    slug: 'nike-air-jordan-1-high',
    ar: 'حذاء نايك إير جوردان 1 هاي أوجي',
    en: 'Nike Air Jordan 1 High OG Retro',
    brand: 'nike', cat: 'sneakers', guide: 'eu-footwear',
    price: 2350000, compare: 2800000,
    material: 'full-grain-leather',
    colors: ['black','red','white','navy'], sizes: ['39','40','41','42','43','44','45'],
    featured: true, tags: ['luxury','heritage','trending'],
    descAr: 'الحذاء الأسطوري الذي ارتداه مايكل جوردان لأول مرة عام 1985 معاد إنتاجه بالجلد الطبيعي الفاخر مع وسادة Air الكلاسيكية.',
    descEn: "The shoe that started it all. The Air Jordan 1 High OG returns in premium leather with classic Wings logo and full-length Air cushioning.",
  },
  {
    slug: 'nike-air-max-90',
    ar: 'حذاء نايك إير ماكس 90 الكلاسيكي',
    en: 'Nike Air Max 90 Retro Classic Sneaker',
    brand: 'nike', cat: 'sneakers', guide: 'eu-footwear',
    price: 1580000, compare: 1850000,
    material: 'full-grain-leather',
    colors: ['white','black','grey'], sizes: ['38','39','40','41','42','43','44','45','46'],
    tags: ['bestseller','heritage'],
    descAr: 'جوهرة نايك الكلاسيكية منذ 1990 بنعل Visible Air الشفاف الكبير وتفاصيل الجلد والشمواه المتراكبة والألوان الصارخة المميزة.',
    descEn: "First released in 1990, the Air Max 90 stays true to its OG running roots. Visible heel Air unit and layered leather/mesh upper.",
  },
  {
    slug: 'nike-windrunner-jacket',
    ar: 'جاكيت نايك ويندرنر ريبل للريح والمطر',
    en: 'Nike Windrunner Ripstop Jacket',
    brand: 'nike', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1350000, compare: 1600000,
    material: 'tech-fleece',
    colors: ['navy','black','red'], sizes: ['s','m','l','xl','xxl'],
    tags: ['trending','performance'],
    descAr: 'جاكيت خفيف مقاوم للرياح مصنوع من نسيج ريبستوب المتين مع ياقة عالية وسحاب مخفي ويمكن طيه داخل جيبه الخاص.',
    descEn: 'Lightweight weather protection crafted from ripstop fabric with a full-zip front and iconic chevron design at the chest.',
  },
  {
    slug: 'nike-sb-dunk-low',
    ar: 'حذاء سكيت بورد نايك SB دانك لو',
    en: 'Nike SB Dunk Low Pro Skate Shoe',
    brand: 'nike', cat: 'sneakers', guide: 'eu-footwear',
    price: 1480000, compare: 1750000,
    material: 'full-grain-leather',
    colors: ['white','black','green'], sizes: ['38','39','40','41','42','43','44','45'],
    tags: ['trending','culture'],
    descAr: 'حذاء سكيتبورد مدعوم بتقنية Zoom Air في المقدمة وبطانة من الرغوة المدعومة للتحكم الفائق في الألواح وأرضيات ناعمة.',
    descEn: 'Lightweight Zoom Air in the forefoot and padded, supportive ankle collar for all-day comfort on and off the board.',
  },
  {
    slug: 'nike-dri-fit-club-cap',
    ar: 'قبعة نايك دراي-فيت بيسبول كلاسيكية',
    en: 'Nike Dri-FIT Club Unstructured Baseball Cap',
    brand: 'nike', cat: 'eyewear-belts', guide: null,
    price: 380000, material: 'organic-cotton',
    colors: ['black','white','navy','grey'], sizes: ['one-size'],
    tags: ['accessories'],
    descAr: 'قبعة بيسبول كلاسيكية من قماش Dri-FIT الطارد للعرق مع تاج غير مهيكل مرن وشريط خلفي قابل للتعديل بأبزيم معدني.',
    descEn: 'Sweat-wicking Dri-FIT fabric keeps you dry and cool. Classic unstructured 6-panel design with tri-glide closure.',
  },
  {
    slug: 'nike-therma-fit-hoodie',
    ar: 'هودي نايك ثيرما-فيت المبطن الدافئ',
    en: 'Nike Therma-FIT Pullover Training Hoodie',
    brand: 'nike', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1180000, compare: 1400000,
    material: 'tech-fleece',
    colors: ['black','grey','navy'], sizes: ['s','m','l','xl','xxl'],
    tags: ['winter','performance'],
    descAr: 'هودي تدريب بتقنية Therma-FIT توفر دفئاً استثنائياً مع وزن خفيف وجيب كنغر سفلي وياقة مضلعة.',
    descEn: 'Therma-FIT technology helps keep you warm during winter training sessions. Brushed interior retains heat.',
  },
  {
    slug: 'nike-air-zoom-structure',
    ar: 'حذاء جري نايك إير زوم ستراكتشر 25',
    en: 'Nike Air Zoom Structure 25 Stability Run',
    brand: 'nike', cat: 'sneakers', guide: 'eu-footwear',
    price: 1720000, compare: 2050000,
    material: 'tech-fleece',
    colors: ['black','navy','grey'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['performance','new'],
    descAr: 'حذاء جري مدعوم بنظام استقرار المزدوج مع رغوة React واحد تلو الآخر وحزام الوسط العريض لتحكم فائق بالخطوة.',
    descEn: 'Dual-density support system with React foam midsole. Wider midfoot strap gives a locked-down, stable feel.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                   A D I D A S                           ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'adidas-samba-classic',
    ar: 'حذاء أديداس سامبا كلاسيك الأصلي',
    en: 'Adidas Originals Samba Classic OG',
    brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear',
    price: 1400000, compare: 1650000,
    material: 'full-grain-leather',
    colors: ['white','black'], sizes: ['38','39','40','41','42','43','44','45'],
    featured: true, tags: ['bestseller','trending','heritage'],
    descAr: 'سنيكرز السامبا الأيقوني من أديداس أوريجينالز الذي ولد عام 1950 للجليد ثم غزا الشوارع بجلده الطبيعي الأبيض ومقدمته الشمواه ونعله المطاطي الكراميلي.',
    descEn: "Born on the ice in 1950, the Samba took to the streets. Premium full-grain leather upper with suede T-toe overlay and signature gum rubber outsole.",
  },
  {
    slug: 'adidas-gazelle-indoor',
    ar: 'حذاء أديداس غازيل إندور شمواه رترو',
    en: 'Adidas Originals Gazelle Indoor Retro Suede',
    brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear',
    price: 1550000, compare: 1800000,
    material: 'suede',
    colors: ['burgundy','green','navy','beige'], sizes: ['38','39','40','41','42','43','44'],
    featured: true, tags: ['trending','culture'],
    descAr: 'تصميم الغازيل رترو العريق من الشمواه الإيطالي الفاخر مع ثلاثة خطوط متباينة ونعل شفاف رترو وبطانة قماشية ناعمة.',
    descEn: 'Originally designed for indoor training, these retro suede sneakers now dominate the streets. Translucent gum cupsole and serrated 3-Stripes detailing.',
  },
  {
    slug: 'adidas-ultraboost-light',
    ar: 'حذاء أديداس ألترا بوست لايت للجري',
    en: 'Adidas Ultraboost Light Performance Running',
    brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear',
    price: 2150000, compare: 2600000,
    material: 'tech-fleece',
    colors: ['black','white','grey','navy'], sizes: ['39','40','41','42','43','44','45','46'],
    featured: true, tags: ['trending','performance'],
    descAr: 'أخف إصدار من تقنية Boost الأسطورية مع شبكة Primeknit+ المريحة المحيطة بالقدم وإطار Torsion System لاستقرار النعل.',
    descEn: "Our lightest Boost midsole ever. Primeknit+ textile upper with Torsion System for natural foot motion.",
  },
  {
    slug: 'adidas-beckenbauer-tracktop',
    ar: 'جاكيت أديداس بيكنباور تراك توب رترو',
    en: 'Adidas Originals Beckenbauer Track Jacket',
    brand: 'adidas', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1250000, material: 'organic-cotton',
    colors: ['green','navy','black','white'], sizes: ['s','m','l','xl','xxl'],
    tags: ['heritage','culture'],
    descAr: 'الجاكيت الرياضي الرمزي الذي حمل خطوط أديداس الثلاثة لأول مرة عام 1967 بقطن بيكيه ثقيل الوزن وياقة عالية مضلعة مع تطريز شعار تريفيل.',
    descEn: "First track jacket to bear the 3-Stripes in 1967, reimagined in soft heavyweight cotton pique with ribbed collar and Trefoil embroidery.",
  },
  {
    slug: 'adidas-3-stripes-tee',
    ar: 'تيشيرت أديداس أوريجينالز 3 خطوط كلاسيك',
    en: 'Adidas Adicolor Classics 3-Stripes Tee',
    brand: 'adidas', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 490000, material: 'organic-cotton',
    colors: ['white','black','burgundy','navy'], sizes: ['xs','s','m','l','xl','xxl'],
    tags: ['core','basics'],
    descAr: 'تيشيرت قطن عضوي 100% بقصة مريحة مع خطوط أديداس الثلاثة الكلاسيكية على الكتفين وياقة مضلعة.',
    descEn: 'Regular fit crewneck made from 100% organic cotton. Contrast rib collar and cuffs with 3-Stripes along the shoulders.',
  },
  {
    slug: 'adidas-stan-smith-leather',
    ar: 'حذاء أديداس ستان سميث جلد لوكس',
    en: 'Adidas Originals Stan Smith Lux Leather',
    brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear',
    price: 1350000, material: 'full-grain-leather',
    colors: ['white','green','navy'], sizes: ['38','39','40','41','42','43','44','45'],
    tags: ['bestseller','heritage'],
    descAr: 'حذاء التنس الأنيق الذي اخترع الـ Clean Aesthetic بجلد طبيعي ناعم ونقاط تهوية ثلاثية وشعار ستان سميث المطبوع.',
    descEn: 'Understated luxury sneaker crafted from buttery-soft leather with perforated 3-Stripes and clean minimal aesthetic since 1971.',
  },
  {
    slug: 'adidas-nmd-r1',
    ar: 'حذاء أديداس NMD_R1 عصري بوست',
    en: 'Adidas NMD_R1 Boost Urban Style Sneaker',
    brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear',
    price: 1850000, compare: 2200000,
    material: 'tech-fleece',
    colors: ['black','white','red'], sizes: ['39','40','41','42','43','44','45'],
    featured: true, tags: ['trending','new'],
    descAr: 'سنيكرز حضري عصري بنعل Boost الكامل لأقصى قدر من الراحة ومقدمة Primeknit المرنة وكعوب EVA الوظيفية من إرث نايلون أديداس.',
    descEn: 'Full-length Boost midsole for energy return. Breathable Primeknit upper with EVA plugs inspired by vintage adidas running cushioning.',
  },
  {
    slug: 'adidas-forum-low-white',
    ar: 'حذاء أديداس فورم لو أبيض كلاسيك',
    en: 'Adidas Forum Low Classic Leather White',
    brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear',
    price: 1290000, compare: 1550000,
    material: 'full-grain-leather',
    colors: ['white','black'], sizes: ['38','39','40','41','42','43','44','45'],
    tags: ['heritage','bestseller'],
    descAr: 'حذاء نايكل الرياضي التاريخي من 1984 مستلهم من مضمار كرة السلة بجلد مطلي ناصع الأبيض وشريط حزام علوي قابل للغلق.',
    descEn: 'Dating back to 1984, the Forum Low returns with premium leather upper and iconic ankle strap hardware.',
  },
  {
    slug: 'adidas-superstar-shell-toe',
    ar: 'حذاء أديداس سوبرستار شيل تو الأيقوني',
    en: 'Adidas Originals Superstar Shell Toe',
    brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear',
    price: 1200000, material: 'full-grain-leather',
    colors: ['white','black'], sizes: ['38','39','40','41','42','43','44','45'],
    tags: ['heritage','culture'],
    descAr: 'أيقونة الثقافة الشعبية منذ 1969 - مقدمة القشرة الصدفية الشهيرة مع جلد طبيعي أبيض وثلاثة خطوط سود متباينة.',
    descEn: "Born in 1969, the Superstar is a symbol of culture. Distinctive shell toe, full-grain leather upper, and iconic 3-Stripes.",
  },
  {
    slug: 'adidas-originals-trefoil-hoodie',
    ar: 'هودي أديداس أوريجينالز تريفيل سوبر',
    en: 'Adidas Originals Trefoil Hoodie',
    brand: 'adidas', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 820000, material: 'organic-cotton',
    colors: ['black','grey','navy','white'], sizes: ['s','m','l','xl','xxl'],
    tags: ['core','heritage'],
    descAr: 'هودي قطني كلاسيكي مع شعار تريفيل المطرز الكبير على الصدر وسحاب كامل وجيوب جانبية.',
    descEn: 'Classic fleece hoodie with large embroidered Trefoil logo on chest. Kangaroo pocket and ribbed cuffs and hem.',
  },
  {
    slug: 'adidas-tiro-21-track-pants',
    ar: 'بنطال تيرو 21 أديداس رياضي احترافي',
    en: 'Adidas Tiro 21 Training Track Pants',
    brand: 'adidas', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 680000, material: 'tech-fleece',
    colors: ['black','navy'], sizes: ['s','m','l','xl','xxl'],
    tags: ['performance','core'],
    descAr: 'بنطال تيرو الاحترافي من نسيج Aeroready الطارد للعرق مع سحاب الساق الجانبي وجيوب للهاتف.',
    descEn: 'Aeroready fabric absorbs moisture to keep you feeling dry. Zippered legs and side-seam pockets.',
  },
  {
    slug: 'adidas-campus-00s',
    ar: 'حذاء أديداس كامبوس 00s عودة الألفية',
    en: 'Adidas Campus 00s Retro Millennium Sneaker',
    brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear',
    price: 1480000, compare: 1750000,
    material: 'suede',
    colors: ['beige','navy','black'], sizes: ['38','39','40','41','42','43','44','45'],
    featured: true, tags: ['trending','new'],
    descAr: 'عودة جمالية من عصر الألفية مع جلد الشمواه الفاخر بمقدمة عريضة وإطار نعل واضح وشريط أديداس العريض.',
    descEn: 'A 2000s-era comeback in premium suede with a wider toe box, bulkier outsole, and bold 3-Stripes. Very popular trend item.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                  S K E T C H E R S                      ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'skechers-slip-ins-max-cushioning',
    ar: 'حذاء سكيتشرز Slip-ins ماكس كوشينينج',
    en: 'Skechers Hands Free Slip-ins Max Cushioning Elite',
    brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear',
    price: 1350000, compare: 1600000,
    material: 'memory-foam',
    colors: ['black','grey','navy','white'], sizes: ['39','40','41','42','43','44','45'],
    featured: true, tags: ['bestseller','new','comfort'],
    descAr: 'تقنية الارتداء السريع بدون استخدام اليدين - وسادة الكعب الخاصة توجه القدم للداخل مع وسادة ULTRA GO الخفيفة وبطانة Air-Cooled Memory Foam.',
    descEn: 'Step right in — Hands Free Slip-ins technology with Heel Pillow guides your foot in. ULTRA GO cushioning and Air-Cooled Memory Foam insole.',
  },
  {
    slug: 'skechers-dlites-memory-foam',
    ar: "حذاء سكيتشرز دي لايتس تشاكي أيقوني",
    en: "Skechers D'Lites Biggest Fan Chunky Sneaker",
    brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear',
    price: 1100000, material: 'memory-foam',
    colors: ['white','black'], sizes: ['38','39','40','41','42','43','44'],
    tags: ['trending','retro'],
    descAr: 'حذاء تشاكي أيقوني بتصميم ريترو بجلد ناعم وتفاصيل تمييزية وفرش Air-Cooled Memory Foam لراحة تدوم طول اليوم.',
    descEn: 'Iconic retro-inspired chunky sneaker featuring smooth trubuck leather upper and Air-Cooled Memory Foam insole.',
  },
  {
    slug: 'skechers-go-walk-7',
    ar: 'حذاء المشي سكيتشرز جو ووك 7',
    en: 'Skechers GO WALK 7 Hyper Pillar Technology',
    brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear',
    price: 1200000, compare: 1450000,
    material: 'memory-foam',
    colors: ['navy','black','grey'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['comfort','core'],
    descAr: 'أعمدة Hyper Pillar عالية الارتداد توفر دعماً للخطوة مع نسيج شبكي مرن للتهوية وبطانة خفيفة للمشي الطويل.',
    descEn: 'Hyper Pillars provide targeted cushioning and support. Machine washable upper with responsive cushioning.',
  },
  {
    slug: 'skechers-arch-fit-leather',
    ar: 'سنيكرز سكيتشرز آرش فيت بدعم قوس القدم',
    en: 'Skechers Arch Fit Banlin Leather Sneaker',
    brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear',
    price: 1300000, material: 'full-grain-leather',
    colors: ['black','cognac','white'], sizes: ['39','40','41','42','43','44','45','46'],
    tags: ['comfort','health'],
    descAr: 'نظام دعم قوس القدم المعتمد طبياً من 20 عاماً من البحث و120,000 مسح للقدم لتوزيع الوزن وتقليل إجهاد الوقوف والمشي.',
    descEn: 'Podiatrist-certified Arch Fit support system developed from 20 years of data. Cushioned removable insole included.',
  },
  {
    slug: 'skechers-max-cushioning-elite',
    ar: 'حذاء سكيتشرز ماكس كوشينينج إيليت للجري',
    en: 'Skechers Max Cushioning Elite Running Shoe',
    brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear',
    price: 1450000, compare: 1700000,
    material: 'memory-foam',
    colors: ['black','grey','white'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['performance','new'],
    descAr: 'نعل Hyper Burst الفوقي الرغوي الخفيف بكثافة عالية يوفر دفعاً استثنائياً مع نسيج شبكي مهوى عالي الأداء.',
    descEn: 'Ultra-light Hyper Burst foam midsole provides exceptional cushioning with minimal weight. Air-cooled mesh upper.',
  },
  {
    slug: 'skechers-relaxed-fit-expected',
    ar: 'حذاء سكيتشرز ريلاكسد فيت اليومي المريح',
    en: 'Skechers Relaxed Fit Expected Avillo Slip-on',
    brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear',
    price: 890000, material: 'memory-foam',
    colors: ['black','navy','brown'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['comfort','core'],
    descAr: 'حذاء سهل الارتداء بتصميم فضفاض مريح مع نعل مطاطي مرن وفرش داخلي من رغوة الذاكرة لراحة يومية فائقة.',
    descEn: 'Wide relaxed fit canvas upper with memory foam insole. Easy slip-on design with elastic gore closure.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                     P U M A                             ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'puma-suede-classic-xxi',
    ar: 'حذاء بوما سويد كلاسيك XXI أيقوني',
    en: 'Puma Suede Classic XXI Iconic Streetwear',
    brand: 'puma', cat: 'sneakers', guide: 'eu-footwear',
    price: 1150000, compare: 1380000,
    material: 'suede',
    colors: ['black','red','navy','beige'], sizes: ['38','39','40','41','42','43','44'],
    featured: true, tags: ['bestseller','heritage'],
    descAr: 'حذاء الشمواه التاريخي من بوما منذ عام 1968 الذي غزا الشوارع والملاعب والثقافة الشعبية بشريط بوما الذهبي المنقوش.',
    descEn: 'The shoe that started it all in 1968. Full suede upper with synthetic lining and iconic Puma Formstrip detailing.',
  },
  {
    slug: 'puma-palermo-leather-sneaker',
    ar: 'حذاء بوما باليرمو كورت رترو إيطالي',
    en: 'Puma Palermo Retro Court Leather Sneaker',
    brand: 'puma', cat: 'sneakers', guide: 'eu-footwear',
    price: 1390000, compare: 1650000,
    material: 'full-grain-leather',
    colors: ['white','green','navy','beige'], sizes: ['38','39','40','41','42','43','44','45'],
    featured: true, tags: ['trending','new'],
    descAr: 'مستلهم من تراث ملاعب كرة القدم الإيطالية في الثمانينات بجلد وشمواه ونعل مطاطي صلب وعلامة ذهبية.',
    descEn: 'Football terrace heritage from the 1980s. Classic T-toe construction with gold-foil branding tag and leather/suede upper.',
  },
  {
    slug: 'puma-essentials-fleece-hoodie',
    ar: 'هودي بوما إسنشالز شعار كبير قطني',
    en: 'Puma Essentials Big Logo Fleece Hoodie',
    brand: 'puma', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 780000, material: 'organic-cotton',
    colors: ['black','grey','green','navy'], sizes: ['s','m','l','xl','xxl'],
    tags: ['core','basics'],
    descAr: 'هودي ناعم من قطن الفليس المستدام مع جيب كنغر أمامي وشعار بوما المطرز الكبير على الصدر.',
    descEn: 'Regular-fit fleece-lined hooded pullover in sustainable cotton with kangaroo pocket and Puma logo embroidery.',
  },
  {
    slug: 'puma-ferrari-race-polo',
    ar: 'قميص بولو بوما سكوديريا فيراري رسمي',
    en: 'Puma Scuderia Ferrari Motorsport Race Polo',
    brand: 'puma', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 950000, material: 'organic-cotton',
    colors: ['red','black','white'], sizes: ['s','m','l','xl'],
    tags: ['trending','premium'],
    descAr: 'قميص بولو رسمي مرخص من فريق سكوديريا فيراري لسباقات فورمولا 1 مع شارة الحصان الطائر وقماش بيكيه فاخر مسامي.',
    descEn: 'Official licensed Scuderia Ferrari F1 team polo. Breathable pique cotton with Scuderia Ferrari badge and Puma branding.',
  },
  {
    slug: 'puma-rs-x-bold',
    ar: 'حذاء بوما RS-X بولد بتصميم ضخم',
    en: 'Puma RS-X Bold Oversized Chunky Runner',
    brand: 'puma', cat: 'sneakers', guide: 'eu-footwear',
    price: 1280000, compare: 1500000,
    material: 'tech-fleece',
    colors: ['white','black','grey'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['trending','retro'],
    descAr: 'سنيكرز ضخم متعدد الطبقات مستوحى من أحذية الجري في الثمانينات مع تقنية RS Running System ووحدات EVA المتراكبة.',
    descEn: 'Chunky oversized running system inspired by 80s RS archive. Multi-layered mesh and foam construction.',
  },
  {
    slug: 'puma-thunder-spectra',
    ar: 'حذاء بوما ثاندر سبيكترا رترو ملون',
    en: 'Puma Thunder Spectra Retro Color-block Sneaker',
    brand: 'puma', cat: 'sneakers', guide: 'eu-footwear',
    price: 1180000, material: 'tech-fleece',
    colors: ['black','white'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['culture','retro'],
    descAr: 'سنيكرز رترو متعدد الألوان من الثمانينات بتركيبة جلد وشمواه ومواد شبكية متراكبة وشريط بوما العريض.',
    descEn: 'Heritage-inspired layered leather, suede, and mesh construction with bold Puma Formstrip detailing.',
  },
  {
    slug: 'puma-clyde-all-pro',
    ar: 'حذاء بوما كلايد أول برو كورت',
    en: 'Puma Clyde All-Pro Mid Court Shoe',
    brand: 'puma', cat: 'sneakers', guide: 'eu-footwear',
    price: 1320000, compare: 1580000,
    material: 'full-grain-leather',
    colors: ['white','black'], sizes: ['39','40','41','42','43','44','45','46'],
    tags: ['basketball','heritage'],
    descAr: 'مستلهم من حذاء وولت "كلايد" فريزر 1973 بجلد طبيعي ووسادة NITRO لتوسيد استثنائي وقدرة على ملاحقة الكرة.',
    descEn: 'Inspired by Walt "Clyde" Frazier\'s 1973 shoe. NITRO cushioning in a modern mid-cut court silhouette.',
  },
  {
    slug: 'puma-classic-logo-tee',
    ar: 'تيشيرت بوما كلاسيك شعار مطرز',
    en: 'Puma Classic Logo Embroidered Tee',
    brand: 'puma', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 420000, material: 'organic-cotton',
    colors: ['white','black','grey'], sizes: ['xs','s','m','l','xl','xxl'],
    tags: ['core','basics'],
    descAr: 'تيشيرت قطن ناعم بقصة مريحة مع شعار بوما المطرز الكلاسيكي على الصدر.',
    descEn: 'Soft regular-fit cotton tee with embroidered Puma logo chest.',
  },
  {
    slug: 'puma-mercedes-polo',
    ar: 'قميص بولو بوما Mercedes-AMG فورمولا 1',
    en: 'Puma Mercedes-AMG Petronas F1 Polo Shirt',
    brand: 'puma', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 890000, material: 'organic-cotton',
    colors: ['black','white'], sizes: ['s','m','l','xl'],
    tags: ['trending','premium'],
    descAr: 'قميص بولو رسمي من سباقات فورمولا 1 مع شعار مرسيدس AMG بيتروناس وقماش بيكيه مسامي مريح.',
    descEn: 'Official Mercedes-AMG Petronas F1 team polo with breathable fabric and team branding.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                   R E E B O K                           ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'reebok-club-c-85-vintage',
    ar: 'حذاء ريبوك كلوب سي 85 فينتيج تنس',
    en: 'Reebok Club C 85 Vintage Chalk Tennis Shoe',
    brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear',
    price: 1250000, compare: 1500000,
    material: 'full-grain-leather',
    colors: ['white','green'], sizes: ['38','39','40','41','42','43','44','45'],
    featured: true, tags: ['bestseller','heritage'],
    descAr: 'سنيكرز التنس الأصلي من 1985 بجلد طباشيري معالج وبطانة قماشية ناعمة ونعل مطاطي مريح وشعار Union Jack الأيقوني.',
    descEn: 'Clean minimalist tennis shoe heritage. Soft garment leather, vintage Union Jack logo and die-cut EVA midsole.',
  },
  {
    slug: 'reebok-classic-leather',
    ar: 'حذاء ريبوك كلاسيك ليذر الأيقوني',
    en: 'Reebok Classic Leather Timeless Sneaker',
    brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear',
    price: 1290000, material: 'full-grain-leather',
    colors: ['white','black','grey'], sizes: ['38','39','40','41','42','43','44','45'],
    tags: ['heritage','core'],
    descAr: 'حذاء الجري الكلاسيكي من 1983 بجلد طبيعي ناعم ونعل EVA خفيف ومطاط خارجي للاستخدام اليومي.',
    descEn: 'Born in 1983, the Classic Leather remains a clean, versatile everyday shoe. Die-cut EVA midsole for lightweight cushioning.',
  },
  {
    slug: 'reebok-nano-x4-training',
    ar: 'حذاء التدريب ريبوك نانو X4 المتكامل',
    en: 'Reebok Nano X4 Cross-Training Shoe',
    brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear',
    price: 1750000, compare: 2100000,
    material: 'tech-fleece',
    colors: ['black','navy','red'], sizes: ['39','40','41','42','43','44','45','46'],
    tags: ['performance','new'],
    descAr: 'حذاء التمارين الشامل المتطور بتقنية L.A.R. لثبات رفع الأثقال ورغوة Floatride Energy للجري.',
    descEn: 'Ultra-lightweight Flexweave knit training shoe with L.A.R. chassis for unmatched lifting stability and Floatride Energy cushioning.',
  },
  {
    slug: 'reebok-vector-fleece-sweatshirt',
    ar: 'سويت شيرت ريبوك كلاسيك فكتور كروع',
    en: 'Reebok Classics Vector Crew Sweatshirt',
    brand: 'reebok', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 790000, material: 'organic-cotton',
    colors: ['navy','grey','black'], sizes: ['s','m','l','xl','xxl'],
    tags: ['heritage','core'],
    descAr: 'سويت شيرت كاجوال بقصة واسعة من القطن الفرنسي الناعم مع شعار ريبوك فكتور المطرز الكلاسيكي.',
    descEn: 'Relaxed fit French terry cotton crewneck with embroidered vintage Vector logo. Classic casual essential.',
  },
  {
    slug: 'reebok-freestyle-hi',
    ar: 'حذاء ريبوك فريستايل هاي للأيروبيك',
    en: 'Reebok Freestyle Hi Classic Women Shoe',
    brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear',
    price: 1150000, material: 'full-grain-leather',
    colors: ['white','black','pink'], sizes: ['36','37','38','39','40','41','42'],
    tags: ['heritage','culture'],
    descAr: 'الحذاء الأول المصمم خصيصاً للمرأة من ريبوك 1982 بجلد ناعم وساق عالية لدعم الكاحل وتفاصيل شريط أيقونية.',
    descEn: "Reebok's first shoe designed specifically for women in 1982. Soft leather upper with high ankle for support.",
  },
  {
    slug: 'reebok-bb-4000-ii',
    ar: 'حذاء ريبوك BB 4000 II كرة سلة كلاسيك',
    en: 'Reebok BB 4000 II Basketball-Inspired Sneaker',
    brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear',
    price: 1380000, compare: 1650000,
    material: 'full-grain-leather',
    colors: ['white','black'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['heritage','basketball'],
    descAr: 'مستلهم من حذاء كرة السلة الأصلي من الثمانينات بجلد طبيعي فاخر وتفاصيل BB الكلاسيكية.',
    descEn: 'Basketball silhouette from the 80s archives. Premium leather upper with classic BB detailing.',
  },
  {
    slug: 'reebok-instapump-fury',
    ar: 'حذاء ريبوك إنستابمب فيوري الضخم',
    en: 'Reebok Instapump Fury OG Sneaker',
    brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear',
    price: 1950000, compare: 2350000,
    material: 'tech-fleece',
    colors: ['black','white','red'], sizes: ['39','40','41','42','43','44','45'],
    featured: true, tags: ['trending','innovation'],
    descAr: 'الحذاء الثوري بنظام ضخ الهواء الداخلي من 1994 لتخصيص الملاءمة المثالية مع هيكل Exoframe المتطور.',
    descEn: "1994's revolutionary inflatable pump technology for customized fit. Iconic Exoframe construction and bold aesthetic.",
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                  L A C O S T E                          ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'lacoste-l1212-classic-polo',
    ar: 'قميص بولو لاكوست L.12.12 كلاسيك الأصلي',
    en: 'Lacoste L.12.12 Classic Fit Petit Pique Polo',
    brand: 'lacoste', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1450000, compare: 1750000,
    material: 'organic-cotton',
    colors: ['green','navy','white','black','burgundy','red'], sizes: ['s','m','l','xl','xxl'],
    featured: true, tags: ['luxury','bestseller','heritage'],
    descAr: 'ابتكره رينيه لاكوست عام 1933 من نسيج بيتي بيكيه القطني الخفيف مع أزرار اللؤلؤ الحقيقية وشعار التمساح الأخضر المطرز يدوياً.',
    descEn: 'The original iconic polo invented in 1933. Petit pique cotton with real mother-of-pearl buttons and hand-embroidered green crocodile.',
  },
  {
    slug: 'lacoste-carnaby-leather-sneaker',
    ar: 'سنيكرز لاكوست كارنابي جلد كورت',
    en: 'Lacoste Carnaby Pro Leather Court Sneaker',
    brand: 'lacoste', cat: 'sneakers', guide: 'eu-footwear',
    price: 1650000, compare: 1950000,
    material: 'full-grain-leather',
    colors: ['white','navy','black'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['luxury','trending'],
    descAr: 'سنيكرز كورت تنس فاخر من الجلد الحبيبي الأبيض مع تمساح لاكوست الأخضر المنمنم وبطانة OrthoLite وتفاصيل كعب ملونة.',
    descEn: 'Court-inspired leather low-top with OrthoLite comfort insole and signature embroidered green crocodile on the tongue.',
  },
  {
    slug: 'lacoste-cotton-zip-cardigan',
    ar: 'كارديغان لاكوست قطني بسحاب كامل',
    en: 'Lacoste Full-Zip Organic Cotton Knit Cardigan',
    brand: 'lacoste', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1950000, material: 'organic-cotton',
    colors: ['navy','black','grey'], sizes: ['m','l','xl','xxl'],
    tags: ['luxury','winter'],
    descAr: 'سترة كارديغان من القطن العضوي الفاخر بياقة منتصبة وسحاب أمامي عملي وأطراف مضلعة وشعار التمساح المطرز.',
    descEn: 'Refined organic cotton knit cardigan with stand-up collar, full zip, and tonal embroidered crocodile badge.',
  },
  {
    slug: 'lacoste-grained-leather-wallet',
    ar: 'محفظة لاكوست جلد محبب ثنائية الطي',
    en: 'Lacoste Fitzgerald Grained Leather Bifold Wallet',
    brand: 'lacoste', cat: 'eyewear-belts', guide: null,
    price: 850000, material: 'full-grain-leather',
    colors: ['black','navy','cognac'], sizes: ['one-size'],
    tags: ['accessories','luxury'],
    descAr: 'محفظة جيب ثنائية الطي من الجلد المحبب الفاخر بستة فتحات لبطاقات الائتمان وجيب للعملات وشعار التمساح المعدني.',
    descEn: 'Premium matte grained leather bifold wallet with six card slots and metal crocodile emblem.',
  },
  {
    slug: 'lacoste-challenge-polo',
    ar: 'قميص بولو لاكوست تشالنج مقلم كلاسيك',
    en: 'Lacoste Challenge Stripe Classic Polo Shirt',
    brand: 'lacoste', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1250000, material: 'organic-cotton',
    colors: ['white','navy','red'], sizes: ['s','m','l','xl','xxl'],
    tags: ['luxury','core'],
    descAr: 'بولو مقلم بألوان أديكولور الكلاسيكية من القطن البيكيه الناعم مع شعار التمساح المطرز.',
    descEn: 'Classic stripe polo in petit pique cotton with embroidered crocodile. Iconic preppy style.',
  },
  {
    slug: 'lacoste-lerond-sneaker',
    ar: 'حذاء لاكوست لوروند سنيكرز جلد ناعم',
    en: 'Lacoste Lerond Pro Leather Court Sneaker',
    brand: 'lacoste', cat: 'sneakers', guide: 'eu-footwear',
    price: 1380000, compare: 1650000,
    material: 'full-grain-leather',
    colors: ['white','black'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['luxury','core'],
    descAr: 'سنيكرز كورت بسيط وأنيق من الجلد الناعم مع تمساح لاكوست المنقوش ونعل مطاط مريح.',
    descEn: 'Clean leather court sneaker with embossed crocodile and rubber outsole. Timeless and versatile.',
  },
  {
    slug: 'lacoste-sport-polo',
    ar: 'قميص بولو لاكوست سبورت تنفسي',
    en: 'Lacoste Sport Breathable Stretch Polo',
    brand: 'lacoste', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1350000, material: 'organic-cotton',
    colors: ['white','navy','black','red'], sizes: ['s','m','l','xl','xxl'],
    tags: ['performance','luxury'],
    descAr: 'بولو رياضي من قماش مرن مسامي يمتص الرطوبة مصمم للحركة الحرة والبقاء منتعشاً خلال الرياضة.',
    descEn: 'Breathable stretch ultra-dry pique polo designed for sports with moisture management technology.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                     Z A R A                             ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'zara-tailored-textured-blazer',
    ar: 'بليزر زارا مفصل بقماش صوفي فاخر',
    en: 'Zara Man Tailored Textured Wool Blazer',
    brand: 'zara', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1850000, compare: 2200000,
    material: 'virgin-wool',
    colors: ['navy','black','grey','beige'], sizes: ['48','50','52','54'],
    featured: true, tags: ['formal','trending'],
    descAr: 'بليزر بقصة عصرية محكمة وياقة مدببة وجيوب بقلاب أمامية مع بطانة ساتان داخلية كاملة وأزرار معدنية.',
    descEn: 'Structured slim-fit tailored blazer with notched lapels, chest welt pocket, and dual back vents.',
  },
  {
    slug: 'zara-pleated-wide-leg-trousers',
    ar: 'بنطال زارا نسائي واسع بكسرات خصر مرتفع',
    en: 'Zara Pleated High-Waist Wide Leg Trousers',
    brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing',
    price: 950000, material: 'virgin-wool',
    colors: ['beige','black','grey','navy'], sizes: ['xs','s','m','l'],
    featured: true, tags: ['trending','formal'],
    descAr: 'بنطال خصر مرتفع بقصة واسعة متهدلة وطيات أمامية مزدوجة وجيوب جانبية مخفية لإطلالة راقية.',
    descEn: 'Flowing high-waisted trousers with tailored front pleats, side slash pockets, and front zip fly closure.',
  },
  {
    slug: 'zara-satin-midi-slip-dress',
    ar: 'فستان زارا ساتان ميدي مائل للسهرات',
    en: 'Zara Satin Finish Bias-Cut Midi Slip Dress',
    brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing',
    price: 1100000, material: 'silk-satin',
    colors: ['burgundy','black','pink','beige'], sizes: ['xs','s','m','l'],
    tags: ['evening','luxury','trending'],
    descAr: 'فستان ساتان حريري لامع بقصة مائلة تبرز القوام مع ياقة كاوبوي وحمالات رفيعة قابلة للتعديل وطول ميدي أنيق.',
    descEn: 'Bias-cut midi slip dress in luminous satin finish with cowl neckline and delicate adjustable spaghetti straps.',
  },
  {
    slug: 'zara-faux-leather-trench',
    ar: 'معطف ترنش زارا جلد صناعي مزدوج الأزرار',
    en: 'Zara Double-Breasted Faux Leather Trench Coat',
    brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing',
    price: 2350000, compare: 2800000,
    material: 'full-grain-leather',
    colors: ['cognac','black'], sizes: ['s','m','l'],
    tags: ['winter','trending','luxury'],
    descAr: 'معطف ترنش مزدوج الأزرار بحزام خصر قابل للربط وأكتاف مفصلة وياقة عريضة كلاسيكية بجلد صناعي فاخر.',
    descEn: 'Statement longline double-breasted faux leather trench with belted waist and classic lapel collar.',
  },
  {
    slug: 'zara-oversized-poplin-shirt',
    ar: 'قميص بوبلين أبيض أوفر سايز زارا',
    en: 'Zara 100% Cotton Poplin Oversized Shirt',
    brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing',
    price: 680000, material: 'organic-cotton',
    colors: ['white','pink','navy','black'], sizes: ['xs','s','m','l','xl'],
    tags: ['core','basics'],
    descAr: 'قميص قطني ناصع بقصة فضفاضة وجيب على الصدر وأزرار أمامية كلاسيكية لارتداء مريح وعصري.',
    descEn: 'Crisp 100% organic cotton poplin in relaxed oversized silhouette with dropped shoulders.',
  },
  {
    slug: 'zara-knit-sweater-crew',
    ar: 'سترة صوف زارا كروع مريحة كلاسيك',
    en: 'Zara Soft Ribbed Crew Neck Knit Sweater',
    brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing',
    price: 890000, material: 'virgin-wool',
    colors: ['beige','black','grey','burgundy'], sizes: ['xs','s','m','l'],
    tags: ['winter','core'],
    descAr: 'سترة صوف مضلعة ناعمة بياقة كروع مريحة وأكمام مريحة طولها متوسط للإطلالة الكاجوال الشيك.',
    descEn: 'Soft ribbed knit sweater with crew neck and relaxed fit. Comfortable and versatile wardrobe staple.',
  },
  {
    slug: 'zara-straight-leg-jeans',
    ar: 'جينز زارا مستقيم كلاسيك لازوردي',
    en: 'Zara Classic Straight Leg Denim Jeans',
    brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing',
    price: 850000, material: 'organic-cotton',
    colors: ['blue','black'], sizes: ['xs','s','m','l','xl'],
    tags: ['basics','core'],
    descAr: 'جينز دنيم قطني عالي الجودة بقصة مستقيمة كلاسيكية وخصر متوسط الارتفاع وجيوب خماسية أنيقة.',
    descEn: 'Classic straight leg denim jeans in mid-rise with five-pocket styling. Timeless wardrobe essential.',
  },
  {
    slug: 'zara-leather-crossbody',
    ar: 'حقيبة كروسبودي زارا جلد صغيرة أنيقة',
    en: 'Zara Mini Leather Crossbody Bag',
    brand: 'zara', cat: 'womens-bags', guide: null,
    price: 780000, material: 'full-grain-leather',
    colors: ['black','cognac','beige'], sizes: ['one-size'],
    tags: ['accessories','trending'],
    descAr: 'حقيبة صغيرة مدمجة من الجلد الطبيعي بحزام طويل قابل للتعديل وسحاب علوي آمن وبطانة قماشية داخلية.',
    descEn: 'Mini compact leather crossbody with adjustable long strap and zip closure. Interior card slot.',
  },
  {
    slug: 'zara-quilted-bomber-jacket',
    ar: 'جاكيت بومبر مبطن زارا خفيف الوزن',
    en: 'Zara Lightweight Quilted Bomber Jacket',
    brand: 'zara', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1450000, compare: 1750000,
    material: 'recycled-down',
    colors: ['black','navy','green'], sizes: ['s','m','l','xl'],
    tags: ['winter','trending'],
    descAr: 'جاكيت بومبر مبطن خفيف الوزن بقصة سهلة وأكمام ريبستوب وسحاب أمامي كامل وجيب صدر.',
    descEn: 'Lightweight quilted bomber with easy silhouette, ribbed cuffs, full-zip front, and chest pocket.',
  },
  {
    slug: 'zara-structured-tote-bag',
    ar: 'حقيبة توت زارا جلد هيكلية واسعة',
    en: 'Zara Structured Leather Tote Bag',
    brand: 'zara', cat: 'womens-bags', guide: null,
    price: 1200000, compare: 1450000,
    material: 'full-grain-leather',
    colors: ['black','beige','cognac'], sizes: ['one-size'],
    tags: ['accessories','trending'],
    descAr: 'حقيبة توت جلدية هيكلية بمقابض علوية مزدوجة وسحاب مغناطيسي وجيب داخلي بسحاب وحامل مفاتيح.',
    descEn: 'Structured leather tote with twin carry handles, magnetic closure, and organized interior pockets.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                   G U C C I                             ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'gucci-gg-marmont-shoulder-bag',
    ar: 'حقيبة كتف غوتشي GG مارمونت مبطنة',
    en: 'Gucci GG Marmont Matelasse Shoulder Bag',
    brand: 'gucci', cat: 'luxury-bags', guide: null,
    price: 4900000, compare: 5600000,
    material: 'full-grain-leather',
    colors: ['black','beige','red'], sizes: ['one-size'],
    featured: true, tags: ['luxury','bestseller'],
    descAr: 'حقيبة كتف من الجلد المبطن بنمط شيفرون الهندسي مع شعار Double G المعدني المعتق وحزام سلسلة ذهبية متحرك.',
    descEn: 'Softly structured chevron matelasse leather bag with antique gold Double G hardware and adjustable chain shoulder strap.',
  },
  {
    slug: 'gucci-horsebit-1953-loafer',
    ar: 'حذاء لوفر غوتشي 1953 هورسبيت تراثي',
    en: 'Gucci 1953 Horsebit Classic Leather Loafer',
    brand: 'gucci', cat: 'formal-shoes', guide: 'eu-footwear',
    price: 3850000, compare: 4400000,
    material: 'full-grain-leather',
    colors: ['black','cognac'], sizes: ['39','40','41','42','43','44','45'],
    featured: true, tags: ['luxury','heritage'],
    descAr: 'حذاء لوفر إيطالي كلاسيكي مصنوع يدوياً في فلورنسا من أجود أنواع الجلد مع حلية لجام الخيل الذهبية الأيقونية.',
    descEn: 'Florence-crafted heritage moccasin detailed with the signature 1953 gold-tone equestrian Horsebit bar.',
  },
  {
    slug: 'gucci-double-g-leather-belt',
    ar: 'حزام جلد غوتشي بإبزيم Double G',
    en: 'Gucci Double G Smooth Italian Leather Belt',
    brand: 'gucci', cat: 'eyewear-belts', guide: 'adult-clothing',
    price: 1850000, material: 'full-grain-leather',
    colors: ['black','cognac'], sizes: ['s','m','l','xl'],
    tags: ['luxury','accessories'],
    descAr: 'حزام من الجلد الإيطالي الفاخر عرض 3 سم مع إبزيم GG المعدني المصقول بالذهب العتيق - رمز الفخامة الأيقوني.',
    descEn: 'Classic 3cm smooth Italian calfskin leather belt with antique brass Double G buckle - iconic luxury symbol.',
  },
  {
    slug: 'gucci-flora-gorgeous-gardenia',
    ar: 'عطر غوتشي فلورا غورجيوس غاردينيا',
    en: 'Gucci Flora Gorgeous Gardenia Eau de Parfum',
    brand: 'gucci', cat: 'perfumes', guide: 'fragrance-guide',
    price: 2100000, compare: 2450000,
    material: null,
    colors: ['pink'], sizes: ['50ml','100ml'],
    tags: ['luxury','beauty'],
    descAr: 'عطر زهري فاخر بعبير الغاردينيا البيضاء وزهر الكمثرى وسكر بني دافئ في زجاجة وردية منقوشة بالأزهار.',
    descEn: 'Joyful floral fragrance built around Gardenia flower blended with solar Jasmine and warm pear blossom.',
  },
  {
    slug: 'gucci-square-acetate-sunglasses',
    ar: 'نظارة شمسية غوتشي مربعة أسيتات فاخرة',
    en: 'Gucci Oversized Square Acetate Sunglasses',
    brand: 'gucci', cat: 'eyewear-belts', guide: null,
    price: 1650000, material: 'acetate',
    colors: ['black','cognac'], sizes: ['one-size'],
    tags: ['luxury','accessories'],
    descAr: 'نظارة شمسية فاخرة بإطار مربع عريض من الأسيتات وعدسات حماية UV400 وشعار غوتشي الذهبي على الذراعين.',
    descEn: 'Bold oversized square acetate frame with UV400 tinted lenses and gold logo on the metal temples.',
  },
  {
    slug: 'gucci-gg-canvas-tote',
    ar: 'حقيبة توت غوتشي GG كانفاس كبيرة',
    en: 'Gucci GG Supreme Canvas Large Tote Bag',
    brand: 'gucci', cat: 'luxury-bags', guide: null,
    price: 3200000, compare: 3800000,
    material: 'full-grain-leather',
    colors: ['beige'], sizes: ['one-size'],
    featured: true, tags: ['luxury','heritage'],
    descAr: 'حقيبة توت كبيرة من قماش GG Supreme مع تشطيبات جلدية بني وأيقونة الشعار GG المميزة.',
    descEn: 'Large tote in GG Supreme canvas with leather trimmings and web stripe detail. Iconic print.',
  },
  {
    slug: 'gucci-ace-leather-sneaker',
    ar: 'حذاء سنيكرز غوتشي آيس كلاسيك جلد',
    en: 'Gucci Ace Classic Leather Low-Top Sneaker',
    brand: 'gucci', cat: 'sneakers', guide: 'eu-footwear',
    price: 2850000, compare: 3300000,
    material: 'full-grain-leather',
    colors: ['white'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['luxury','trending'],
    descAr: 'حذاء سنيكرز فاخر من الجلد الناصع الأبيض مع بيتشات GG الخضراء والحمراء أو شريط الويب الكلاسيكي.',
    descEn: 'Clean white leather low-top with signature green/red web stripe or embroidered GG detail. Timeless luxury sneaker.',
  },
  {
    slug: 'gucci-wool-coat',
    ar: 'معطف صوف فاخر من غوتشي إيطالي الصنع',
    en: 'Gucci Double-Faced Cashmere Wool Coat',
    brand: 'gucci', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 6500000, compare: 7800000,
    material: 'virgin-wool',
    colors: ['black','camel'], sizes: ['48','50','52','54'],
    tags: ['luxury','winter'],
    descAr: 'معطف طويل من الكاشمير والصوف مزدوج الوجه مع بطانة حريرية وأزرار شل مخفية وقصة سليم فيت أنيقة.',
    descEn: 'Italian-crafted double-faced cashmere wool coat with silk lining and concealed shell buttons.',
  },
  {
    slug: 'gucci-bamboo-handle-bag',
    ar: 'حقيبة غوتشي بمقبض البامبو الأيقوني',
    en: 'Gucci Bamboo 1947 Small Top Handle Bag',
    brand: 'gucci', cat: 'luxury-bags', guide: null,
    price: 4200000, compare: 4900000,
    material: 'full-grain-leather',
    colors: ['beige','black'], sizes: ['one-size'],
    tags: ['luxury','heritage'],
    descAr: 'الحقيبة الأيقونية المولودة عام 1947 بمقبض البامبو المميز اليدوي الصنع والجلد الناعم مع قفل C.',
    descEn: 'Iconic 1947 design with handcrafted bamboo top handle. Supple leather body with C-shaped closure.',
  },
  {
    slug: 'gucci-guilty-pour-homme',
    ar: 'عطر غوتشي غيلتي بور أوم للرجال',
    en: 'Gucci Guilty Pour Homme Eau de Toilette',
    brand: 'gucci', cat: 'perfumes', guide: 'fragrance-guide',
    price: 1850000, compare: 2200000,
    material: null,
    colors: ['black'], sizes: ['50ml','100ml','150ml'],
    tags: ['luxury','beauty'],
    descAr: 'عطر رجالي حسي جريء بقلب من ثمرة الجريب فروت والخزامى والإيلانغ إيلانغ مع خلفية خشبية من الباتشولي.',
    descEn: 'Bold and sensual masculine fragrance with grapefruit, lavender, and ylang-ylang on a woody patchouli base.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                  C H A N E L                            ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'chanel-bleu-de-chanel-parfum',
    ar: 'عطر بلو دي شانيل بارفان خشبي رجالي',
    en: 'Chanel Bleu de Chanel Pure Parfum',
    brand: 'chanel', cat: 'perfumes', guide: 'fragrance-guide',
    price: 2750000, compare: 3200000,
    material: null,
    colors: ['navy'], sizes: ['50ml','100ml','150ml'],
    featured: true, tags: ['luxury','bestseller'],
    descAr: 'أرقى وأعمق تركيز في عائلة بلو دي شانيل بعبير خشب الصندل الكاليدوني الدافئ والأرز الغابي ونفحات اللابدانوم.',
    descEn: 'Intensely aromatic with fresh citrus opening and warm New Caledonian sandalwood heart lasting all day.',
  },
  {
    slug: 'chanel-coco-mademoiselle',
    ar: 'عطر شانيل كوكو مادموزيل أو دو بارفان',
    en: 'Chanel Coco Mademoiselle Eau de Parfum',
    brand: 'chanel', cat: 'perfumes', guide: 'fragrance-guide',
    price: 2650000, compare: 3100000,
    material: null,
    colors: ['pink'], sizes: ['50ml','100ml'],
    featured: true, tags: ['luxury','bestseller'],
    descAr: 'العطر النسائي الأيقوني بنفحات البرتقال الحيوي والورد الغراسي والياسمين والباتشولي الإندونيسي النقي.',
    descEn: 'Bold sensual amber fragrance featuring vibrant orange, Grasse rose, May jasmine, and Indonesian patchouli.',
  },
  {
    slug: 'chanel-classic-11-12-flap-bag',
    ar: 'حقيبة شانيل كلاسيك 11.12 جلد كافيار',
    en: 'Chanel Classic 11.12 Quilted Caviar Flap Bag',
    brand: 'chanel', cat: 'luxury-bags', guide: null,
    price: 4950000, compare: 5800000,
    material: 'full-grain-leather',
    colors: ['black','beige','burgundy'], sizes: ['one-size'],
    featured: true, tags: ['luxury','heritage'],
    descAr: 'الحقيبة الأكثر شهرة في تاريخ الموضة من جلد الكافيار المحبب المقاوم للخدش مع قفل CC الدوار وسلسلة الذهب الكلاسيكية.',
    descEn: "Definitive Paris luxury handbag in grained Caviar calfskin leather with double-C turnlock clasp and chain strap.",
  },
  {
    slug: 'chanel-boy-chanel-long-wallet',
    ar: 'محفظة بوي شانيل جلد مبطن بسحاب',
    en: 'Chanel Boy Chanel Zipped Long Wallet',
    brand: 'chanel', cat: 'luxury-bags', guide: null,
    price: 2450000, material: 'full-grain-leather',
    colors: ['black','navy'], sizes: ['one-size'],
    tags: ['luxury'],
    descAr: 'محفظة طويلة فاخرة بجلد العجل المبطن وإطار بوي المميز وسحاب رونيوم محكم وحجرات داخلية متعددة.',
    descEn: 'Refined zip-around continental wallet with Boy Chanel graphic quilting and ruthenium metal finish.',
  },
  {
    slug: 'chanel-rouge-allure-lextrait',
    ar: "أحمر شفاه شانيل روج أللور ليكستري",
    en: "Chanel Rouge Allure L'Extrait High-Intensity Lipstick",
    brand: 'chanel', cat: 'perfumes-beauty', guide: null,
    price: 720000, material: null,
    colors: ['red','burgundy','pink'], sizes: ['one-size'],
    tags: ['beauty','luxury'],
    descAr: 'أحمر شفاه فائق التركيز يجمع بين الإشراق المكثف والترطيب العميق بخلاصة زهرة البرقوق وزيت السكوالين.',
    descEn: 'High-intensity radiant hydrating refillable lipstick enriched with concentrated plum blossom enfleurage.',
  },
  {
    slug: 'chanel-no5-parfum',
    ar: 'عطر شانيل رقم 5 الأسطوري الخالد',
    en: "Chanel N°5 Eau de Parfum Timeless Icon",
    brand: 'chanel', cat: 'perfumes', guide: 'fragrance-guide',
    price: 2950000, compare: 3500000,
    material: null,
    colors: ['gold'], sizes: ['50ml','100ml'],
    featured: true, tags: ['luxury','heritage','bestseller'],
    descAr: 'العطر الأكثر شهرة في تاريخ البشرية منذ عام 1921 بالألدهيدات الفاتحة والورد الجوري والياسمين والإيلانغ الفاخرة.',
    descEn: "Created in 1921, N°5 remains the world's most iconic fragrance. Powdery floral aldehyde composition.",
  },
  {
    slug: 'chanel-22-handbag',
    ar: 'حقيبة شانيل 22 كبيرة مبطنة مرنة',
    en: 'Chanel 22 Shiny Calfskin Large Hobo Bag',
    brand: 'chanel', cat: 'luxury-bags', guide: null,
    price: 4100000, compare: 4800000,
    material: 'full-grain-leather',
    colors: ['black','beige'], sizes: ['one-size'],
    tags: ['luxury','new'],
    descAr: 'الحقيبة المرنة الجديدة من شانيل 2022 بجلد عجل لامع مبطن بنمط موحد وسلسلة من الذهب اللامع والمسبوك.',
    descEn: 'New 2022 design in shiny calfskin with all-over quilted CC pattern. Gold-tone chain and CC charm.',
  },
  {
    slug: 'chanel-coco-crush-ring',
    ar: 'خاتم شانيل كوكو كراش ذهبي بيج غولد',
    en: 'Chanel Coco Crush Ring Beige Gold',
    brand: 'chanel', cat: 'watches-accessories', guide: null,
    price: 1850000, material: 'stainless-steel',
    colors: ['gold'], sizes: ['one-size'],
    tags: ['luxury','jewelry'],
    descAr: 'خاتم مميز بنقش مبطن مستوحى من حقيبة بوي شانيل من الذهب الأصفر Beige Gold المتداخل مع الشعار.',
    descEn: 'Quilted motif ring inspired by the Boy bag hardware in Beige Gold with CC iconic pattern.',
  },
  {
    slug: 'chanel-boy-bag-medium',
    ar: 'حقيبة بوي شانيل متوسطة بشريط مبطن',
    en: 'Chanel Boy Bag Medium Chevron Leather',
    brand: 'chanel', cat: 'luxury-bags', guide: null,
    price: 5200000, compare: 6100000,
    material: 'full-grain-leather',
    colors: ['black','navy'], sizes: ['one-size'],
    featured: true, tags: ['luxury','heritage'],
    descAr: 'حقيبة بوي المتوسطة بشريط شيفرون الأيقوني من الجلد المبطن وإبزيم مستطيل معدني مصقول وسلسلة جلدية.',
    descEn: 'Medium chevron quilted leather flap bag with rectangular metal clasp and chain leather interlaced strap.',
  },
  {
    slug: 'chanel-espadrilles',
    ar: 'أحذية إسبادريل شانيل قماش CC صيفي',
    en: 'Chanel CC Logo Canvas Espadrille Flats',
    brand: 'chanel', cat: 'womens-shoes', guide: 'eu-footwear',
    price: 1650000, material: 'organic-cotton',
    colors: ['black','beige','white'], sizes: ['36','37','38','39','40','41'],
    tags: ['luxury','summer'],
    descAr: 'أحذية إسبادريل من قماش أو جلد بشعار CC المنقوش أو المطرز ونعل إسباني من الجوت المضفر.',
    descEn: 'Canvas or leather upper with CC logo on toe and braided jute platform sole. Chic summer essential.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║                 HUGO BOSS                               ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'boss-slim-fit-stretch-suit',
    ar: 'بدلة هوغو بوس سليم فيت صوف إيطالي',
    en: 'BOSS Slim-Fit Virgin Wool Stretch Suit',
    brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 4400000, compare: 5200000,
    material: 'virgin-wool',
    colors: ['navy','black','grey'], sizes: ['48','50','52','54','56'],
    featured: true, tags: ['formal','luxury'],
    descAr: 'طقم بدلة كامل (جاكيت وبنطال) من صوف سيروتي الإيطالي فائق النعومة مع لمسة مرونة لحرية الحركة التامة.',
    descEn: 'Two-piece slim-fitting suit in pure virgin wool with natural stretch from the famed Italian Cerruti mill.',
  },
  {
    slug: 'boss-pallas-pique-polo',
    ar: 'قميص بولو هوغو بوس بالاس قطني',
    en: 'BOSS Pallas Regular-Fit Pique Polo Shirt',
    brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 920000, material: 'organic-cotton',
    colors: ['black','white','navy','green'], sizes: ['s','m','l','xl','xxl'],
    tags: ['core','premium'],
    descAr: 'بولو صيفي مريح من قطن بيكيه ناعم مسامي مع تطريز شعار BOSS المتباين الصغير على الصدر.',
    descEn: 'Versatile cotton pique polo with curved tonal BOSS logo embroidery. Regular fit for everyday elegance.',
  },
  {
    slug: 'boss-bottled-eau-de-parfum',
    ar: 'عطر هوغو بوس بوتلد أو دو بارفان رجالي',
    en: 'BOSS Bottled Eau de Parfum for Men',
    brand: 'hugo-boss', cat: 'perfumes', guide: 'fragrance-guide',
    price: 1450000, compare: 1750000,
    material: null,
    colors: ['black'], sizes: ['50ml','100ml'],
    tags: ['bestseller','premium'],
    descAr: 'عطر رجولي ساحر بمزيج التفاح المقرمش والهيل الدافئ والجلد ونجيل الهند الداكن للرجل العصري الناجح.',
    descEn: 'Noble apple, cinnamon, and intense vetiver. Sophisticated woody-spicy composition for the modern man.',
  },
  {
    slug: 'boss-skeleton-automatic-watch',
    ar: 'ساعة بوس أوتوماتيكية هيكلية فاخرة',
    en: 'BOSS Grand Prix Automatic Skeleton Watch',
    brand: 'hugo-boss', cat: 'watches', guide: null,
    price: 2950000, compare: 3400000,
    material: 'stainless-steel',
    colors: ['silver','black'], sizes: ['one-size'],
    featured: true, tags: ['luxury','watches'],
    descAr: 'ساعة ميكانيكية أوتوماتيكية بهيكل من الستانلس ستيل الفولاذي ومينا هيكلي شفاف يكشف حركة التروس الدقيقة.',
    descEn: 'Automatic timepiece featuring open-worked skeleton dial and solid stainless steel bracelet with Swiss movement.',
  },
  {
    slug: 'boss-casual-slim-chino',
    ar: 'بنطال تشينو هوغو بوس سليم كاجوال',
    en: 'BOSS Schino Slim-Fit Stretch Chino Trousers',
    brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1100000, material: 'organic-cotton',
    colors: ['beige','navy','grey','black'], sizes: ['48','50','52','54'],
    tags: ['formal','core'],
    descAr: 'بنطال تشينو سليم فيت من قطن مرن عالي الجودة مع جيوب جانبية مائلة وجيبان خلفيان مع أزرار.',
    descEn: 'Slim-fit stretch cotton chino with slight elasticity for freedom of movement. Italian-inspired construction.',
  },
  {
    slug: 'boss-oxford-slim-shirt',
    ar: 'قميص أكسفورد هوغو بوس سليم أبيض',
    en: 'BOSS Slim-Fit Oxford Cotton Shirt',
    brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1150000, material: 'organic-cotton',
    colors: ['white','light-blue','black'], sizes: ['s','m','l','xl','xxl'],
    tags: ['formal','core'],
    descAr: 'قميص أكسفورد من القطن الناعم بقصة سليم أنيقة مع أزرار بدلة ويافطة BOSS الصغيرة على الأكمام.',
    descEn: 'Slim-fit Oxford cotton shirt with signature BOSS label. Classic formal wardrobe essential.',
  },
  {
    slug: 'boss-leather-chelsea-boot',
    ar: 'حذاء تشيلسي بوت هوغو بوس جلد فاخر',
    en: 'BOSS Leather Chelsea Boot with Elastic Insert',
    brand: 'hugo-boss', cat: 'formal-shoes', guide: 'eu-footwear',
    price: 1980000, compare: 2350000,
    material: 'full-grain-leather',
    colors: ['black','cognac'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['formal','luxury'],
    descAr: 'حذاء تشيلسي بوت من الجلد الطبيعي الفاخر مع شريط مرن جانبي وظيفي ونعل جلدي مع وسادة مريحة.',
    descEn: 'Italian-crafted Chelsea boot in full-grain leather with elastic side insert and cushioned leather insole.',
  },
  {
    slug: 'boss-wool-overcoat',
    ar: 'معطف بوس صوفي طويل أنيق للشتاء',
    en: 'BOSS Slim-Fit Wool Blend Overcoat',
    brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 3800000, compare: 4500000,
    material: 'virgin-wool',
    colors: ['charcoal','navy','camel'], sizes: ['48','50','52','54'],
    tags: ['formal','luxury','winter'],
    descAr: 'معطف شتوي طويل سليم فيت من مزيج الصوف والكاشمير مع ياقة متعددة الطبقات وأزرار مخفية.',
    descEn: 'Slim-fit long overcoat in premium wool-cashmere blend with notch lapels and concealed button front.',
  },
  {
    slug: 'boss-mens-ives-loafer',
    ar: 'حذاء لوفر بوس إيفيس جلد إيطالي',
    en: "BOSS Ives Italian Leather Penny Loafer",
    brand: 'hugo-boss', cat: 'formal-shoes', guide: 'eu-footwear',
    price: 1650000, compare: 1950000,
    material: 'full-grain-leather',
    colors: ['black','cognac'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['formal','core'],
    descAr: 'حذاء لوفر من الجلد الإيطالي الناعم بمقدمة بيني وأسلوب كلاسيكي يجمع بين الراحة والأناقة.',
    descEn: 'Italian-crafted penny loafer in smooth leather with classic stitching and leather sole.',
  },
  {
    slug: 'boss-hugo-red-edp',
    ar: 'عطر هوغو ريد أو دو بارفان جريء',
    en: 'HUGO Red Eau de Parfum Bold Fragrance',
    brand: 'hugo-boss', cat: 'perfumes', guide: 'fragrance-guide',
    price: 1280000, compare: 1550000,
    material: null,
    colors: ['red'], sizes: ['50ml','100ml','150ml'],
    tags: ['trending','new'],
    descAr: 'عطر رجالي جريء بعبير التوت الأحمر والفلفل الوردي والخشب الكهرماني لرجل يختلف عن الجميع.',
    descEn: 'Bold and individual fragrance with red berry top, pink pepper, and warm amber wood base.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║              CALVIN KLEIN                               ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'calvin-klein-modern-cotton-sweatshirt',
    ar: 'سويت شيرت كالفن كلاين مودرن قطني',
    en: 'Calvin Klein Modern Cotton Crewneck Sweatshirt',
    brand: 'calvin-klein', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 920000, material: 'organic-cotton',
    colors: ['grey','black','white'], sizes: ['xs','s','m','l','xl'],
    tags: ['core','basics'],
    descAr: 'سويت شيرت من القطن الفرنسي الناعم بقصة مريحة مع شعار CK البسيط والأنيق على الصدر.',
    descEn: 'Soft French terry cotton crewneck with classic minimalist CK monogram chest print.',
  },
  {
    slug: 'calvin-klein-90s-straight-denim',
    ar: 'جينز كالفن كلاين 90s مستقيم كلاسيك',
    en: 'Calvin Klein 90s Straight Vintage Denim',
    brand: 'calvin-klein', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1150000, compare: 1350000,
    material: 'organic-cotton',
    colors: ['blue','black'], sizes: ['s','m','l','xl'],
    featured: true, tags: ['sale','denim'],
    descAr: 'جينز قطني ثقيل مستوحى من تسعينات CK بقصة مستقيمة وخمسة جيوب كلاسيكية وغرزة أوميغا الخلفية.',
    descEn: "Vintage-inspired 90s straight leg jeans in rigid cotton denim with signature back pocket omega stitch.",
  },
  {
    slug: 'calvin-klein-minimalist-crossbody',
    ar: 'حقيبة كروسبودي CK مدمجة أنيقة',
    en: 'Calvin Klein Minimalist Monogram Crossbody Bag',
    brand: 'calvin-klein', cat: 'womens-bags', guide: null,
    price: 980000, material: 'full-grain-leather',
    colors: ['black','beige'], sizes: ['one-size'],
    tags: ['accessories','core'],
    descAr: 'حقيبة كروس خفيفة بحزام قابل للتعديل وسحاب علوي آمن وشعار CK المعدني الأنيق.',
    descEn: 'Compact eco-leather crossbody with top zip closure and polished CK monogram hardware.',
  },
  {
    slug: 'calvin-klein-ck-one-unisex',
    ar: 'عطر كالفن كلاين CK ONE للجنسين',
    en: 'Calvin Klein CK One Unisex Eau de Toilette',
    brand: 'calvin-klein', cat: 'perfumes', guide: 'fragrance-guide',
    price: 1180000, compare: 1400000,
    material: null,
    colors: ['silver'], sizes: ['50ml','100ml','200ml'],
    featured: true, tags: ['bestseller','heritage'],
    descAr: 'العطر الأحادي الجنس الأيقوني من 1994 بنفحات البرغموت والليمون والمسك البيضاء للحرية المطلقة.',
    descEn: 'Iconic 1994 unisex fragrance with bergamot, green tea, and clean musk. A cultural landmark fragrance.',
  },
  {
    slug: 'calvin-klein-eternity-edp',
    ar: 'عطر كالفن كلاين إيترنيتي أو دو بارفان',
    en: 'Calvin Klein Eternity Eau de Parfum for Women',
    brand: 'calvin-klein', cat: 'perfumes', guide: 'fragrance-guide',
    price: 1350000, compare: 1600000,
    material: null,
    colors: ['gold'], sizes: ['50ml','100ml'],
    tags: ['luxury','heritage'],
    descAr: 'عطر نسائي رومانسي خالد منذ 1988 بنفحات الزنبق والورد الأخضر والخشب الدافئ.',
    descEn: 'A romantic and timeless women\'s fragrance since 1988. Green lily, rose, and warm sandalwood base.',
  },
  {
    slug: 'calvin-klein-slim-blazer',
    ar: 'بليزر كالفن كلاين سليم فيت قطني أنيق',
    en: 'Calvin Klein Slim-Fit Cotton Stretch Blazer',
    brand: 'calvin-klein', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1580000, compare: 1900000,
    material: 'organic-cotton',
    colors: ['navy','black','grey'], sizes: ['48','50','52','54'],
    tags: ['formal','core'],
    descAr: 'بليزر سليم فيت مرن من قطن عالي الجودة بياقة مدببة وجيوب بقلاب وأزرار صدف أنيقة.',
    descEn: 'Slim-fit stretch cotton blazer with notched lapels and flap pockets. Versatile formal-casual piece.',
  },
  {
    slug: 'calvin-klein-underwear-3pack',
    ar: 'طقم داخلية كالفن كلاين 3 قطع بوكسرات',
    en: 'Calvin Klein Modern Cotton 3-Pack Boxer Brief',
    brand: 'calvin-klein', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 680000, material: 'organic-cotton',
    colors: ['black','white','grey'], sizes: ['s','m','l','xl'],
    tags: ['basics','bestseller'],
    descAr: 'طقم 3 بوكسرات من القطن المودرن الناعم بحزام خصر CK الأيقوني العريض وقصة محكمة مريحة.',
    descEn: 'Three boxer briefs in soft modern cotton with iconic CK waistband. Essential comfort underwear.',
  },
  {
    slug: 'calvin-klein-leather-belt',
    ar: 'حزام كالفن كلاين جلد بسيط أنيق',
    en: 'Calvin Klein Classic Leather Dress Belt',
    brand: 'calvin-klein', cat: 'eyewear-belts', guide: 'adult-clothing',
    price: 520000, material: 'full-grain-leather',
    colors: ['black','brown'], sizes: ['s','m','l','xl'],
    tags: ['accessories','basics'],
    descAr: 'حزام جلد طبيعي بسيط وأنيق بإبزيم مستطيل مصقول بالنيكل وحلقة مزينة بشعار CK المطلي.',
    descEn: 'Sleek full-grain leather belt with smooth nickel-tone rectangular buckle and CK engraved keeper.',
  },
  {
    slug: 'calvin-klein-platform-chelsea',
    ar: 'حذاء تشيلسي بوت كالفن كلاين برقبة عالية',
    en: 'Calvin Klein Platform Chelsea Ankle Boot',
    brand: 'calvin-klein', cat: 'womens-shoes', guide: 'eu-footwear',
    price: 1380000, compare: 1650000,
    material: 'full-grain-leather',
    colors: ['black'], sizes: ['36','37','38','39','40','41'],
    featured: true, tags: ['trending','luxury'],
    descAr: 'حذاء تشيلسي نسائي بكعب منصة سميك من الجلد الفاخر مع مرن جانبي وظيفي ونعل سميك مميز.',
    descEn: 'Platform Chelsea ankle boot in premium leather with elastic side gussets and chunky block platform.',
  },
  {
    slug: 'calvin-klein-euphoria-edp',
    ar: 'عطر كالفن كلاين يوفوريا النسائي الفاخر',
    en: 'Calvin Klein Euphoria Women Eau de Parfum',
    brand: 'calvin-klein', cat: 'perfumes', guide: 'fragrance-guide',
    price: 1480000, compare: 1750000,
    material: null,
    colors: ['purple'], sizes: ['50ml','100ml'],
    tags: ['luxury','beauty'],
    descAr: 'عطر نسائي مثير وغامض بنفحات الخوخ الأسود وعصير التفاح الأخضر والإيلانغ والمسك الدافئ.',
    descEn: 'Mysterious and sensual with black orchid, pomegranate infusion, and seductive creamy amber musk.',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║            TOMMY HILFIGER                               ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    slug: 'tommy-hilfiger-puffer-jacket',
    ar: 'جاكيت بومبر مبطن تومي هيلفيغر شتوي',
    en: 'Tommy Hilfiger Down Padded Puffer Bomber Jacket',
    brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 2450000, compare: 2900000,
    material: 'recycled-down',
    colors: ['navy','black','red'], sizes: ['s','m','l','xl','xxl'],
    featured: true, tags: ['winter','bestseller'],
    descAr: 'جاكيت بومبر شتوي مبطن بريش معاد تدويره ومقاوم للماء والرياح مع ألوان علم تومي وتطريز الشعار.',
    descEn: 'Water-resistant puffer bomber with recycled down fill and signature Tommy flag embroidery at chest.',
  },
  {
    slug: 'tommy-hilfiger-1985-oxford-shirt',
    ar: 'قميص أكسفورد 1985 تومي هيلفيغر',
    en: 'Tommy Hilfiger 1985 Oxford Stretch Shirt',
    brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1180000, material: 'organic-cotton',
    colors: ['white','blue','pink'], sizes: ['s','m','l','xl','xxl'],
    tags: ['core','heritage'],
    descAr: 'قميص أكسفورد من القطن المرن بياقة بأزرار كلاسيكية وتطريز علم تومي الأيقوني على الجيب.',
    descEn: 'Classic fit stretch Oxford shirt from the 1985 archive collection with embroidered flag at pocket.',
  },
  {
    slug: 'tommy-hilfiger-leather-low-sneaker',
    ar: 'سنيكرز تومي هيلفيغر كلاسيك جلد منخفض',
    en: 'Tommy Hilfiger Core Leather Low-Top Sneaker',
    brand: 'tommy-hilfiger', cat: 'sneakers', guide: 'eu-footwear',
    price: 1380000, compare: 1600000,
    material: 'full-grain-leather',
    colors: ['white','black'], sizes: ['39','40','41','42','43','44','45'],
    tags: ['sale','bestseller'],
    descAr: 'سنيكرز جلد أبيض بشريط ألوان تومي الكلاسيكي (أحمر أبيض كحلي) ونعل مطاطي مريح ودائم.',
    descEn: 'Clean leather low-top sneaker featuring classic corporate stripe detailing along the side.',
  },
  {
    slug: 'tommy-hilfiger-classic-leather-belt',
    ar: 'حزام تومي هيلفيغر جلد طبيعي كلاسيك',
    en: 'Tommy Hilfiger Denton Classic Leather Belt',
    brand: 'tommy-hilfiger', cat: 'eyewear-belts', guide: 'adult-clothing',
    price: 620000, material: 'full-grain-leather',
    colors: ['brown','black'], sizes: ['s','m','l','xl'],
    tags: ['accessories','core'],
    descAr: 'حزام من الجلد الطبيعي بإبزيم مستطيل مصقول وحلقة مزينة بعلم تومي الأيقوني المطلي بالمينا.',
    descEn: 'Supple full-grain leather belt with brushed metal buckle and signature enameled flag keeper.',
  },
  {
    slug: 'tommy-hilfiger-cable-knit-sweater',
    ar: 'سترة صوف كيبل نيت تومي هيلفيغر',
    en: 'Tommy Hilfiger Cable Knit Crewneck Sweater',
    brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1450000, compare: 1700000,
    material: 'virgin-wool',
    colors: ['white','navy','grey'], sizes: ['s','m','l','xl','xxl'],
    tags: ['winter','core'],
    descAr: 'سترة صوف مضلعة بنمط كيبل كلاسيك من الصوف النقي مع شعار تومي المطرز وأطراف مضلعة.',
    descEn: 'Classic cable knit crewneck in pure wool with signature Tommy flag embroidery at chest. Timeless heritage.',
  },
  {
    slug: 'tommy-hilfiger-chino-classic',
    ar: 'بنطال تشينو تومي هيلفيغر كلاسيك',
    en: 'Tommy Hilfiger Classic Straight Chino Trousers',
    brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 980000, material: 'organic-cotton',
    colors: ['beige','navy','grey','black'], sizes: ['s','m','l','xl'],
    tags: ['formal','core'],
    descAr: 'بنطال تشينو كلاسيك مستقيم من القطن الممشط الناعم مع حزام داخلي وجيوب أمامية مائلة وخلفية.',
    descEn: 'Straight-fit cotton chino with inside belt loops and structured silhouette. Versatile wardrobe staple.',
  },
  {
    slug: 'tommy-hilfiger-bold-logo-hoodie',
    ar: 'هودي تومي هيلفيغر شعار كبير واضح',
    en: 'Tommy Hilfiger Bold Logo Fleece Hoodie',
    brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1280000, material: 'organic-cotton',
    colors: ['navy','white','red'], sizes: ['s','m','l','xl','xxl'],
    tags: ['trending','core'],
    descAr: 'هودي فليس من القطن المتين بشعار Tommy Hilfiger الكبير الجريء مع سحاب كامل وجيبين جانبيين.',
    descEn: 'Bold large Tommy Hilfiger logo across the chest on a full-zip cotton fleece hoodie.',
  },
  {
    slug: 'tommy-hilfiger-flag-polo',
    ar: 'قميص بولو تومي هيلفيغر علم أيقوني',
    en: 'Tommy Hilfiger Iconic Flag Polo Shirt',
    brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1050000, material: 'organic-cotton',
    colors: ['white','navy','red'], sizes: ['s','m','l','xl','xxl'],
    featured: true, tags: ['bestseller','core'],
    descAr: 'بولو أيقوني من أديكولور بيكيه القطني الناعم مع علم تومي المطرز الأيقوني وياقة مضلعة متباينة.',
    descEn: 'Iconic pique polo with embroidered flag at chest. The signature Tommy Hilfiger polo for all occasions.',
  },
  {
    slug: 'tommy-hilfiger-denim-jacket',
    ar: 'جاكيت دنيم تومي هيلفيغر شبابي كلاسيك',
    en: 'Tommy Hilfiger Classic Denim Trucker Jacket',
    brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing',
    price: 1650000, compare: 1950000,
    material: 'organic-cotton',
    colors: ['blue','black'], sizes: ['s','m','l','xl'],
    tags: ['trending','heritage'],
    descAr: 'جاكيت دنيم تراكر كلاسيك من القطن المحكم مع جيب صدر مزدوج وشعار تومي المنقوش على الأزرار.',
    descEn: 'Classic denim trucker jacket with double chest pockets and signature Tommy Hilfiger button branding.',
  },
  {
    slug: 'tommy-hilfiger-tommy-edp',
    ar: 'عطر تومي هيلفيغر أو دو بارفان للرجال',
    en: 'Tommy Hilfiger Tommy Eau de Toilette Classic',
    brand: 'tommy-hilfiger', cat: 'perfumes', guide: 'fragrance-guide',
    price: 1150000, compare: 1380000,
    material: null,
    colors: ['navy'], sizes: ['50ml','100ml'],
    tags: ['bestseller','heritage'],
    descAr: 'العطر الكلاسيكي الأصلي من تومي هيلفيغر منذ 1994 بعبير النعناع والخزامى والصندل.',
    descEn: 'The original 1994 Tommy Hilfiger classic fragrance with spearmint, lavender, and sandalwood.',
  },
];

// ─── PUBLISH FUNCTION ─────────────────────────────────────────────────────────
async function uploadFile(localPath, remotePath) {
  try {
    await access(localPath);
  } catch {
    return false;
  }
  const buffer = await readFile(localPath);
  const { error } = await bucket.upload(remotePath, buffer, {
    contentType: 'image/webp',
    upsert: true,
  });
  if (error) {
    console.error(`  Upload error for ${remotePath}: ${error.message}`);
    return false;
  }
  return true;
}

async function publish() {
  console.log('🚀 EuroStore Mega Catalog Publisher v3');
  console.log('='.repeat(60));
  console.log(`Products: ${PRODUCTS.length} | Brands: ${BRANDS.length}`);

  // ── 1. Upload product images ──────────────────────────────────────────────
  console.log('\n📦 1. Uploading product images to Supabase Storage...');
  let uploadOk = 0, uploadFail = 0;
  for (const p of PRODUCTS) {
    const local = `${LOCAL_BASE}/products/${p.slug}.webp`;
    const remote = `${CATALOG_V3_BASE}/products/${p.slug}.webp`;
    const ok = await uploadFile(local, remote);
    if (ok) { uploadOk++; process.stdout.write('.'); }
    else { uploadFail++; process.stdout.write('x'); }
  }
  console.log(`\n  ✅ Uploaded: ${uploadOk} | ❌ Failed: ${uploadFail}`);

  // ── 2. Upload brand logos from v2 (reuse existing) ────────────────────────
  console.log('\n🏷️ 2. Brand logos (using existing v2 logos)...');
  // Brand logos from v2 catalog are already in Supabase — we'll reference them

  // ── 3. Upsert brands ──────────────────────────────────────────────────────
  console.log('\n🏪 3. Upserting brands...');
  const brandRows = BRANDS.map(b => ({
    id: stableId('brand', b.slug),
    slug: b.slug,
    name: b.name,
    logo_url: `${url}/storage/v1/object/public/product-images/owned/catalog-v2/brands/${b.slug}.webp`,
    is_active: true,
  }));
  const { error: bErr } = await supabase.from('brands').upsert(brandRows, { onConflict: 'slug' });
  if (bErr) console.error('Brand upsert error:', bErr.message);
  else console.log(`  ✅ Upserted ${brandRows.length} brands`);

  // ── 3b. Seed Attribute Types & Values ──────────────────────────────────────
  console.log('\n🎨 3b. Upserting attribute types and values...');
  const ATTRIBUTE_TYPES = [
    { slug: 'size', ar: 'المقاس', en: 'Size' },
    { slug: 'color', ar: 'اللون', en: 'Color' },
    { slug: 'material', ar: 'الخامة', en: 'Material' },
  ];
  await supabase.from('attribute_types').upsert(ATTRIBUTE_TYPES.map(t => ({
    id: stableId('attribute-type', t.slug),
    slug: t.slug,
    name_ar: t.ar,
    name_en: t.en,
  })), { onConflict: 'slug' });

  const ATTRIBUTE_VALUES = [
    ['size', 'xs', 'XS', 'XS', null],
    ['size', 's', 'S', 'S', null],
    ['size', 'm', 'M', 'M', null],
    ['size', 'l', 'L', 'L', null],
    ['size', 'xl', 'XL', 'XL', null],
    ['size', 'xxl', 'XXL', 'XXL', null],
    ['size', '36', '36 EU', '36 EU', null],
    ['size', '37', '37 EU', '37 EU', null],
    ['size', '38', '38 EU', '38 EU', null],
    ['size', '39', '39 EU', '39 EU', null],
    ['size', '40', '40 EU', '40 EU', null],
    ['size', '41', '41 EU', '41 EU', null],
    ['size', '42', '42 EU', '42 EU', null],
    ['size', '43', '43 EU', '43 EU', null],
    ['size', '44', '44 EU', '44 EU', null],
    ['size', '45', '45 EU', '45 EU', null],
    ['size', '46', '46 EU', '46 EU', null],
    ['size', '48', '48 EU', '48 EU', null],
    ['size', '50', '50 EU', '50 EU', null],
    ['size', '52', '52 EU', '52 EU', null],
    ['size', '54', '54 EU', '54 EU', null],
    ['size', '56', '56 EU', '56 EU', null],
    ['size', '50ml', '50 مل', '50 ml', null],
    ['size', '100ml', '100 مل', '100 ml', null],
    ['size', '150ml', '150 مل', '150 ml', null],
    ['size', '200ml', '200 مل', '200 ml', null],
    ['size', 'one-size', 'مقاس موحد', 'One Size', null],
    ['color', 'black', 'أسود ملكي', 'Midnight Black', '#0E0E12'],
    ['color', 'white', 'أبيض ناصع', 'Pure White', '#FFFFFF'],
    ['color', 'navy', 'كحلي داكن', 'Navy Blue', '#0F1E36'],
    ['color', 'grey', 'رمادي كلاسيك', 'Heather Grey', '#8E8E93'],
    ['color', 'red', 'أحمر قرمزي', 'Crimson Red', '#C8102E'],
    ['color', 'green', 'أخضر غابي', 'Forest Green', '#1B4D3E'],
    ['color', 'beige', 'بيج عاجي', 'Ivory Beige', '#EAE6DF'],
    ['color', 'cognac', 'بني كونياك', 'Cognac Brown', '#8B5A2B'],
    ['color', 'brown', 'بني كلاسيك', 'Classic Brown', '#5C4033'],
    ['color', 'gold', 'ذهبي براق', 'Champagne Gold', '#D7BE79'],
    ['color', 'silver', 'فضي ستيل', 'Steel Silver', '#B0B0B8'],
    ['color', 'pink', 'وردي ناعم', 'Soft Rose', '#E8C5C8'],
    ['color', 'burgundy', 'خمري ملكي', 'Burgundy Wine', '#5C1D24'],
    ['color', 'blue', 'أزرق كلاسيك', 'Classic Blue', '#1E40AF'],
    ['color', 'light-blue', 'أزرق سماوي', 'Sky Blue', '#87CEEB'],
    ['color', 'camel', 'بيج جملي', 'Camel Brown', '#C19A6B'],
    ['color', 'charcoal', 'فحمي داكن', 'Charcoal Grey', '#36454F'],
    ['color', 'purple', 'أرجواني ملكي', 'Royal Purple', '#7851A9'],
    ['material', 'full-grain-leather', 'جلد طبيعي فاخر', 'Full Grain Leather', null],
    ['material', 'suede', 'جلد شمواه إيطالي', 'Italian Suede', null],
    ['material', 'organic-cotton', 'قطن عضوي 100%', '100% Organic Cotton', null],
    ['material', 'virgin-wool', 'صوف بكر فاخر', 'Virgin Wool', null],
    ['material', 'tech-fleece', 'تيك فليس تقني عازل', 'Engineered Tech Fleece', null],
    ['material', 'silk-satin', 'حرير وساتان ناعم', 'Silk Satin', null],
    ['material', 'stainless-steel', 'ستانلس ستيل 316L', '316L Stainless Steel', null],
    ['material', 'acetate', 'أسيتات إيطالي مصقول', 'Handmade Acetate', null],
    ['material', 'memory-foam', 'رغوة الذاكرة المرنة', 'Air-Cooled Memory Foam', null],
    ['material', 'recycled-down', 'ريش عازل معاد تدويره', 'Recycled Down', null],
  ];

  await supabase.from('attribute_values').upsert(ATTRIBUTE_VALUES.map(([type, key, valAr, valEn, hex], idx) => ({
    id: stableId('attribute-value', `${type}:${key}`),
    attribute_type_id: stableId('attribute-type', type),
    value_ar: valAr,
    value_en: valEn,
    hex_color: hex,
    sort_order: idx + 1,
  })), { onConflict: 'id' });
  console.log(`  ✅ Upserted ${ATTRIBUTE_VALUES.length} attribute values`);

  // ── 4. Upsert products ────────────────────────────────────────────────────
  console.log('\n🛍️ 4. Upserting products...');
  const productRows = PRODUCTS.map(p => {
    const discountPct = p.compare ? Math.round(((p.compare - p.price) / p.compare) * 100) : 0;
    return {
      id: stableId('product', p.slug),
      slug: p.slug,
      name_ar: p.ar,
      name_en: p.en,
      description_ar: p.descAr,
      description_en: p.descEn,
      brand_id: stableId('brand', p.brand),
      category_id: stableId('category', p.cat),
      size_guide_id: p.guide ? stableId('size-guide', p.guide) : null,
      base_price: p.price,
      discount_percentage: discountPct > 0 ? discountPct : null,
      discount_start_at: discountPct > 0 ? new Date(Date.now() - 86400000).toISOString() : null,
      discount_end_at: discountPct > 0 ? new Date(Date.now() + 60 * 86400000).toISOString() : null,
      is_featured: Boolean(p.featured),
      is_active: true,
      status: 'published',
      tags: p.tags || [],
    };
  });

  const { error: pErr } = await supabase.from('products').upsert(productRows, { onConflict: 'slug' });
  if (pErr) console.error('Products upsert error:', pErr.message);
  else console.log(`  ✅ Upserted ${productRows.length} products`);

  // ── 5. Upsert product images ──────────────────────────────────────────────
  console.log('\n🖼️ 5. Upserting product images...');
  const imageRows = PRODUCTS.map(p => ({
    id: stableId('product-image-v3', p.slug),
    product_id: stableId('product', p.slug),
    url: imgUrl(`products/${p.slug}.webp`),
    is_primary: true,
    sort_order: 1,
  }));
  const { error: piErr } = await supabase.from('product_images').upsert(imageRows, { onConflict: 'id' });
  if (piErr) console.error('Images upsert error:', piErr.message);
  else console.log(`  ✅ Upserted ${imageRows.length} product images`);

  // ── 6. Generate variants ──────────────────────────────────────────────────
  console.log('\n📐 6. Generating product variants (SKUs)...');
  const variantRows = [];
  const variantAttrRows = [];
  const seenSkus = new Set();

  for (const p of PRODUCTS) {
    const sizes = p.sizes || ['one-size'];
    const colors = p.colors || ['black'];

    for (const s of sizes) {
      for (const c of colors) {
        const sku = `${p.slug.toUpperCase()}-${s.toUpperCase()}-${c.toUpperCase()}`;
        if (seenSkus.has(sku)) continue;
        seenSkus.add(sku);
        const vId = stableId('variant', sku);

        variantRows.push({
          id: vId,
          product_id: stableId('product', p.slug),
          sku,
          price_syp: p.price,
          compare_price_syp: p.compare || null,
          stock_quantity: 30,
          is_active: true,
        });

        // Attributes
        variantAttrRows.push({ variant_id: vId, attribute_value_id: stableId('attribute-value', `size:${s}`) });
        variantAttrRows.push({ variant_id: vId, attribute_value_id: stableId('attribute-value', `color:${c}`) });
        if (p.material) {
          variantAttrRows.push({ variant_id: vId, attribute_value_id: stableId('attribute-value', `material:${p.material}`) });
        }
      }
    }
  }

  // Batch upsert variants
  const BATCH = 200;
  for (let i = 0; i < variantRows.length; i += BATCH) {
    const batch = variantRows.slice(i, i + BATCH);
    const { error } = await supabase.from('product_variants').upsert(batch, { onConflict: 'sku' });
    if (error) console.error(`Variant batch error: ${error.message}`);
  }
  console.log(`  ✅ Upserted ${variantRows.length} SKUs`);

  // Batch upsert variant attributes
  const uniqueAttrs = [];
  const seenPairs = new Set();
  for (const va of variantAttrRows) {
    const key = `${va.variant_id}:${va.attribute_value_id}`;
    if (!seenPairs.has(key)) { seenPairs.add(key); uniqueAttrs.push(va); }
  }
  for (let i = 0; i < uniqueAttrs.length; i += BATCH) {
    const batch = uniqueAttrs.slice(i, i + BATCH);
    const { error } = await supabase.from('variant_attributes').upsert(batch, { onConflict: 'variant_id,attribute_value_id' });
    if (error && !error.message.includes('duplicate')) console.error(`Attr batch: ${error.message}`);
  }
  console.log(`  ✅ Linked ${uniqueAttrs.length} variant attribute pairs`);

  // ── 7. Update homepage sections ───────────────────────────────────────────
  console.log('\n🏠 7. Updating homepage sections...');
  const allBrandIds = BRANDS.map(b => stableId('brand', b.slug));
  const sections = [
    {
      id: stableId('homepage-section', 'main_banner'),
      section_key: 'main_banner',
      title_ar: 'البانر الرئيسي',
      title_en: 'Main Banner',
      sort_order: 10,
      is_active: true,
      content: {
        banners: [{
          image_url: `${url}/storage/v1/object/public/product-images/owned/catalog-2026/home/hero.webp`,
          mobile_image_url: `${url}/storage/v1/object/public/product-images/owned/catalog-2026/home/hero-mobile.webp`,
          title_ar: 'منتجات مختارة لحياة يومية أجمل',
          title_en: 'Considered products for everyday life',
          subtitle_ar: 'خامات واضحة، مقاسات فعلية، مخزون مباشر، ودفع عند الاستلام.',
          subtitle_en: 'Clear materials, real sizing, live inventory, and cash on delivery.',
          cta_url: '/products',
          cta_label_ar: 'استكشف الكتالوج',
          cta_label_en: 'Explore the catalog',
          link_url: '/products',
          is_active: true,
          sort_order: 0,
        }]
      }
    },
    {
      id: stableId('homepage-section', 'featured_brands'),
      section_key: 'featured_brands',
      title_ar: 'علامات مختارة',
      title_en: 'Featured Brands',
      sort_order: 20,
      is_active: true,
      content: { brand_ids: allBrandIds }
    },
    {
      id: stableId('homepage-section', 'new_arrivals'),
      section_key: 'new_arrivals',
      title_ar: 'وصل حديثاً',
      title_en: 'New Arrivals',
      sort_order: 30,
      is_active: true,
      content: { limit: 16 }
    },
    {
      id: stableId('homepage-section', 'sales'),
      section_key: 'sales',
      title_ar: 'عروض حصرية وتخفيضات',
      title_en: 'Exclusive Offers & Sales',
      sort_order: 40,
      is_active: true,
      content: { limit: 16 }
    },
    {
      id: stableId('homepage-section', 'most_popular'),
      section_key: 'most_popular',
      title_ar: 'الأكثر طلباً وشهرة',
      title_en: 'Most Popular Icons',
      sort_order: 50,
      is_active: true,
      content: { limit: 16 }
    },
  ];
  const { error: hsErr } = await supabase.from('homepage_sections').upsert(sections, { onConflict: 'section_key' });
  if (hsErr) console.error('Homepage sections error:', hsErr.message);
  else console.log(`  ✅ Updated ${sections.length} homepage sections`);

  // ── 8. Expanded collections ───────────────────────────────────────────────
  console.log('\n📚 8. Upserting expanded collections...');
  const collections = [
    {
      slug: 'streetwear-icons',
      title_ar: 'أيقونات ستريت وير',
      title_en: 'Streetwear Icons',
      desc_ar: 'أقوى إصدارات نايك وأديداس وبوما وريبوك وسكيتشرز - الملابس والأحذية التي تحكم الشارع.',
      desc_en: 'The greatest hits from Nike, Adidas, Puma, Reebok and Skechers — defining streetwear culture.',
      products: ['nike-air-force-1-07','adidas-samba-classic','puma-palermo-leather-sneaker','reebok-club-c-85-vintage','nike-air-jordan-1-high','adidas-campus-00s','puma-suede-classic-xxi'],
    },
    {
      slug: 'haute-couture-heritage',
      title_ar: 'فخامة باريس وميلانو',
      title_en: 'Parisian & Italian Luxury',
      desc_ar: 'حقائب وعطور وأحذية وإكسسوارات من شانيل وغوتشي للأناقة الأوروبية الخالدة.',
      desc_en: 'Bags, fragrances, shoes and accessories from Chanel and Gucci defining timeless European elegance.',
      products: ['gucci-gg-marmont-shoulder-bag','chanel-classic-11-12-flap-bag','gucci-horsebit-1953-loafer','chanel-no5-parfum','gucci-ace-leather-sneaker','chanel-boy-bag-medium'],
    },
    {
      slug: 'executive-tailoring',
      title_ar: 'أناقة الأعمال والبدلات',
      title_en: 'Executive Tailoring',
      desc_ar: 'بدلات صوف إيطالي وقمصان وساعات من هوغو بوس ولاكوست وتومي هيلفيغر.',
      desc_en: 'Virgin wool suits, crisp shirts, and luxury watches from BOSS, Lacoste, and Tommy Hilfiger.',
      products: ['boss-slim-fit-stretch-suit','lacoste-l1212-classic-polo','tommy-hilfiger-1985-oxford-shirt','boss-skeleton-automatic-watch','boss-leather-chelsea-boot'],
    },
    {
      slug: 'summer-essentials',
      title_ar: 'أساسيات الصيف',
      title_en: 'Summer Essentials',
      desc_ar: 'كل ما تحتاجه لإطلالة صيفية مثالية من أبرز الماركات العالمية.',
      desc_en: 'Everything you need for the perfect summer look from the world\'s top brands.',
      products: ['lacoste-l1212-classic-polo','zara-oversized-poplin-shirt','adidas-3-stripes-tee','puma-ferrari-race-polo','tommy-hilfiger-flag-polo','chanel-espadrilles'],
    },
    {
      slug: 'luxury-fragrances',
      title_ar: 'عطور الفخامة الراقية',
      title_en: 'Luxury Fragrance Collection',
      desc_ar: 'أشهر عطور العالم من شانيل وغوتشي وهوغو بوس وكالفن كلاين.',
      desc_en: 'The world\'s most iconic fragrances from Chanel, Gucci, Hugo Boss, and Calvin Klein.',
      products: ['chanel-no5-parfum','chanel-bleu-de-chanel-parfum','chanel-coco-mademoiselle','gucci-flora-gorgeous-gardenia','boss-bottled-eau-de-parfum','calvin-klein-ck-one-unisex','gucci-guilty-pour-homme'],
    },
    {
      slug: 'luxury-bags-collection',
      title_ar: 'حقائب الفخامة العالمية',
      title_en: 'World Luxury Bag Collection',
      desc_ar: 'أيقونات الحقائب الفاخرة من شانيل وغوتشي وكالفن كلاين وزارا.',
      desc_en: 'Iconic luxury bags from Chanel, Gucci, Calvin Klein, and Zara.',
      products: ['gucci-gg-marmont-shoulder-bag','chanel-classic-11-12-flap-bag','chanel-boy-bag-medium','gucci-bamboo-handle-bag','gucci-gg-canvas-tote','zara-structured-tote-bag'],
    },
    {
      slug: 'winter-collection-2026',
      title_ar: 'تشكيلة شتاء 2026',
      title_en: 'Winter Collection 2026',
      desc_ar: 'معاطف وهوديز وسترات شتوية من أبرز الماركات للموسم البارد.',
      desc_en: 'Coats, hoodies, and winter layers from the world\'s best brands for the cold season.',
      products: ['nike-tech-fleece-hoodie','tommy-hilfiger-cable-knit-sweater','boss-wool-overcoat','gucci-wool-coat','zara-faux-leather-trench','adidas-originals-trefoil-hoodie'],
    },
    {
      slug: 'sneaker-wall',
      title_ar: 'جدار السنيكرز — كل الماركات',
      title_en: 'Sneaker Wall — All Brands',
      desc_ar: 'أكبر تشكيلة سنيكرز من نايك وأديداس وبوما وريبوك وسكيتشرز ولاكوست وتومي وكالفن.',
      desc_en: 'Massive sneaker selection from Nike, Adidas, Puma, Reebok, Skechers, Lacoste, Tommy & Calvin.',
      products: ['nike-air-force-1-07','adidas-samba-classic','puma-palermo-leather-sneaker','reebok-club-c-85-vintage','skechers-slip-ins-max-cushioning','lacoste-carnaby-leather-sneaker','tommy-hilfiger-leather-low-sneaker','calvin-klein-platform-chelsea','nike-air-jordan-1-high','adidas-campus-00s'],
    },
  ];

  for (const c of collections) {
    const colId = stableId('collection', c.slug);
    const { error: cErr } = await supabase.from('collections').upsert({
      id: colId,
      slug: c.slug,
      name_ar: c.title_ar,
      name_en: c.title_en,
      description_ar: c.desc_ar,
      description_en: c.desc_en,
      is_featured_on_homepage: true,
      has_standalone_page: true,
      is_active: true,
    }, { onConflict: 'slug' });
    if (cErr) { console.error(`Collection ${c.slug}:`, cErr.message); continue; }

    const items = c.products.map((slug, idx) => ({
      collection_id: colId,
      product_id: stableId('product', slug),
      sort_order: idx,
    }));
    await supabase.from('collection_products').delete().eq('collection_id', colId);
    const { error: ciErr } = await supabase.from('collection_products').upsert(items, { onConflict: 'collection_id,product_id' });
    if (ciErr) console.error(`Collection items ${c.slug}:`, ciErr.message);
    else process.stdout.write(`  ✅ ${c.slug}\n`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 MEGA CATALOG v3 PUBLISHED SUCCESSFULLY!');
  console.log(`📊 Summary:`);
  console.log(`   • ${PRODUCTS.length} products across ${BRANDS.length} brands`);
  console.log(`   • ${variantRows.length} SKU variants`);
  console.log(`   • ${collections.length} curated collections`);
  console.log(`   • ${sections.length} homepage sections updated`);
  console.log(`\n🌐 Live: https://euro-store.netlify.app`);
}

publish().catch(err => {
  console.error('\n❌ Publishing failed:', err.message);
  process.exit(1);
});
