import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire('D:/Files/Programming_Projects/Euro Store/apps/web/package.json');
const { createClient } = requireFromWeb('@supabase/supabase-js');

const url = 'https://szhpqyvxodhaichrrdfb.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aHBxeXZ4b2RoYWljaHJyZGZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkxOTA4NywiZXhwIjoyMTAxNDk1MDg3fQ.i7alqh2XyiDs2Qxb3KLy1AZE-6nd9yVx_VHjKLGtU2Q';

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = supabase.storage.from('product-images');
const zero = '00000000-0000-0000-0000-000000000000';

function stableId(kind, key) {
  const bytes = createHash('sha256').update(`eurostore:${kind}:${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const BRANDS_LIST = [
  { slug: 'nike', name: 'Nike', name_ar: 'نايك', order: 10 },
  { slug: 'adidas', name: 'Adidas', name_ar: 'أديداس', order: 20 },
  { slug: 'skechers', name: 'Skechers', name_ar: 'سكيتشرز', order: 30 },
  { slug: 'puma', name: 'Puma', name_ar: 'بوما', order: 40 },
  { slug: 'reebok', name: 'Reebok', name_ar: 'ريبوك', order: 50 },
  { slug: 'lacoste', name: 'Lacoste', name_ar: 'لاكوست', order: 60 },
  { slug: 'zara', name: 'Zara', name_ar: 'زارا', order: 70 },
  { slug: 'gucci', name: 'Gucci', name_ar: 'غوتشي', order: 80 },
  { slug: 'chanel', name: 'Chanel', name_ar: 'شانيل', order: 90 },
  { slug: 'hugo-boss', name: 'Hugo Boss', name_ar: 'هوغو بوس', order: 100 },
  { slug: 'calvin-klein', name: 'Calvin Klein', name_ar: 'كالفن كلاين', order: 110 },
  { slug: 'tommy-hilfiger', name: 'Tommy Hilfiger', name_ar: 'تومي هيلفيغر', order: 120 },
];

const SIZE_GUIDES = [
  {
    key: 'adult-clothing',
    name: 'دليل الملابس / Adult Clothing',
    content: {
      headers: ['Size', 'Chest (cm)', 'Waist (cm)', 'Hip (cm)'],
      rows: [
        ['XS', '84-88', '68-72', '90-94'],
        ['S', '89-94', '73-78', '95-100'],
        ['M', '95-102', '79-86', '101-108'],
        ['L', '103-110', '87-94', '109-116'],
        ['XL', '111-118', '95-102', '117-124'],
        ['XXL', '119-126', '103-110', '125-132'],
      ]
    }
  },
  {
    key: 'eu-footwear',
    name: 'دليل الأحذية الأوروبية / EU Footwear',
    content: {
      headers: ['EU', 'US Men', 'US Women', 'Foot Length (cm)'],
      rows: [
        ['38', '5.5', '7.0', '24.0'],
        ['39', '6.5', '8.0', '24.7'],
        ['40', '7.5', '9.0', '25.3'],
        ['41', '8.0', '9.5', '26.0'],
        ['42', '8.5', '10.0', '26.7'],
        ['43', '9.5', '11.0', '27.3'],
        ['44', '10.0', '11.5', '28.0'],
        ['45', '11.0', '12.5', '28.7'],
        ['46', '12.0', '13.5', '29.3'],
      ]
    }
  },
  {
    key: 'kids-clothing',
    name: 'دليل أزياء الأطفال / Kids Clothing',
    content: {
      headers: ['Size', 'Age', 'Height (cm)', 'Chest (cm)'],
      rows: [
        ['4Y', '3-4 Years', '104', '56'],
        ['6Y', '5-6 Years', '116', '60'],
        ['8Y', '7-8 Years', '128', '64'],
        ['10Y', '9-10 Years', '140', '70'],
        ['12Y', '11-12 Years', '152', '76'],
      ]
    }
  },
  {
    key: 'fragrance-guide',
    name: 'أحجام العطور / Fragrance Volume',
    content: {
      headers: ['Volume', 'Type', 'Sprays Approx.'],
      rows: [
        ['50ml', 'Eau de Parfum', '750'],
        ['100ml', 'Parfum / EDP', '1500'],
        ['150ml', 'Parfum Intense', '2250'],
      ]
    }
  }
];

const CATEGORIES_TREE = [
  { slug: 'mens', ar: 'الرجالي', en: 'Men', parent: null, order: 10, guide: 'adult-clothing', img: 'mens' },
  { slug: 'womens', ar: 'النسائي', en: 'Women', parent: null, order: 20, guide: 'adult-clothing', img: 'womens' },
  { slug: 'footwear', ar: 'الأحذية', en: 'Footwear', parent: null, order: 30, guide: 'eu-footwear', img: 'footwear' },
  { slug: 'bags-leather', ar: 'الحقائب والجلديات', en: 'Bags & Leather', parent: null, order: 40, guide: null, img: 'bags-leather' },
  { slug: 'perfumes-beauty', ar: 'العطور والجمال', en: 'Perfumes & Beauty', parent: null, order: 50, guide: 'fragrance-guide', img: 'perfumes-beauty' },
  { slug: 'watches-accessories', ar: 'الساعات والإكسسوارات', en: 'Watches & Accessories', parent: null, order: 60, guide: null, img: 'watches-accessories' },
  { slug: 'kids', ar: 'الأطفال', en: 'Kids', parent: null, order: 70, guide: 'kids-clothing', img: 'kids' },

  // Subcategories
  { slug: 'mens-clothing', ar: 'ملابس رجالية', en: "Men's Clothing", parent: 'mens', order: 11, guide: 'adult-clothing' },
  { slug: 'mens-shoes', ar: 'أحذية رجالية', en: "Men's Shoes", parent: 'mens', order: 12, guide: 'eu-footwear' },
  { slug: 'mens-accessories', ar: 'إكسسوارات رجالية', en: "Men's Accessories", parent: 'mens', order: 13, guide: null },
  { slug: 'womens-clothing', ar: 'ملابس نسائية', en: "Women's Clothing", parent: 'womens', order: 21, guide: 'adult-clothing' },
  { slug: 'womens-bags', ar: 'حقائب نسائية', en: "Women's Bags", parent: 'womens', order: 22, guide: null },
  { slug: 'womens-shoes', ar: 'أحذية نسائية', en: "Women's Shoes", parent: 'womens', order: 23, guide: 'eu-footwear' },
  { slug: 'sneakers', ar: 'سنيكرز رياضية', en: 'Sneakers', parent: 'footwear', order: 31, guide: 'eu-footwear' },
  { slug: 'formal-shoes', ar: 'أحذية كلاسيكية ولوفر', en: 'Formal & Loafers', parent: 'footwear', order: 32, guide: 'eu-footwear' },
  { slug: 'luxury-bags', ar: 'حقائب يد فاخرة', en: 'Luxury Handbags', parent: 'bags-leather', order: 41, guide: null },
  { slug: 'backpacks', ar: 'حقائب ظهر وسفر', en: 'Backpacks & Travel', parent: 'bags-leather', order: 42, guide: null },
  { slug: 'perfumes', ar: 'عطور فاخرة', en: 'Luxury Fragrances', parent: 'perfumes-beauty', order: 51, guide: 'fragrance-guide' },
  { slug: 'watches', ar: 'ساعات فاخرة', en: 'Luxury Watches', parent: 'watches-accessories', order: 61, guide: null },
  { slug: 'eyewear-belts', ar: 'نظارات وأحزمة', en: 'Eyewear & Belts', parent: 'watches-accessories', order: 62, guide: null },
  { slug: 'kids-fashion', ar: 'ملابس وأحذية أطفال', en: 'Kids Fashion', parent: 'kids', order: 71, guide: 'kids-clothing' },
];

const ATTRIBUTE_TYPES = [
  { slug: 'size', ar: 'المقاس', en: 'Size' },
  { slug: 'color', ar: 'اللون', en: 'Color' },
  { slug: 'material', ar: 'الخامة', en: 'Material' },
];

const ATTRIBUTE_VALUES = [
  // Sizes - Apparel
  ['size', 'xs', 'XS', 'XS', null],
  ['size', 's', 'S', 'S', null],
  ['size', 'm', 'M', 'M', null],
  ['size', 'l', 'L', 'L', null],
  ['size', 'xl', 'XL', 'XL', null],
  ['size', 'xxl', 'XXL', 'XXL', null],
  // Sizes - Footwear
  ...['38', '39', '40', '41', '42', '43', '44', '45', '46'].map(v => ['size', v, v, v, null]),
  // Sizes - Kids
  ['size', '4y', '4 سنوات', '4Y', null],
  ['size', '6y', '6 سنوات', '6Y', null],
  ['size', '8y', '8 سنوات', '8Y', null],
  ['size', '10y', '10 سنوات', '10Y', null],
  ['size', '12y', '12 سنة', '12Y', null],
  // Sizes - Fragrance
  ['size', '50ml', '50 مل', '50ml', null],
  ['size', '100ml', '100 مل', '100ml', null],
  ['size', '150ml', '150 مل', '150ml', null],
  // Sizes - Accessories
  ['size', 'one-size', 'مقاس موحد', 'One Size', null],

  // Colors
  ['color', 'black', 'أسود فاحم', 'Triple Black', '#121214'],
  ['color', 'white', 'أبيض نقي', 'Pure White', '#FBFBFA'],
  ['color', 'grey', 'رمادي كلاسيك', 'Heather Grey', '#8E8E93'],
  ['color', 'navy', 'كحلي ليلي', 'Midnight Navy', '#14213D'],
  ['color', 'red', 'أحمر قرمزي', 'Crimson Red', '#DC2626'],
  ['color', 'green', 'أخضر غابة', 'Forest Green', '#15803D'],
  ['color', 'blue', 'أزرق ملكي', 'Royal Blue', '#2563EB'],
  ['color', 'beige', 'بيج عاجي', 'Ivory Beige', '#EAE6DF'],
  ['color', 'brown', 'بني كونياك', 'Cognac Brown', '#78350F'],
  ['color', 'burgundy', 'خمري ملكي', 'Burgundy Wine', '#881337'],
  ['color', 'gold', 'ذهبي براق', 'Luxury Gold', '#D4AF37'],
  ['color', 'silver', 'فضي فولاذي', 'Brushed Silver', '#CBD5E1'],
  ['color', 'pink', 'وردي ناعم', 'Soft Rose', '#F472B6'],

  // Materials
  ['material', 'full-grain-leather', 'جلد طبيعي نقي', 'Full-grain Calfskin Leather', null],
  ['material', 'organic-cotton', 'قطن عضوي 100%', '100% Organic Cotton', null],
  ['material', 'tech-fleece', 'تيك فليس حراري', 'Thermal Tech Fleece', null],
  ['material', 'suede', 'جلد شمواه فاخر', 'Premium Suede', null],
  ['material', 'primeknit-mesh', 'نسيج شبكي مرن', 'Breathable Primeknit Mesh', null],
  ['material', 'virgin-wool', 'صوف بكر خالص', '100% Virgin Wool', null],
  ['material', 'silk-satin', 'حرير وساتان ناعم', 'Silk & Satin Blend', null],
  ['material', 'stainless-steel', 'فولاذ مقاوم للصدأ', '316L Stainless Steel', null],
  ['material', 'fragrance-glass', 'زجاج عطور كريستالي', 'Crystal Glass Bottle', null],
  ['material', 'recycled-down', 'ريش عازل معاد تدويره', 'Recycled Down Insulation', null],
];

// 54 World Iconic Products
const PRODUCTS_DATA = [
  // NIKE
  { slug: 'nike-air-force-1-07', ar: "حذاء نايك إير فورس 1 '07 كلاسيك", en: "Nike Air Force 1 '07 All-White", brand: 'nike', cat: 'sneakers', guide: 'eu-footwear', price: 1450000, compare: 1700000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['bestseller', 'core'], descAr: 'الأيقونة الأسطورية من نايك بتصميم أبيض نقي مع نعل هواء مضغوط Air وراحة فائقة طوال اليوم.', descEn: 'The legendary silhouette with stitched overlays, crisp clean leather and full-length encapsulated Nike Air cushioning.' },
  { slug: 'nike-air-max-270', ar: 'حذاء نايك إير ماكس 270 العصري', en: 'Nike Air Max 270 Lifestyle Runner', brand: 'nike', cat: 'sneakers', guide: 'eu-footwear', price: 1750000, compare: 2100000, material: 'primeknit-mesh', colors: ['black', 'blue', 'white'], sizes: ['40', '41', '42', '43', '44', '45'], featured: true, tags: ['trending', 'sale'], descAr: 'يتميز بأكبر وسادة هوائية لكعب القدم من نايك لمنحك خطوة فائقة النعومة والمرونة.', descEn: 'Boasts Nike’s biggest heel Air unit yet for a super-soft ride that feels as impossible as it looks.' },
  { slug: 'nike-tech-fleece-hoodie', ar: 'هودي نايك تيك فليس ويندرنر بسحاب', en: 'Nike Tech Fleece Full-Zip Windrunner', brand: 'nike', cat: 'mens-clothing', guide: 'adult-clothing', price: 1550000, material: 'tech-fleece', colors: ['black', 'grey', 'navy'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], featured: true, tags: ['new', 'winter'], descAr: 'قماش تيك فليس خفيف الوزن ودافئ للغاية مع جيب بسحاب مميز على الكم وقصة عصرية.', descEn: 'Premium lightweight fleece smooth on both sides provides premium warmth without adding bulk.' },
  { slug: 'nike-club-fleece-joggers', ar: 'بنطال رياضي نايك كلوب فليس مريح', en: 'Nike Sportswear Club Fleece Joggers', brand: 'nike', cat: 'mens-clothing', guide: 'adult-clothing', price: 950000, material: 'organic-cotton', colors: ['black', 'grey', 'navy'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'بنطال جوغرز كلاسيكي من الصوف القطني الناعم مع خصر مطاطي وأساور كاحل مضلعة.', descEn: 'Classic jogger styling with brushed-back fleece for a soft, smooth feel during everyday wear.' },
  { slug: 'nike-pegasus-40', ar: 'حذاء الجري نايك إير زوم بيغاسوس 40', en: 'Nike Air Zoom Pegasus 40 Road Runner', brand: 'nike', cat: 'sneakers', guide: 'eu-footwear', price: 1650000, compare: 1950000, material: 'primeknit-mesh', colors: ['blue', 'black', 'white'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['sale', 'running'], descAr: 'حذاء الجري الأكثر موثوقية واستجابة مع وحدتي Zoom Air لتوسيد متوازن وداعم.', descEn: 'A springy ride for every run, familiar and custom-tuned to help you crush your running milestones.' },
  { slug: 'nike-dri-fit-club-cap', ar: 'قبعة نايك دراي فيت كلوب كلاسيك', en: 'Nike Dri-FIT Unstructured Club Cap', brand: 'nike', cat: 'mens-accessories', guide: null, price: 380000, material: 'organic-cotton', colors: ['black', 'white', 'navy'], sizes: ['one-size'], tags: ['accessories'], descAr: 'قبعة رياضية خفيفة بتقنية دراي فيت الطاردة للعرق مع حزام خلفي قابل للتعديل بسهولة.', descEn: 'Classic mid-depth cap with sweat-wicking technology to keep you cool and fresh throughout the day.' },

  // ADIDAS
  { slug: 'adidas-samba-classic', ar: 'حذاء أديداس سامبا كلاسيك الأصلي', en: 'Adidas Originals Samba Classic Leather', brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear', price: 1480000, compare: 1750000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['bestseller', 'trending'], descAr: 'حذاء السامبا الأسطوري بجلد طبيعي وتفاصيل شمواه على المقدمة والنعل المطاطي الكلاسيكي.', descEn: 'Legendary low-profile indoor football shoe turned streetwear icon with soft leather upper and gum sole.' },
  { slug: 'adidas-gazelle-indoor', ar: 'حذاء أديداس غازيل إندور شمواه ملون', en: 'Adidas Originals Gazelle Indoor Suede', brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear', price: 1520000, material: 'suede', colors: ['green', 'blue', 'burgundy'], sizes: ['39', '40', '41', '42', '43', '44'], featured: true, tags: ['new', 'trending'], descAr: 'تصميم عريق بجزء علوي من الشمواه الفاخر والثلاثة خطوط الكلاسيكية مع نعل مطاطي شبه شفاف.', descEn: 'Features rich suede styling, contrast leather 3-Stripes and a translucent gum rubber cupsole.' },
  { slug: 'adidas-ultraboost-light', ar: 'حذاء الجري أديداس ألترا بوست لايت', en: 'Adidas Ultraboost Light Running Shoes', brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear', price: 2150000, compare: 2500000, material: 'primeknit-mesh', colors: ['black', 'white', 'blue'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['sale', 'premium'], descAr: 'أخف حذاء Ultraboost تم صنعه بفضل تقنية Light BOOST التي توفر طاقة ارتدادية لا تضاهى.', descEn: 'Experience epic energy with our lightest BOOST ever. Engineered for high performance and pure comfort.' },
  { slug: 'adidas-beckenbauer-tracktop', ar: 'جاكيت تراك أديداس بيكنباور أوريجينالز', en: 'Adidas Originals Beckenbauer Track Top', brand: 'adidas', cat: 'mens-clothing', guide: 'adult-clothing', price: 1380000, material: 'organic-cotton', colors: ['navy', 'black', 'green'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], featured: true, tags: ['core'], descAr: 'جاكيت التراك التاريخي المستوحى من السبعينات مع سحاب كامل وياقة قائمة والشعار المطرز.', descEn: 'Heritage silhouette with ribbed stand-up collar, signature 3-Stripes down the arms and embroidered Trefoil.' },
  { slug: 'adidas-3-stripes-tee', ar: 'تيشيرت أديداس أوريجينالز كلاسيك 3 خطوط', en: 'Adidas Adicolor Classics 3-Stripes Tee', brand: 'adidas', cat: 'mens-clothing', guide: 'adult-clothing', price: 580000, material: 'organic-cotton', colors: ['white', 'black', 'navy', 'red'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'تيشيرت من القطن العضوي الصافي بقصة قياسية مريحة وأكمام مخططة بثلاثة خطوط.', descEn: 'Signature cotton jersey tee with ribbed crewneck and cuffs for an authentic sporty look.' },
  { slug: 'adidas-stan-smith-leather', ar: 'حذاء أديداس ستان سميث جلد كلاسيك', en: 'Adidas Stan Smith Timeless Leather', brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear', price: 1320000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['38', '39', '40', '41', '42', '43', '44'], tags: ['core'], descAr: 'حذاء التنس النظيف والأنيق برسمة ستان سميث المميزة على اللسان وتفاصيل خضراء هادئة.', descEn: 'Simple, understated tennis classic with clean lines and perforated 3-Stripes.' },

  // SKECHERS
  { slug: 'skechers-slip-ins-max-cushioning', ar: 'حذاء سكيتشرز سليب-إن ماكس كوشينينغ', en: 'Skechers Hands Free Slip-ins Max Cushioning', brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear', price: 1420000, compare: 1650000, material: 'primeknit-mesh', colors: ['black', 'grey', 'navy'], sizes: ['40', '41', '42', '43', '44', '45'], featured: true, tags: ['new', 'comfort'], descAr: 'ارتدِ حذاءك دون استخدام اليدين مع وسادة Heel Pillow وتوسيد Max Cushioning فائق النعومة.', descEn: 'Step into effortless comfort with exclusive Heel Pillow technology and ultra-cushioned responsive platform.' },
  { slug: 'skechers-dlites-memory-foam', ar: 'حذاء سكيتشرز دي لايتس ميموري فوم', en: "Skechers D'Lites Memory Foam Sneaker", brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear', price: 1250000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['38', '39', '40', '41', '42', '43'], tags: ['trending'], descAr: 'سنيكرز عصري بفرش Air-Cooled Memory Foam مع نعل سميك ممتص للصدمات.', descEn: 'Iconic chunky sneaker featuring smooth leather overlays and cooling memory foam cushioned insole.' },
  { slug: 'skechers-go-walk-7', ar: 'حذاء المشي اليومي سكيتشرز جو ووك 7', en: 'Skechers GO WALK 7 Daily Walkers', brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear', price: 1180000, material: 'primeknit-mesh', colors: ['navy', 'grey', 'black'], sizes: ['39', '40', '41', '42', '43', '44', '45'], tags: ['comfort'], descAr: 'تقنية Hyper Pillar عالية الارتداد مع نعل خفيف للمشي لمسافات طويلة دون أي إجهاد.', descEn: 'High-rebound ultra-lightweight walking shoe with responsive ULTRA GO cushioning.' },
  { slug: 'skechers-arch-fit-leather', ar: 'سنيكرز سكيتشرز آرش فيت جلد مريح', en: 'Skechers Arch Fit Paradyme Leather', brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear', price: 1350000, compare: 1550000, material: 'full-grain-leather', colors: ['brown', 'black'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['sale'], descAr: 'نظام دعم قوس القدم المعتمد من أطباء القدم لتوزيع الوزن وتقليل الصدمات.', descEn: 'Podiatrist-certified arch support developed with 20 years of data and 120,000 unweighted foot scans.' },

  // PUMA
  { slug: 'puma-suede-classic-xxi', ar: 'حذاء بوما سويد كلاسيك إكس إكس آي', en: 'Puma Suede Classic XXI Iconic Shoes', brand: 'puma', cat: 'sneakers', guide: 'eu-footwear', price: 1280000, material: 'suede', colors: ['black', 'red', 'navy'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['core'], descAr: 'الحذاء الذي غيّر تاريخ السنيكرز منذ 1968 بشمواه كامل وشريط الفورمستريب الشهير.', descEn: 'The shoe that started it all in 1968, constructed with full premium suede and gold foil branding.' },
  { slug: 'puma-palermo-leather-sneaker', ar: 'حذاء بوما باليرمو كلاسيك الإيطالي', en: 'Puma Palermo Retro Leather Sneaker', brand: 'puma', cat: 'sneakers', guide: 'eu-footwear', price: 1390000, compare: 1600000, material: 'full-grain-leather', colors: ['white', 'green'], sizes: ['39', '40', '41', '42', '43', '44'], tags: ['new', 'sale'], descAr: 'مستوحى من ملاعب الثمانينات بلمسة ريترو مميزة وشعار بوما الذهبي المميز على الجانب.', descEn: 'Straight from the archives, featuring its signature T-toe construction and classic gum sole.' },
  { slug: 'puma-essentials-fleece-hoodie', ar: 'هودي بوما إسنشالز قطني كلاسيك', en: 'Puma Essentials Big Logo Fleece Hoodie', brand: 'puma', cat: 'mens-clothing', guide: 'adult-clothing', price: 880000, material: 'organic-cotton', colors: ['black', 'grey', 'navy'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'هودي دافئ من مزيج القطن الناعم مع جيب كانغرو أمامي وطبعة شعار بوما على الصدر.', descEn: 'Cozy everyday fleece hoodie with ribbed hem and cuffs and bold Puma chest branding.' },
  { slug: 'puma-ferrari-race-polo', ar: 'قميص بولو بوما سكوديريا فيراري', en: 'Puma Scuderia Ferrari Race Polo', brand: 'puma', cat: 'mens-clothing', guide: 'adult-clothing', price: 1100000, material: 'organic-cotton', colors: ['red', 'black'], sizes: ['s', 'm', 'l', 'xl'], tags: ['exclusive'], descAr: 'تصميم رياضي أنيق يحمل شعار درع فيراري الأصلي وقصة مريحة تناسب عشاق السباقات.', descEn: 'Premium piqué polo blending motorsport energy with refined everyday style.' },

  // REEBOK
  { slug: 'reebok-club-c-85-vintage', ar: 'حذاء ريبوك كلوب سي 85 فينتج', en: 'Reebok Club C 85 Vintage Sneaker', brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear', price: 1350000, compare: 1550000, material: 'full-grain-leather', colors: ['white', 'green'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['bestseller', 'vintage'], descAr: 'جلد طبيعي ناعم بطابع الثمانينات الكلاسيكي مع بطانة تيري مريحة وشعار ريبوك المطرز.', descEn: 'Court classic in vintage chalk leather with soft terry lining and archived woven labels.' },
  { slug: 'reebok-classic-leather', ar: 'حذاء ريبوك كلاسيك ليذر الأيقوني', en: 'Reebok Classic Leather Timeless Shoes', brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear', price: 1290000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['39', '40', '41', '42', '43', '44'], tags: ['core'], descAr: 'جلد طبيعي نقي وخفيف الوزن مع نعل أوسط EVA لتوسيد فائق وراحة تدوم طوال اليوم.', descEn: 'Die-cut EVA midsole provides lightweight cushioning while high abrasion rubber outsole adds durability.' },
  { slug: 'reebok-nano-x4-training', ar: 'حذاء التدريب واللياقة ريبوك نانو إكس 4', en: 'Reebok Nano X4 Cross-Training Shoes', brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear', price: 1850000, compare: 2150000, material: 'primeknit-mesh', colors: ['black', 'grey'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['sale', 'fitness'], descAr: 'الحذاء الأقوى للتمارين المكثفة ورفع الأثقال مع نظام تهوية مطور وثبات عالي للقدم.', descEn: 'Ultra-lightweight training shoe with enhanced breathability and Lift and Run Chassis support.' },
  { slug: 'reebok-vector-fleece-sweatshirt', ar: 'سويت شيرت ريبوك كلاسيك فيكتور', en: 'Reebok Classic Vector Crewneck Sweatshirt', brand: 'reebok', cat: 'mens-clothing', guide: 'adult-clothing', price: 820000, material: 'organic-cotton', colors: ['navy', 'grey'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'سويت شيرت قطني مريح بياقة مستديرة وتطريز شعار فيكتور الكلاسيكي على الصدر.', descEn: 'Relaxed cotton-fleece crewneck sweater with archival Vector logo embroidery.' },

  // LACOSTE
  { slug: 'lacoste-l1212-classic-polo', ar: 'قميص بولو لاكوست كلاسيك L.12.12 الأصلي', en: 'Lacoste Classic Fit L.12.12 Piqué Polo', brand: 'lacoste', cat: 'mens-clothing', guide: 'adult-clothing', price: 1680000, compare: 1950000, material: 'organic-cotton', colors: ['white', 'navy', 'green', 'black'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], featured: true, tags: ['bestseller', 'luxury'], descAr: 'قميص البولو الشهير المصنوع من قطن البيكيه الفاخر والمزين بالتمساح الأخضر المطرز يدوياً.', descEn: 'The iconic petit piqué polo shirt invented by René Lacoste in 1933 with signature green crocodile.' },
  { slug: 'lacoste-carnaby-leather-sneaker', ar: 'سنيكرز لاكوست كارنابي جلد أبيض', en: 'Lacoste Carnaby Evo Leather Sneaker', brand: 'lacoste', cat: 'sneakers', guide: 'eu-footwear', price: 1550000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['39', '40', '41', '42', '43', '44'], tags: ['luxury', 'core'], descAr: 'سنيكرز أنيق وبسيط من الجلد الناعم مع تفاصيل خضراء وشعار التمساح المعدني المصقول.', descEn: 'Tennis-heritage court sneaker crafted in premium soft napa leather with subtle embossed branding.' },
  { slug: 'lacoste-cotton-zip-cardigan', ar: 'كارديغان لاكوست قطني بسحاب كامل', en: 'Lacoste Full-Zip Organic Cotton Cardigan', brand: 'lacoste', cat: 'mens-clothing', guide: 'adult-clothing', price: 1950000, compare: 2300000, material: 'organic-cotton', colors: ['navy', 'grey', 'black'], sizes: ['s', 'm', 'l', 'xl'], tags: ['sale', 'winter'], descAr: 'كارديغان ناعم من القطن العضوي المحبوك مع سحاب معدني مزدوج وياقة عالية أنيقة.', descEn: 'Knitted organic-cotton full-zip cardigan with high stand collar and signature crocodile chest patch.' },
  { slug: 'lacoste-grained-leather-wallet', ar: 'محفظة لاكوست جلد طبيعي محبب', en: 'Lacoste Grained Leather Billfold Wallet', brand: 'lacoste', cat: 'mens-accessories', guide: null, price: 680000, material: 'full-grain-leather', colors: ['black', 'navy'], sizes: ['one-size'], tags: ['accessories', 'gift'], descAr: 'محفظة رجالية فاخرة بجيوب متعددة للبطاقات والنقود وشعار التمساح المعدني.', descEn: 'Sophisticated billfold wallet in premium pebbled leather with 6 card slots and metal croc badge.' },

  // ZARA
  { slug: 'zara-tailored-textured-blazer', ar: 'بليزر زارا مفصل بقماش محكم وفخم', en: 'Zara Tailored Textured Wool-Blend Blazer', brand: 'zara', cat: 'mens-clothing', guide: 'adult-clothing', price: 1850000, compare: 2150000, material: 'virgin-wool', colors: ['grey', 'navy', 'black'], sizes: ['s', 'm', 'l', 'xl'], featured: true, tags: ['new', 'formal'], descAr: 'بليزر أنيق بمزيج صوف محكم وقصة ضيقة مع بطانة داخلية حريرية وجيوب بغطاء.', descEn: 'Slim-fit blazer crafted from a textured wool-blend fabric with notched lapels and satin lining.' },
  { slug: 'zara-pleated-wide-leg-trousers', ar: 'بنطال زارا بأرجل واسعة وثنيات عصرية', en: 'Zara Pleated Wide-Leg Fluid Trousers', brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing', price: 920000, material: 'silk-satin', colors: ['beige', 'black'], sizes: ['xs', 's', 'm', 'l'], tags: ['trending'], descAr: 'بنطال نسائي راقٍ بخصر عالي وأرجل منسدلة واسعة تناسب الإطلالات اليومية والعملية.', descEn: 'High-waisted trousers with front pleats, wide leg cut and seamless concealed side zip.' },
  { slug: 'zara-satin-midi-slip-dress', ar: 'فستان زارا ساتان ميدي أنيق', en: 'Zara Satin Finish Midi Slip Dress', brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing', price: 1150000, compare: 1350000, material: 'silk-satin', colors: ['burgundy', 'green', 'black'], sizes: ['xs', 's', 'm', 'l'], featured: true, tags: ['sale', 'party'], descAr: 'فستان ميدي بلمعة الساتان الفاخرة وياقة منسدلة وقصة جذابة لجميع المناسبات.', descEn: 'Midi dress with cowl neckline, adjustable crossover back straps and fluid flowing drape.' },
  { slug: 'zara-faux-leather-trench', ar: 'معطف ترنش زارا جلد فاخر طويل', en: 'Zara Double-Breasted Faux Leather Trench', brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing', price: 2350000, compare: 2750000, material: 'full-grain-leather', colors: ['brown', 'black'], sizes: ['s', 'm', 'l'], tags: ['sale', 'winter'], descAr: 'معطف ترنش طويل بصفين من الأزرار وحزام خصر متطابق من الجلد الصناعي الفاخر.', descEn: 'Double-breasted longline trench coat with matching buckled belt and shoulder epaulettes.' },
  { slug: 'zara-oversized-poplin-shirt', ar: 'قميص زارا بوبلين واسع بقصة مريحة', en: 'Zara 100% Cotton Oversized Poplin Shirt', brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing', price: 780000, material: 'organic-cotton', colors: ['white', 'blue'], sizes: ['xs', 's', 'm', 'l', 'xl'], tags: ['core'], descAr: 'قميص بوبلين كلاسيكي واسع بقماش قطني بارد وأزرار أمامية وأكمام قابلة للطي.', descEn: 'Crisp oversized 100% cotton poplin shirt with pointed collar and chest patch pocket.' },

  // GUCCI
  { slug: 'gucci-gg-marmont-shoulder-bag', ar: 'حقيبة كتف غوتشي جي جي مارمونت جلد', en: 'Gucci GG Marmont Matelassé Leather Bag', brand: 'gucci', cat: 'luxury-bags', guide: null, price: 4200000, compare: 4800000, material: 'full-grain-leather', colors: ['black', 'pink', 'beige'], sizes: ['one-size'], featured: true, tags: ['luxury', 'bestseller'], descAr: 'حقيبة كتف مارمونت الشهيرة بجلد شيفرون مبطن وسلسلة ذهبية عتيقة مع شعار GG المزدوج.', descEn: 'Small GG Marmont chain shoulder bag with a softly structured shape and Double G hardware.' },
  { slug: 'gucci-horsebit-1953-loafer', ar: 'حذاء لوفر غوتشي هورسبت 1953 جلد طبيعي', en: 'Gucci 1953 Horsebit Calfskin Loafers', brand: 'gucci', cat: 'formal-shoes', guide: 'eu-footwear', price: 3450000, material: 'full-grain-leather', colors: ['black', 'brown'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['luxury', 'heritage'], descAr: 'حذاء اللوفر الأيقوني بحلية هورسبت الذهبية والجلد الإيطالي الفاخر بدرزة يدوية متقنة.', descEn: 'Introduced in 1953, the classic loafer features burnished calfskin and the heritage golden Horsebit.' },
  { slug: 'gucci-double-g-leather-belt', ar: 'حزام غوتشي جلد فاخر بإبزيم GG المزدوج', en: 'Gucci Leather Belt with Double G Buckle', brand: 'gucci', cat: 'eyewear-belts', guide: 'adult-clothing', price: 1850000, compare: 2150000, material: 'full-grain-leather', colors: ['black', 'brown'], sizes: ['s', 'm', 'l', 'xl'], tags: ['luxury', 'sale'], descAr: 'حزام من الجلد الإيطالي الفاخر بعرض 4 سم مع إبزيم GG الذهبي اللامع الأيقوني.', descEn: 'Smooth black leather belt with iconic Double G buckle in shiny gold-toned brass hardware.' },
  { slug: 'gucci-flora-gorgeous-gardenia', ar: 'عطر غوتشي فلورا جورجوس جاردينيا', en: 'Gucci Flora Gorgeous Gardenia Eau de Parfum', brand: 'gucci', cat: 'perfumes', guide: 'fragrance-guide', price: 2350000, compare: 2700000, material: 'fragrance-glass', colors: ['pink'], sizes: ['50ml', '100ml'], featured: true, tags: ['perfume', 'luxury'], descAr: 'عطر زهري فاخر بعبير الغاردينيا البيضاء وزهر الكمثرى والياسمين الشمسي الدافئ.', descEn: 'A joyful floral signature built around the Gardenia flower blended with Solar Jasmine and Pear Blossom.' },
  { slug: 'gucci-square-acetate-sunglasses', ar: 'نظارة شمسية غوتشي مربعة بإطار أسيتات', en: 'Gucci Square Acetate Frame Sunglasses', brand: 'gucci', cat: 'eyewear-belts', guide: null, price: 1650000, material: 'stainless-steel', colors: ['black', 'gold'], sizes: ['one-size'], tags: ['accessories', 'luxury'], descAr: 'نظارة شمسية فاخرة بإطار مربع عريض وحماية 100% من الأشعة فوق البنفسجية وشعار غوتشي الذهبي.', descEn: 'Bold square acetate sunglasses featuring gradient lenses and gold-toned Gucci lettering on temples.' },

  // CHANEL
  { slug: 'chanel-bleu-de-chanel-parfum', ar: 'عطر بلو دي شانيل بارفان الخشبي الفاخر', en: 'Chanel Bleu de Chanel Parfum Spray', brand: 'chanel', cat: 'perfumes', guide: 'fragrance-guide', price: 2850000, compare: 3200000, material: 'fragrance-glass', colors: ['navy'], sizes: ['50ml', '100ml', '150ml'], featured: true, tags: ['luxury', 'bestseller'], descAr: 'العطر الرجالي الأكثر فخامة بتركيز بارفان الخالص ونفحات خشب الصندل الكاليدوني والأرز واللبان.', descEn: 'A powerfully woody aromatic fragrance with an intense, refined trail of New Caledonian sandalwood.' },
  { slug: 'chanel-coco-mademoiselle', ar: 'عطر كوكو مادموزيل شانيل أو دو بارفان', en: 'Chanel Coco Mademoiselle Eau de Parfum', brand: 'chanel', cat: 'perfumes', guide: 'fragrance-guide', price: 2950000, compare: 3350000, material: 'fragrance-glass', colors: ['pink'], sizes: ['50ml', '100ml'], featured: true, tags: ['luxury', 'bestseller'], descAr: 'عبير أنثوي شرقي نابض بالحرية مع البرتقال المنعش والياسمين والورد والباتشولي النقي.', descEn: 'An amber fragrance with a strong personality, surprisingly fresh sparks of Orange and pure Patchouli.' },
  { slug: 'chanel-classic-11-12-flap-bag', ar: 'حقيبة شانيل كلاسيك 11.12 جلد كافيار مبطن', en: 'Chanel Classic 11.12 Grained Calfskin Bag', brand: 'chanel', cat: 'luxury-bags', guide: null, price: 4900000, material: 'full-grain-leather', colors: ['black', 'burgundy'], sizes: ['one-size'], featured: true, tags: ['luxury', 'exclusive'], descAr: 'رمز الأناقة الباريسية الخالدة بجلد الكافيار المحبب وقفل CC الدوار وسلسلة ذهبية منسوجة بالجلد.', descEn: 'The definitive Chanel handbag in quilted caviar leather with signature CC turn-lock and leather-threaded chain.' },
  { slug: 'chanel-boy-chanel-long-wallet', ar: 'محفظة بوي شانيل جلدية أنيقة بطية', en: 'Chanel Boy Chanel Long Flap Wallet', brand: 'chanel', cat: 'luxury-bags', guide: null, price: 1950000, compare: 2250000, material: 'full-grain-leather', colors: ['black'], sizes: ['one-size'], tags: ['luxury', 'accessories'], descAr: 'محفظة طويلة بجلد العجل الأملس وإطار بوي شانيل الهندسي مع قفل معدني باللون الرمادي العتيق.', descEn: 'Boy Chanel long flap wallet in smooth calfskin with ruthenium-finish graphic clasp.' },
  { slug: 'chanel-rouge-allure-lextrait', ar: 'أحمر شفاه شانيل روج ألوور الفاخر المرطب', en: "Chanel Rouge Allure L'Extrait High-Intensity", brand: 'chanel', cat: 'perfumes-beauty', guide: null, price: 580000, material: 'silk-satin', colors: ['red', 'burgundy'], sizes: ['one-size'], tags: ['beauty', 'luxury'], descAr: 'لون مركز وإشراقة حريرية مع تركيبة مغذية بزيت زهرة البرقوق وشمع النباتات الطبيعية.', descEn: 'High-intensity lip colour combining intense concentration, satin radiance and ultimate comfort.' },

  // HUGO BOSS
  { slug: 'boss-slim-fit-stretch-suit', ar: 'بدلة بوس مفصلة بقصة ضيقة من الصوف البكر', en: 'BOSS Slim-Fit Virgin Wool Stretch Suit', brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing', price: 3850000, compare: 4400000, material: 'virgin-wool', colors: ['navy', 'grey', 'black'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], featured: true, tags: ['luxury', 'formal'], descAr: 'بدلة رجالية فاخرة قطعتين من الصوف البكر الإيطالي مع بطانة ناعمة وقصة مفصلة بدقة متناهية.', descEn: 'Expertly tailored two-piece suit in virgin wool with natural stretch and signature AMF stitching.' },
  { slug: 'boss-pallas-pique-polo', ar: 'قميص بولو بوس بالاس كلاسيك مضلع', en: 'BOSS Pallas Regular-Fit Piqué Polo Shirt', brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing', price: 1250000, material: 'organic-cotton', colors: ['white', 'navy', 'black'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'بولو كلاسيكي من القطن المرن المعالج مع ياقة وأساور مضلعة وشعار BOSS المطرز على الصدر.', descEn: 'Timeless polo shirt in pure cotton piqué with contrast logo embroidery on the left chest.' },
  { slug: 'boss-bottled-eau-de-parfum', ar: 'عطر بوس بوتلد أو دو بارفان إنتنس', en: 'BOSS Bottled Eau de Parfum Intense', brand: 'hugo-boss', cat: 'perfumes', guide: 'fragrance-guide', price: 1850000, compare: 2100000, material: 'fragrance-glass', colors: ['brown'], sizes: ['50ml', '100ml'], tags: ['perfume', 'sale'], descAr: 'عطر رجالي راقٍ يجمع بين تفاح هش ودفء القرفة وحبوب التونكا وخشب الأرز.', descEn: 'An intensely masculine composition with crisp apple, warm spicy cinnamon and deep vetiver.' },
  { slug: 'boss-skeleton-automatic-watch', ar: 'ساعة بوس أوتوماتيكية بمينا مكشوف', en: 'BOSS Grand Prix Automatic Skeleton Watch', brand: 'hugo-boss', cat: 'watches', guide: null, price: 2950000, compare: 3400000, material: 'stainless-steel', colors: ['silver', 'black'], sizes: ['one-size'], featured: true, tags: ['luxury', 'watches'], descAr: 'ساعة ميكانيكية أوتوماتيكية بهيكل من الستانلس ستيل ومينا هيكلي يكشف حركة التروس السويسرية.', descEn: 'Exquisite automatic timepiece featuring an open-worked skeleton dial and solid stainless steel bracelet.' },

  // CALVIN KLEIN
  { slug: 'calvin-klein-modern-cotton-sweatshirt', ar: 'سويت شيرت كالفن كلاين قطني مودرن', en: 'Calvin Klein Modern Cotton Crewneck', brand: 'calvin-klein', cat: 'mens-clothing', guide: 'adult-clothing', price: 920000, material: 'organic-cotton', colors: ['grey', 'black', 'white'], sizes: ['xs', 's', 'm', 'l', 'xl'], tags: ['core'], descAr: 'سويت شيرت من القطن الفرنسي الناعم بقصة مريحة وشعار كالفن كلاين البسيط على الصدر.', descEn: 'Soft French terry cotton crewneck sweatshirt with classic minimalist CK monogram chest print.' },
  { slug: 'calvin-klein-90s-straight-denim', ar: 'بنطال جينز كالفن كلاين كلاسيك مستقيم', en: 'Calvin Klein 90s Straight Vintage Denim', brand: 'calvin-klein', cat: 'mens-clothing', guide: 'adult-clothing', price: 1150000, compare: 1350000, material: 'organic-cotton', colors: ['blue', 'black'], sizes: ['s', 'm', 'l', 'xl'], featured: true, tags: ['sale', 'denim'], descAr: 'جينز قطني ثقيل مستوحى من تسعينات كالفن كلاين بقصة مستقيمة وجيوب كلاسيكية خماسية.', descEn: 'Vintage-inspired 90s straight leg jeans in rigid cotton denim with signature back pocket omega stitch.' },
  { slug: 'calvin-klein-minimalist-crossbody', ar: 'حقيبة كروس كالفن كلاين مدمجة وعصرية', en: 'Calvin Klein Minimalist Monogram Crossbody', brand: 'calvin-klein', cat: 'womens-bags', guide: null, price: 980000, material: 'full-grain-leather', colors: ['black', 'beige'], sizes: ['one-size'], tags: ['accessories'], descAr: 'حقيبة كروس خفيفة بحزام قابل للتعديل وسحاب علوي آمن وشعار CK المعدني.', descEn: 'Compact eco-leather crossbody bag with top zip closure and polished monogram hardware.' },

  // TOMMY HILFIGER
  { slug: 'tommy-hilfiger-puffer-jacket', ar: 'جاكيت بومبر مبطن دافئ تومي هيلفيغر', en: 'Tommy Hilfiger Down Padded Puffer Bomber', brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing', price: 2450000, compare: 2900000, material: 'recycled-down', colors: ['navy', 'black', 'red'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], featured: true, tags: ['winter', 'bestseller'], descAr: 'جاكيت بومبر مبطن بريش عازل معاد تدويره مقاوم للماء والرياح مع ألوان علم تومي المميزة.', descEn: 'Warm down-filled winter bomber jacket with water-resistant shell and signature Tommy flag embroidery.' },
  { slug: 'tommy-hilfiger-1985-oxford-shirt', ar: 'قميص أكسفورد تشكيلة 1985 تومي هيلفيغر', en: 'Tommy Hilfiger 1985 Oxford Stretch Shirt', brand: 'tommy-hilfiger', cat: 'mens-clothing', guide: 'adult-clothing', price: 1180000, material: 'organic-cotton', colors: ['white', 'blue', 'pink'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'قميص أكسفورد من القطن العضوي المرن بياقة بأزرار وتطريز علم تومي على الجيب.', descEn: 'Classic fit stretch organic-cotton Oxford shirt from the 1985 archive collection.' },
  { slug: 'tommy-hilfiger-leather-low-sneaker', ar: 'سنيكرز تومي هيلفيغر كلاسيك جلد منخفض', en: 'Tommy Hilfiger Core Leather Low-Top Sneaker', brand: 'tommy-hilfiger', cat: 'sneakers', guide: 'eu-footwear', price: 1380000, compare: 1600000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['sale'], descAr: 'سنيكرز جلد أبيض بشريط ألوان تومي الكلاسيكي (أحمر وأبيض وكحلي) ونعل مطاطي مريح.', descEn: 'Clean leather low-top sneaker featuring corporate stripe detailing along the side.' },
  { slug: 'tommy-hilfiger-classic-leather-belt', ar: 'حزام تومي هيلفيغر جلد طبيعي محفور', en: 'Tommy Hilfiger Denton Classic Leather Belt', brand: 'tommy-hilfiger', cat: 'eyewear-belts', guide: 'adult-clothing', price: 620000, material: 'full-grain-leather', colors: ['brown', 'black'], sizes: ['s', 'm', 'l', 'xl'], tags: ['accessories', 'core'], descAr: 'حزام من الجلد الطبيعي بإبزيم مستطيل مصقول وحلقة مزينة بعلم تومي هيلفيغر المطلي بالمينا.', descEn: 'Supple full-grain leather belt with brushed metal buckle and signature enameled flag keeper.' },
];

async function publish() {
  console.log('=== Starting Publishing World Brands Catalog ===\n');

  // 1. Upload Assets
  console.log('1. Uploading WebP Assets to Supabase Storage...');
  const assetDir = 'D:/Files/Programming_Projects/Euro Store/apps/web/public/media/owned';
  const uploads = [
    { local: `${assetDir}/home/hero.webp`, remote: 'owned/catalog-2026/home/hero.webp' },
    { local: `${assetDir}/home/hero-mobile.webp`, remote: 'owned/catalog-2026/home/hero-mobile.webp' },
    ...CATEGORIES_TREE.filter(c => c.img).map(c => ({ local: `${assetDir}/categories/${c.img}.webp`, remote: `owned/catalog-2026/categories/${c.img}.webp` })),
    ...BRANDS_LIST.map(b => ({ local: `${assetDir}/brands/${b.slug}.webp`, remote: `owned/catalog-2026/brands/${b.slug}.webp` })),
    ...PRODUCTS_DATA.map(p => ({ local: `${assetDir}/products/${p.slug}.webp`, remote: `owned/catalog-2026/products/${p.slug}.webp` })),
  ];

  for (const item of uploads) {
    try {
      const buffer = await readFile(item.local);
      const { error } = await bucket.upload(item.remote, buffer, { contentType: 'image/webp', upsert: true });
      if (error) console.error(`Error uploading ${item.remote}:`, error.message);
    } catch (e) {
      console.error(`Local read error ${item.local}:`, e.message);
    }
  }
  console.log(`Uploaded ${uploads.length} assets successfully.`);

  // 2. Seed Brands
  console.log('\n2. Seeding 12 Brands...');
  const brandRows = BRANDS_LIST.map(b => ({
    id: stableId('brand', b.slug),
    slug: b.slug,
    name: b.name,
    logo_url: `${url}/storage/v1/object/public/product-images/owned/catalog-2026/brands/${b.slug}.webp`,
    is_active: true,
  }));
  const { error: bErr } = await supabase.from('brands').upsert(brandRows, { onConflict: 'slug' });
  if (bErr) throw bErr;
  console.log(`Seeded ${brandRows.length} brands.`);

  // 3. Seed Size Guides
  console.log('\n3. Seeding Size Guides...');
  const sizeGuideRows = SIZE_GUIDES.map(g => ({
    id: stableId('size-guide', g.key),
    name: g.name,
    content: g.content,
  }));
  const { error: sgErr } = await supabase.from('size_guides').upsert(sizeGuideRows, { onConflict: 'id' });
  if (sgErr) throw sgErr;
  console.log(`Seeded ${sizeGuideRows.length} size guides.`);

  // 4. Seed Categories
  console.log('\n4. Seeding Categories...');
  const categoryRows = CATEGORIES_TREE.map(c => ({
    id: stableId('category', c.slug),
    slug: c.slug,
    name_ar: c.ar,
    name_en: c.en,
    parent_id: c.parent ? stableId('category', c.parent) : null,
    sort_order: c.order,
    size_guide_id: c.guide ? stableId('size-guide', c.guide) : null,
    image_url: c.img ? `${url}/storage/v1/object/public/product-images/owned/catalog-2026/categories/${c.img}.webp` : null,
    is_active: true,
  }));
  const { error: cErr } = await supabase.from('categories').upsert(categoryRows, { onConflict: 'slug' });
  if (cErr) throw cErr;
  console.log(`Seeded ${categoryRows.length} categories.`);

  // 5. Seed Attribute Types & Values
  console.log('\n5. Seeding Attribute Types & Values...');
  const typeRows = ATTRIBUTE_TYPES.map(t => ({
    id: stableId('attribute-type', t.slug),
    slug: t.slug,
    name_ar: t.ar,
    name_en: t.en,
  }));
  const { error: atErr } = await supabase.from('attribute_types').upsert(typeRows, { onConflict: 'slug' });
  if (atErr) throw atErr;

  const valueRows = ATTRIBUTE_VALUES.map(([type, key, valAr, valEn, hex], idx) => ({
    id: stableId('attribute-value', `${type}:${key}`),
    attribute_type_id: stableId('attribute-type', type),
    value_ar: valAr,
    value_en: valEn,
    hex_color: hex,
    sort_order: idx + 1,
  }));
  const { error: avErr } = await supabase.from('attribute_values').upsert(valueRows, { onConflict: 'id' });
  if (avErr) throw avErr;
  console.log(`Seeded ${valueRows.length} attribute values.`);

  // 6. Seed Products & Images & Variants
  console.log(`\n6. Seeding ${PRODUCTS_DATA.length} Products, Images, and Variants...`);
  const productRows = [];
  const imageRows = [];
  const variantRows = [];
  const variantAttrRows = [];

  for (const p of PRODUCTS_DATA) {
    const prodId = stableId('product', p.slug);
    const brandId = stableId('brand', p.brand);
    const catId = stableId('category', p.cat);
    const guideId = p.guide ? stableId('size-guide', p.guide) : null;
    const discountPct = p.compare ? Math.round(((p.compare - p.price) / p.compare) * 100) : 0;

    productRows.push({
      id: prodId,
      slug: p.slug,
      name_ar: p.ar,
      name_en: p.en,
      description_ar: p.descAr,
      description_en: p.descEn,
      brand_id: brandId,
      category_id: catId,
      size_guide_id: guideId,
      base_price: p.price,
      discount_percentage: discountPct > 0 ? discountPct : null,
      discount_start_at: discountPct > 0 ? new Date(Date.now() - 86400000).toISOString() : null,
      discount_end_at: discountPct > 0 ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
      is_featured: Boolean(p.featured),
      is_active: true,
      status: 'published',
      tags: p.tags,
    });

    // Product Image
    imageRows.push({
      id: stableId('product-image', p.slug),
      product_id: prodId,
      url: `${url}/storage/v1/object/public/product-images/owned/catalog-2026/products/${p.slug}.webp`,
      is_primary: true,
      sort_order: 1,
    });

    // Variants combinations
    const sizes = p.sizes || ['one-size'];
    const colors = p.colors || ['black'];
    let vCount = 0;

    for (const s of sizes) {
      for (const c of colors) {
        vCount++;
        const sku = `${p.slug}-${s}-${c}`.toUpperCase();
        const vId = stableId('variant', sku);

        variantRows.push({
          id: vId,
          product_id: prodId,
          sku: sku,
          price_syp: p.price,
          compare_price_syp: p.compare || null,
          stock_quantity: 25,
          is_active: true,
        });

        // Link Size Attribute
        variantAttrRows.push({
          variant_id: vId,
          attribute_value_id: stableId('attribute-value', `size:${s}`),
        });

        // Link Color Attribute
        variantAttrRows.push({
          variant_id: vId,
          attribute_value_id: stableId('attribute-value', `color:${c}`),
        });

        // Link Material Attribute
        if (p.material) {
          variantAttrRows.push({
            variant_id: vId,
            attribute_value_id: stableId('attribute-value', `material:${p.material}`),
          });
        }
      }
    }
  }

  // Upsert Products
  const { error: pErr } = await supabase.from('products').upsert(productRows, { onConflict: 'slug' });
  if (pErr) throw pErr;
  console.log(`Upserted ${productRows.length} products.`);

  // Upsert Images
  const { error: piErr } = await supabase.from('product_images').upsert(imageRows, { onConflict: 'id' });
  if (piErr) throw piErr;
  console.log(`Upserted ${imageRows.length} product images.`);

  // Deduplicate variants just in case
  const seenSkus = new Set();
  const uniqueVariants = [];
  for (const v of variantRows) {
    if (!seenSkus.has(v.sku)) {
      seenSkus.add(v.sku);
      uniqueVariants.push(v);
    }
  }

  // Upsert Variants
  const { error: vErr } = await supabase.from('product_variants').upsert(uniqueVariants, { onConflict: 'sku' });
  if (vErr) throw vErr;
  console.log(`Upserted ${uniqueVariants.length} product variants (SKUs).`);

  // Deduplicate variant attributes
  const seenAttr = new Set();
  const uniqueVariantAttrRows = [];
  for (const va of variantAttrRows) {
    const key = `${va.variant_id}:${va.attribute_value_id}`;
    if (!seenAttr.has(key)) {
      seenAttr.add(key);
      uniqueVariantAttrRows.push(va);
    }
  }

  // Upsert Variant Attributes
  const { error: vaErr } = await supabase.from('variant_attributes').upsert(uniqueVariantAttrRows, { onConflict: 'variant_id,attribute_value_id' });
  if (vaErr) console.warn('Variant attributes warning:', vaErr.message);
  console.log(`Linked ${uniqueVariantAttrRows.length} variant attribute pairs.`);

  // 7. Homepage Sections
  console.log('\n7. Updating Homepage Sections with 12 Brands and New Banners...');
  const allBrandIds = BRANDS_LIST.map(b => stableId('brand', b.slug));
  const heroDesktopUrl = `${url}/storage/v1/object/public/product-images/owned/catalog-2026/home/hero.webp`;
  const heroMobileUrl = `${url}/storage/v1/object/public/product-images/owned/catalog-2026/home/hero-mobile.webp`;

  const sections = [
    {
      id: stableId('homepage-section', 'main_banner'),
      section_key: 'main_banner',
      title_ar: 'البانر الرئيسي',
      title_en: 'Main Hero Banner',
      sort_order: 10,
      is_active: true,
      content: {
        banners: [
          {
            id: stableId('banner', 'hero-1'),
            image_url: heroDesktopUrl,
            mobile_image_url: heroMobileUrl,
            title_ar: 'تشكيلة الماركات العالمية 2026',
            title_en: 'World Iconic Brands 2026',
            subtitle_ar: 'نايك • أديداس • غوتشي • شانيل • زارا • لاكوست • بوما • بوس',
            subtitle_en: 'Nike • Adidas • Gucci • Chanel • Zara • Lacoste • Puma • BOSS',
            link_url: '/products',
            is_active: true,
            sort_order: 1,
          }
        ]
      }
    },
    {
      id: stableId('homepage-section', 'featured_brands'),
      section_key: 'featured_brands',
      title_ar: 'علامات مختارة',
      title_en: 'Featured Brands',
      sort_order: 20,
      is_active: true,
      content: {
        brand_ids: allBrandIds,
      }
    },
    {
      id: stableId('homepage-section', 'new_arrivals'),
      section_key: 'new_arrivals',
      title_ar: 'وصل حديثاً',
      title_en: 'New Arrivals',
      sort_order: 30,
      is_active: true,
      content: { limit: 12 }
    },
    {
      id: stableId('homepage-section', 'sales'),
      section_key: 'sales',
      title_ar: 'عروض حصرية وتخفيضات',
      title_en: 'Exclusive Offers & Sales',
      sort_order: 40,
      is_active: true,
      content: { limit: 12 }
    },
    {
      id: stableId('homepage-section', 'most_popular'),
      section_key: 'most_popular',
      title_ar: 'الأكثر طلباً وشهرة',
      title_en: 'Most Popular Icons',
      sort_order: 50,
      is_active: true,
      content: { limit: 12 }
    }
  ];

  const { error: hsErr } = await supabase.from('homepage_sections').upsert(sections, { onConflict: 'section_key' });
  if (hsErr) throw hsErr;
  console.log(`Updated ${sections.length} homepage sections with all 12 brands!`);

  // 8. Seed Collections
  console.log('\n8. Seeding Collections...');
  const collectionsData = [
    {
      slug: 'streetwear-icons',
      ar: 'أيقونات ستريت وير العالمية',
      en: 'Global Streetwear Icons',
      descAr: 'تشكيلة مختارة من أرقى سنيكرز وملابس نايك وأديداس وبوما الأصلية.',
      descEn: 'Curated selection of premier authentic Nike, Adidas and Puma streetwear.',
      products: ['nike-air-force-1-07', 'adidas-samba-classic', 'nike-tech-fleece-hoodie', 'adidas-gazelle-indoor', 'puma-suede-classic-xxi', 'reebok-club-c-85-vintage'],
      order: 10,
    },
    {
      slug: 'haute-couture-heritage',
      ar: 'تراث الفخامة الباريسية والإيطالية',
      en: 'Parisian & Italian Haute Couture',
      descAr: 'حقائب، عطور وأزياء خالدة من شانيل وغوتشي وزيارا الفاخرة.',
      descEn: 'Timeless luxury handbags, fragrances and apparel from Chanel, Gucci and Zara.',
      products: ['gucci-gg-marmont-shoulder-bag', 'chanel-classic-11-12-flap-bag', 'chanel-bleu-de-chanel-parfum', 'gucci-horsebit-1953-loafer', 'chanel-coco-mademoiselle', 'gucci-flora-gorgeous-gardenia'],
      order: 20,
    },
    {
      slug: 'executive-tailoring',
      ar: 'أناقة الأعمال والبدلات الراقية',
      en: 'Executive Tailoring & Smart Casual',
      descAr: 'بدلات بوس الفاخرة، قمصان بولو لاكوست، وأزياء تومي هيلفيغر الكلاسيكية.',
      descEn: 'Fine virgin wool BOSS suits, iconic Lacoste polos, and Tommy Hilfiger classics.',
      products: ['boss-slim-fit-stretch-suit', 'lacoste-l1212-classic-polo', 'boss-skeleton-automatic-watch', 'tommy-hilfiger-1985-oxford-shirt', 'zara-tailored-textured-blazer', 'lacoste-carnaby-leather-sneaker'],
      order: 30,
    },
  ];

  for (const col of collectionsData) {
    const colId = stableId('collection', col.slug);
    await supabase.from('collections').upsert({
      id: colId,
      slug: col.slug,
      name_ar: col.ar,
      name_en: col.en,
      description_ar: col.descAr,
      description_en: col.descEn,
      is_featured: true,
      sort_order: col.order,
      is_active: true,
    }, { onConflict: 'slug' });

    const colProducts = col.products.map((pSlug, idx) => ({
      collection_id: colId,
      product_id: stableId('product', pSlug),
      sort_order: idx + 1,
    }));
    await supabase.from('collection_products').upsert(colProducts, { onConflict: 'collection_id,product_id' });
  }
  console.log(`Seeded ${collectionsData.length} curated collections.`);

  // 9. Seed Bundles
  console.log('\n9. Seeding Bundles...');
  const bundlesData = [
    {
      slug: 'nike-tech-pack',
      ar: 'طقم نايك تيك فليس الشتوي الكامل',
      en: 'Nike Tech Fleece Winter Full Pack',
      descAr: 'يشمل هودي تيك فليس وبنطال جوغرز وسنيكرز إير فورس 1 بسعر مجموعة مخفض.',
      descEn: 'Includes Tech Fleece Hoodie, Joggers and Air Force 1 at special pack price.',
      price: 3450000,
      products: ['nike-tech-fleece-hoodie', 'nike-club-fleece-joggers', 'nike-air-force-1-07'],
    },
    {
      slug: 'chanel-luxury-duo',
      ar: 'مجموعة شانيل الفاخرة',
      en: 'Chanel Ultimate Luxury Duo',
      descAr: 'عطر بلو دي شانيل بارفان الفاخر مع محفظة بوي شانيل الجلدية الأصلية.',
      descEn: 'Bleu de Chanel Parfum paired with Boy Chanel Long Flap Wallet.',
      price: 4300000,
      products: ['chanel-bleu-de-chanel-parfum', 'chanel-boy-chanel-long-wallet'],
    },
    {
      slug: 'boss-executive-set',
      ar: 'طقم بوس التنفيذي المتكامل',
      en: 'BOSS Executive Suit & Scent Set',
      descAr: 'بدلة صوف بكر فاخرة مع بولو بالاس وعطر بوس بوتلد إنتنس وساعة هيكلية.',
      descEn: 'Virgin wool suit, piqué polo, Bottled EDP and Skeleton Automatic Watch.',
      price: 8900000,
      products: ['boss-slim-fit-stretch-suit', 'boss-pallas-pique-polo', 'boss-bottled-eau-de-parfum', 'boss-skeleton-automatic-watch'],
    },
  ];

  for (const bnd of bundlesData) {
    const bndId = stableId('bundle', bnd.slug);
    await supabase.from('bundles').upsert({
      id: bndId,
      slug: bnd.slug,
      name_ar: bnd.ar,
      name_en: bnd.en,
      description_ar: bnd.descAr,
      description_en: bnd.descEn,
      price_syp: bnd.price,
      is_active: true,
    }, { onConflict: 'slug' });

    const bndProducts = bnd.products.map((pSlug, idx) => ({
      bundle_id: bndId,
      product_id: stableId('product', pSlug),
      quantity: 1,
      sort_order: idx + 1,
    }));
    await supabase.from('bundle_items').upsert(bndProducts, { onConflict: 'bundle_id,product_id' });
  }
  console.log(`Seeded ${bundlesData.length} luxury bundles.`);

  console.log('\n=== CATALOG PUBLISHED SUCCESSFULLY 100%! ===');
}

publish().catch(console.error);

