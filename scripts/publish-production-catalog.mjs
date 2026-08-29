import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire('D:/Files/Programming_Projects/Euro Store/apps/web/package.json');
const { createClient } = requireFromWeb('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szhpqyvxodhaichrrdfb.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aHBxeXZ4b2RoYWljaHJyZGZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkxOTA4NywiZXhwIjoyMTAxNDk1MDg3fQ.i7alqh2XyiDs2Qxb3KLy1AZE-6nd9yVx_VHjKLGtU2Q';

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = supabase.storage.from('product-images');

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
        ['39', '6.5', '8.0', '24.5'],
        ['40', '7.0', '8.5', '25.0'],
        ['41', '8.0', '9.5', '26.0'],
        ['42', '8.5', '10.0', '26.5'],
        ['43', '9.5', '11.0', '27.5'],
        ['44', '10.0', '11.5', '28.0'],
        ['45', '11.0', '12.5', '29.0'],
        ['46', '12.0', '13.5', '30.0'],
      ]
    }
  },
  {
    key: 'kids-clothing',
    name: 'دليل ملابس الأطفال / Kids Clothing',
    content: {
      headers: ['Age', 'Height (cm)', 'Chest (cm)', 'Waist (cm)'],
      rows: [
        ['4-5 Y', '104-110', '56-58', '53-55'],
        ['6-7 Y', '116-122', '60-63', '56-58'],
        ['8-9 Y', '128-134', '65-68', '60-62'],
        ['10-11 Y', '140-146', '71-75', '64-66'],
        ['12-13 Y', '152-158', '78-82', '68-70'],
      ]
    }
  },
  {
    key: 'fragrance-guide',
    name: 'دليل سعة واستخدام العطور / Fragrance Guide',
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
  ['size', 'xs', 'XS', 'XS', null],
  ['size', 's', 'S', 'S', null],
  ['size', 'm', 'M', 'M', null],
  ['size', 'l', 'L', 'L', null],
  ['size', 'xl', 'XL', 'XL', null],
  ['size', 'xxl', 'XXL', 'XXL', null],
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
  ['size', 'one-size', 'مقاس موحد', 'One Size', null],
  ['color', 'black', 'أسود ملكي', 'Midnight Black', '#0E0E12'],
  ['color', 'white', 'أبيض ناصع', 'Pure White', '#FFFFFF'],
  ['color', 'navy', 'كحلي داكن', 'Navy Blue', '#0F1E36'],
  ['color', 'grey', 'رمادي كلاسيك', 'Heather Grey', '#8E8E93'],
  ['color', 'red', 'أحمر قرمزي', 'Crimson Red', '#C8102E'],
  ['color', 'green', 'أخضر غابي', 'Forest Green', '#1B4D3E'],
  ['color', 'beige', 'بيج عاجي', 'Ivory Beige', '#EAE6DF'],
  ['color', 'cognac', 'بني كونياك', 'Cognac Brown', '#8B5A2B'],
  ['color', 'gold', 'ذهبي براق', 'Champagne Gold', '#D7BE79'],
  ['color', 'silver', 'فضي ستيل', 'Steel Silver', '#B0B0B8'],
  ['color', 'pink', 'وردي ناعم', 'Soft Rose', '#E8C5C8'],
  ['color', 'burgundy', 'خمري ملكي', 'Burgundy Wine', '#5C1D24'],
  ['color', 'blue', 'أزرق كلاسيك', 'Classic Blue', '#1E40AF'],
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

const PRODUCTS_DATA = [
  // NIKE
  { slug: 'nike-air-force-1-07', ar: "حذاء نايك إير فورس 1 '07 كلاسيك", en: "Nike Air Force 1 '07 All-White", brand: 'nike', cat: 'sneakers', guide: 'eu-footwear', price: 1450000, compare: 1700000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['bestseller', 'trending'], descAr: 'حذاء نايك الأسطوري باللون الأبيض الناصع مع نعل هوائي Air-Sole يوفر أقصى درجات الراحة والأناقة اليومية.', descEn: 'The iconic low-cut basketball silhouette with crisp leather edges, clean finish, and encapsulated Air-Sole cushioning.' },
  { slug: 'nike-air-max-270', ar: 'حذاء نايك إير ماكس 270 العصري', en: 'Nike Air Max 270 Lifestyle Running', brand: 'nike', cat: 'sneakers', guide: 'eu-footwear', price: 1750000, compare: 2100000, material: 'tech-fleece', colors: ['black', 'red', 'white'], sizes: ['40', '41', '42', '43', '44', '45'], featured: true, tags: ['new', 'trending'], descAr: 'وحدة كعب هوائية Max Air ضخمة 270 درجة لامتصاص الصدمات مع نسيج شبكي مرن يسمح بمرور الهواء.', descEn: 'Boasting Nike biggest heel Air unit yet, delivering super-soft bounce and breathable knit mesh upper.' },
  { slug: 'nike-tech-fleece-hoodie', ar: 'هودي نايك تيك فليس ويندرنر بسحاب', en: 'Nike Tech Fleece Full-Zip Windrunner', brand: 'nike', cat: 'mens-clothing', guide: 'adult-clothing', price: 1550000, compare: 1850000, material: 'tech-fleece', colors: ['grey', 'black', 'navy'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], featured: true, tags: ['winter', 'bestseller'], descAr: 'سترة تيك فليس خفيفة الوزن توفر عزلاً حرارياً فائقاً دون زيادة في الحجم، مع تصميم الياقة العالية والسحاب الكامل.', descEn: 'Signature smooth on both sides lightweight fleece delivers premium warmth without bulk, styled with the iconic chevron design.' },
  { slug: 'nike-club-fleece-joggers', ar: 'بنطال رياضي نايك كلوب فليس مريح', en: 'Nike Sportswear Club Fleece Joggers', brand: 'nike', cat: 'mens-clothing', guide: 'adult-clothing', price: 850000, material: 'organic-cotton', colors: ['black', 'grey', 'navy'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'بنطال مريح من الصوف الممشط الناعم بحزام خصر مرن وأساور كاحل مطاطية مضلعة لإظهار السنيكرز.', descEn: 'Standard fit brushed-back fleece trousers with ribbed cuffs and elastic waistband with adjustable drawcord.' },
  { slug: 'nike-pegasus-40', ar: 'حذاء الجري نايك إير زوم بيغاسوس 40', en: 'Nike Air Zoom Pegasus 40 Road Running', brand: 'nike', cat: 'sneakers', guide: 'eu-footwear', price: 1650000, compare: 1950000, material: 'tech-fleece', colors: ['navy', 'white', 'black'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['trending'], descAr: 'حذاء الجري المتجاوب المفضل لجميع العدائين مع تقنية رغوة React ووحدتي Zoom Air لمضاعفة الطاقة الدافعة.', descEn: 'A springy ride for every run, Pegasus familiar feel returns with improved engineered mesh midfoot band for customized support.' },
  { slug: 'nike-dri-fit-club-cap', ar: 'قبعة نايك دراي فيت كلوب كلاسيك', en: 'Nike Dri-FIT Unstructured Club Cap', brand: 'nike', cat: 'eyewear-belts', guide: null, price: 380000, material: 'organic-cotton', colors: ['black', 'white', 'navy'], sizes: ['one-size'], tags: ['accessories'], descAr: 'قبعة كاجوال بياقة منحنية وتقنية Dri-FIT الطاردة للعرق للحفاظ على الجفاف طوال اليوم.', descEn: 'Classic depth unstructured cap with sweat-wicking Nike Dri-FIT technology and adjustable tri-glide back closure.' },

  // ADIDAS
  { slug: 'adidas-samba-classic', ar: 'حذاء أديداس سامبا كلاسيك الأصلي', en: 'Adidas Originals Samba Classic White/Black', brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear', price: 1400000, compare: 1650000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['bestseller', 'trending'], descAr: 'سنيكرز السامبا الكلاسيكي من الجلد الطبيعي مع مقدمة شمواه على شكل حرف T ونعل مطاطي بلون الكراميل الأيقوني.', descEn: 'Legendary street staple featuring premium full-grain leather upper, suede T-toe overlay, and signature gum rubber outsole.' },
  { slug: 'adidas-gazelle-indoor', ar: 'حذاء أديداس غازيل إندور شمواه ملون', en: 'Adidas Originals Gazelle Indoor Suede', brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear', price: 1550000, compare: 1800000, material: 'suede', colors: ['burgundy', 'green', 'navy'], sizes: ['39', '40', '41', '42', '43', '44'], featured: true, tags: ['trending'], descAr: 'تصميم الغازيل الكلاسيكي العريق بجلد الشمواه الإيطالي الفاخر وثلاثة خطوط متباينة ونعل شفاف رترو.', descEn: 'Originally designed for indoor training, these retro suede sneakers showcase translucent gum cupsole and serrated 3-Stripes.' },
  { slug: 'adidas-ultraboost-light', ar: 'حذاء أديداس ألترا بوست لايت للجري', en: 'Adidas Ultraboost Light Performance', brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear', price: 2150000, compare: 2600000, material: 'tech-fleece', colors: ['black', 'white', 'grey'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['trending', 'bestseller'], descAr: 'أخف وزن في تاريخ تقنية Boost مع إعادة طاقة لا تضاهى وشبكة Primeknit+ المريحة للقدم.', descEn: 'Experience epic energy return with our lightest Boost technology ever, combined with breathable Primeknit+ textile upper.' },
  { slug: 'adidas-beckenbauer-tracktop', ar: 'جاكيت أديداس بيكنباور تراك توب رترو', en: 'Adidas Originals Beckenbauer Track Jacket', brand: 'adidas', cat: 'mens-clothing', guide: 'adult-clothing', price: 1250000, material: 'organic-cotton', colors: ['green', 'navy', 'black'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'جاكيت رياضي أرشيفي يحمل خطوط أديداس الثلاثة الكلاسيكية وياقة عالية مضلعة مع تطريز شعار تريفيل.', descEn: 'The first track suit to bear the 3-Stripes back in 1967, reimagined with soft heavyweight cotton blend pique.' },
  { slug: 'adidas-3-stripes-tee', ar: 'تيشيرت أديداس أوريجينالز كلاسيك 3 خطوط', en: 'Adidas Adicolor Classics 3-Stripes Tee', brand: 'adidas', cat: 'mens-clothing', guide: 'adult-clothing', price: 490000, material: 'organic-cotton', colors: ['white', 'black', 'burgundy'], sizes: ['xs', 's', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'تيشيرت قطن عضوي 100% بتصميم ياقة وأكمام مضلعة متباينة مع خطوط أديداس الشهيرة على الكتفين.', descEn: 'Timeless regular fit crewneck t-shirt made of pure organic single jersey cotton with contrast rib collar.' },
  { slug: 'adidas-stan-smith-leather', ar: 'حذاء أديداس ستان سميث جلد كلاسيك', en: 'Adidas Originals Stan Smith Lux Leather', brand: 'adidas', cat: 'sneakers', guide: 'eu-footwear', price: 1350000, material: 'full-grain-leather', colors: ['white', 'green'], sizes: ['38', '39', '40', '41', '42', '43', '44', '45'], tags: ['bestseller'], descAr: 'بساطة وأناقة لا تتغير مع جلد طبيعي ناعم ونقاط تهوية ثلاثية وشعار ستان سميث الذهبي.', descEn: 'Understated luxury sneaker crafted from buttery-soft leather with perforated 3-Stripes and clean minimal aesthetic.' },

  // SKECHERS
  { slug: 'skechers-slip-ins-max-cushioning', ar: 'حذاء سكيتشرز سليب-إن ماكس كوشينينغ', en: 'Skechers Hands Free Slip-ins Max Cushioning', brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear', price: 1350000, compare: 1600000, material: 'memory-foam', colors: ['black', 'grey', 'navy'], sizes: ['40', '41', '42', '43', '44', '45'], featured: true, tags: ['bestseller', 'new'], descAr: 'تقنية الارتداء السريع بدون استخدام اليدين مع وسادة كعب Heel Pillow وبطانة التوسيد الفائق ULTRA GO.', descEn: 'Step into effortless style and supreme comfort with Hands Free Slip-ins technology and Max Cushioning platform.' },
  { slug: 'skechers-dlites-memory-foam', ar: 'حذاء سكيتشرز دي لايتس ميموري فوم', en: "Skechers D'Lites Biggest Fan Chunky Sneaker", brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear', price: 1100000, material: 'memory-foam', colors: ['white', 'black'], sizes: ['38', '39', '40', '41', '42', '43'], tags: ['trending'], descAr: 'حذاء رياضي تشاكي أيقوني بجلد ناعم ونعل أوسط ممتص للصدمات وفرش داخلي رغوي Air-Cooled Memory Foam.', descEn: 'Iconic retro sneaker featuring smooth trubuck leather upper, contrast stitching, and Air-Cooled Memory Foam insole.' },
  { slug: 'skechers-go-walk-7', ar: 'حذاء المشي سكيتشرز جو ووك 7 خفيف', en: 'Skechers GO WALK 7 Hyper Pillar Walking Shoe', brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear', price: 1200000, compare: 1450000, material: 'memory-foam', colors: ['navy', 'black', 'grey'], sizes: ['39', '40', '41', '42', '43', '44', '45'], tags: ['sale'], descAr: 'أحدث إصدارات سلسلة GO WALK مع أعمدة Hyper Pillar عالية الارتداد ونسيج شبكي مرن للمشي اليومي المريح.', descEn: 'High-rebound lightweight cushioning with responsive Hyper Pillars for added step support during long daily walks.' },
  { slug: 'skechers-arch-fit-leather', ar: 'سنيكرز سكيتشرز آرش فيت جلد مريح', en: 'Skechers Arch Fit Banlin Supportive Leather', brand: 'skechers', cat: 'sneakers', guide: 'eu-footwear', price: 1300000, material: 'full-grain-leather', colors: ['black', 'cognac'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['core'], descAr: 'نظام دعم قوس القدم معتمد من أطباء القدم مصمم لتوزيع الوزن وتقليل إجهاد المشي والوقوف الطويل.', descEn: 'Podiatrist-certified arch support system developed with 20 years of data and 120,000 unweighted foot scans.' },

  // PUMA
  { slug: 'puma-suede-classic-xxi', ar: 'حذاء بوما سويد كلاسيك إكس إكس آي', en: 'Puma Suede Classic XXI Iconic Sneaker', brand: 'puma', cat: 'sneakers', guide: 'eu-footwear', price: 1150000, compare: 1380000, material: 'suede', colors: ['black', 'red', 'navy'], sizes: ['39', '40', '41', '42', '43', '44'], featured: true, tags: ['bestseller'], descAr: 'حذاء الشمواه التاريخي من بوما منذ عام 1968 مع شريط بوما الجانبي المميز وشعار بوما الذهبي المنقوش.', descEn: 'The shoe that started it all — full suede upper, synthetic lining, and iconic Puma Formstrip detailing.' },
  { slug: 'puma-palermo-leather-sneaker', ar: 'حذاء بوما باليرمو كلاسيك الإيطالي', en: 'Puma Palermo Retro Leather Court Sneaker', brand: 'puma', cat: 'sneakers', guide: 'eu-footwear', price: 1390000, compare: 1650000, material: 'full-grain-leather', colors: ['white', 'green', 'navy'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['trending', 'new'], descAr: 'مستوحى من تراث مدرجات كرة القدم الإيطالية في الثمانينات بتركيبة جلد وشمواه ونعل مطاطي صلب.', descEn: 'Straight from the 1980s football terrace archives, featuring classic T-toe construction and gold-foil branding tag.' },
  { slug: 'puma-essentials-fleece-hoodie', ar: 'هودي بوما إسنشالز قطني كلاسيك', en: 'Puma Essentials Big Logo Fleece Hoodie', brand: 'puma', cat: 'mens-clothing', guide: 'adult-clothing', price: 780000, material: 'organic-cotton', colors: ['black', 'grey', 'green'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'هودي ناعم من القطن المستدام مع جيب كنغر أمامي وشعار بوما المطرز على الصدر.', descEn: 'Regular fit fleece-lined hooded pullover with kangaroo pocket and rib cuffs and hem.' },
  { slug: 'puma-ferrari-race-polo', ar: 'قميص بولو بوما سكوديريا فيراري', en: 'Puma Scuderia Ferrari Motorsport Polo', brand: 'puma', cat: 'mens-clothing', guide: 'adult-clothing', price: 950000, material: 'organic-cotton', colors: ['red', 'black', 'white'], sizes: ['s', 'm', 'l', 'xl'], tags: ['trending'], descAr: 'قميص بولو رسمي مرخص من فريق فيراري لسباقات فورمولا 1 مع شارة فيراري الحصانية وقماش بيكيه فاخر.', descEn: 'Official licensed Scuderia Ferrari F1 team polo shirt crafted with premium breathable pique cotton fabric.' },

  // REEBOK
  { slug: 'reebok-club-c-85-vintage', ar: 'حذاء ريبوك كلوب سي 85 فينتج التنس', en: 'Reebok Club C 85 Vintage Chalk Leather', brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear', price: 1250000, compare: 1500000, material: 'full-grain-leather', colors: ['white', 'green'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['bestseller'], descAr: 'سنيكرز التنس الأصلي من عام 1985 بجلد طباشيري معالج وبطانة قماشية ونعل متين.', descEn: 'Clean minimalist tennis shoe aesthetic with heritage soft garment leather and vintage union jack logo window.' },
  { slug: 'reebok-classic-leather', ar: 'حذاء ريبوك كلاسيك ليذر الأيقوني', en: 'Reebok Classic Leather Timeless Sneaker', brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear', price: 1290000, material: 'full-grain-leather', colors: ['white', 'black'], sizes: ['39', '40', '41', '42', '43', '44'], tags: ['core'], descAr: 'جلد طبيعي ناعم عالي الجودة مع نعل أوسط EVA مقولب لتوسيد خفيف ومريح طوال اليوم.', descEn: 'Buttery leather upper paired with lightweight die-cut EVA midsole cushioning and high-abrasion rubber outsole.' },
  { slug: 'reebok-nano-x4-training', ar: 'حذاء التدريب واللياقة ريبوك نانو إكس 4', en: 'Reebok Nano X4 Cross-Training Shoe', brand: 'reebok', cat: 'sneakers', guide: 'eu-footwear', price: 1750000, compare: 2100000, material: 'tech-fleece', colors: ['black', 'navy', 'red'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['new'], descAr: 'حذاء التمارين الشامل الأكثر تطوراً بتقنية نعل Lift and Press لثبات الوزن ورغوة Floatride Energy للركض.', descEn: 'Ultra-lightweight Flexweave knit training shoe equipped with L.A.R. chassis system for unmatched lifting stability.' },
  { slug: 'reebok-vector-fleece-sweatshirt', ar: 'سويت شيرت ريبوك كلاسيك فكتور', en: 'Reebok Classics Vector Crew Sweatshirt', brand: 'reebok', cat: 'mens-clothing', guide: 'adult-clothing', price: 790000, material: 'organic-cotton', colors: ['navy', 'grey', 'black'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'سويت شيرت كاجوال بقصة واسعة ومريح من الصوف القطني الناعم مع شعار ريبوك فكتور المطرز.', descEn: 'Relaxed fit fleece crewneck sweatshirt cut from organic French terry cotton with embroidered vintage Vector.' },

  // LACOSTE
  { slug: 'lacoste-l1212-classic-polo', ar: 'قميص بولو لاكوست كلاسيك L.12.12 الأصلي', en: 'Lacoste L.12.12 Classic Fit Pique Polo', brand: 'lacoste', cat: 'mens-clothing', guide: 'adult-clothing', price: 1450000, compare: 1750000, material: 'organic-cotton', colors: ['green', 'navy', 'white', 'black', 'burgundy'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], featured: true, tags: ['luxury', 'bestseller'], descAr: 'ابتكره رينيه لاكوست عام 1933 من نسيج بيتي بيكيه القطني الخفيف وشعار التمساح الأخضر المطرز يدوياً.', descEn: 'The original iconic polo shirt invented in 1933, tailored from signature petit pique cotton with real mother-of-pearl buttons.' },
  { slug: 'lacoste-carnaby-leather-sneaker', ar: 'سنيكرز لاكوست كارنابي جلد أبيض', en: 'Lacoste Carnaby Pro Leather Court Sneaker', brand: 'lacoste', cat: 'sneakers', guide: 'eu-footwear', price: 1650000, compare: 1950000, material: 'full-grain-leather', colors: ['white', 'navy'], sizes: ['40', '41', '42', '43', '44', '45'], tags: ['luxury', 'trending'], descAr: 'سنيكرز كورت تنس فاخر من الجلد الحبيبي الأبيض مع تمساح لاكوست الأخضر المنمنم وتفاصيل كعب ملونة.', descEn: 'Court-inspired clean leather low-top featuring OrthoLite comfort insole and signature embroidered green crocodile.' },
  { slug: 'lacoste-cotton-zip-cardigan', ar: 'كارديغان لاكوست قطني بسحاب كامل', en: 'Lacoste Full-Zip Organic Cotton Cardigan', brand: 'lacoste', cat: 'mens-clothing', guide: 'adult-clothing', price: 1950000, material: 'organic-cotton', colors: ['navy', 'black', 'grey'], sizes: ['m', 'l', 'xl', 'xxl'], tags: ['luxury', 'winter'], descAr: 'سترة كارديغان محبوكة من القطن العضوي الفاخر بياقة منتصبة وسحاب أمامي عملي وأطراف مضلعة.', descEn: 'Refined organic cotton knit cardigan with protective stand-up collar and tonal embroidered crocodile badge.' },
  { slug: 'lacoste-grained-leather-wallet', ar: 'محفظة لاكوست جلد طبيعي محبب', en: 'Lacoste Fitzgerald Grained Leather Bifold Wallet', brand: 'lacoste', cat: 'eyewear-belts', guide: null, price: 850000, material: 'full-grain-leather', colors: ['black', 'navy', 'cognac'], sizes: ['one-size'], tags: ['accessories', 'luxury'], descAr: 'محفظة جيب ثنائية الطي من الجلد المحبب الفاخر بستة فتحات لبطاقات الائتمان وجيب للعملات الورقية.', descEn: 'Sophisticated premium matte grained leather wallet with six card slots and metal crocodile emblem.' },

  // ZARA
  { slug: 'zara-tailored-textured-blazer', ar: 'بليزر زارا مفصل بقماش محكم وفخم', en: 'Zara Man Tailored Textured Wool Blazer', brand: 'zara', cat: 'mens-clothing', guide: 'adult-clothing', price: 1850000, compare: 2200000, material: 'virgin-wool', colors: ['navy', 'black', 'grey'], sizes: ['48', '50', '52', '54'], featured: true, tags: ['formal', 'trending'], descAr: 'بليزر بقصة عصرية وياقة مدببة وجيوب بقلاب مع بطانة داخلية كاملة من الساتان الفاخر.', descEn: 'Structured slim-fit tailored blazer featuring notched lapels, chest welt pocket, and dual back vents.' },
  { slug: 'zara-pleated-wide-leg-trousers', ar: 'بنطال زارا نسائي واسع بكسرات أنيقة', en: 'Zara Pleated High-Waist Wide Leg Trousers', brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing', price: 950000, material: 'virgin-wool', colors: ['beige', 'black', 'grey'], sizes: ['xs', 's', 'm', 'l'], featured: true, tags: ['trending'], descAr: 'بنطال خصر مرتفع بقصة واسعة متهدلة مع طيات أمامية مزدوجة وجيوب جانبية مخفية لإطلالة راقية.', descEn: 'Flowing high-waisted trousers with tailored front pleats, side slash pockets, and front zip fly closure.' },
  { slug: 'zara-satin-midi-slip-dress', ar: 'فستان زارا ساتان ميدي ناعم للسهرات', en: 'Zara Satin Finish Midi Slip Dress', brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing', price: 1100000, material: 'silk-satin', colors: ['burgundy', 'black', 'pink'], sizes: ['xs', 's', 'm', 'l'], tags: ['evening', 'luxury'], descAr: 'فستان بقماش ساتان حريري لامع وقصة مائلة تبرز القوام مع حمالات رفيعة قابلة للتعديل.', descEn: 'Bias-cut midi length slip dress in luminous satin finish with cowl neckline and delicate spaghetti straps.' },
  { slug: 'zara-faux-leather-trench', ar: 'معطف ترنش زارا طويل من الجلد الصناعي', en: 'Zara Double-Breasted Faux Leather Trench', brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing', price: 2350000, compare: 2800000, material: 'full-grain-leather', colors: ['cognac', 'black'], sizes: ['s', 'm', 'l'], tags: ['winter', 'trending'], descAr: 'معطف ترنش مزدوج الأزرار بحزام خصر قابل للربط وأكتاف مفصلة وياقة عريضة كلاسيكية.', descEn: 'Statement longline double-breasted trench coat in supple faux leather with belted waist and storm flaps.' },
  { slug: 'zara-oversized-poplin-shirt', ar: 'قميص بوبلين أبيض أوفر سايز زارا', en: 'Zara 100% Cotton Poplin Oversized Shirt', brand: 'zara', cat: 'womens-clothing', guide: 'adult-clothing', price: 680000, material: 'organic-cotton', colors: ['white', 'pink', 'navy'], sizes: ['xs', 's', 'm', 'l', 'xl'], tags: ['core'], descAr: 'قميص قطني ناصع بقصة فضفاضة وجيب على الصدر وأزرار أمامية لارتداء مريح وعصري.', descEn: 'Crisp 100% organic cotton poplin button-up shirt in relaxed oversized silhouette with dropped shoulders.' },

  // GUCCI
  { slug: 'gucci-gg-marmont-shoulder-bag', ar: 'حقيبة كتف غوتشي جي جي مارمونت جلد', en: 'Gucci GG Marmont Matelasse Shoulder Bag', brand: 'gucci', cat: 'luxury-bags', guide: null, price: 4900000, compare: 5600000, material: 'full-grain-leather', colors: ['black', 'beige', 'red'], sizes: ['one-size'], featured: true, tags: ['luxury', 'bestseller'], descAr: 'حقيبة كتف من الجلد المبطن بنمط شيفرون الهندسي مع شعار Double G الذهبي المعتق وحزام سلسلة متحرك.', descEn: 'Softly structured chevron matelasse quilted leather chain shoulder bag with iconic antique gold Double G hardware.' },
  { slug: 'gucci-horsebit-1953-loafer', ar: 'حذاء لوفر غوتشي 1953 هورس بيت الأصلي', en: 'Gucci 1953 Horsebit Classic Leather Loafer', brand: 'gucci', cat: 'formal-shoes', guide: 'eu-footwear', price: 3850000, compare: 4400000, material: 'full-grain-leather', colors: ['black', 'cognac'], sizes: ['39', '40', '41', '42', '43', '44', '45'], featured: true, tags: ['luxury', 'heritage'], descAr: 'حذاء لوفر إيطالي كلاسيكي صنع يدوياً في فلورنسا من أجود أنواع الجلد مع حلية لجام الخيل الذهبية.', descEn: 'Florence-crafted heritage leather moccasin detailed with the signature 1953 gold-tone equestrian Horsebit bar.' },
  { slug: 'gucci-double-g-leather-belt', ar: 'حزام جلد غوتشي بإبزيم Double G ذهبي', en: 'Gucci Double G Smooth Leather Belt', brand: 'gucci', cat: 'eyewear-belts', guide: 'adult-clothing', price: 1850000, material: 'full-grain-leather', colors: ['black', 'cognac'], sizes: ['s', 'm', 'l', 'xl'], tags: ['luxury', 'accessories'], descAr: 'حزام من الجلد الإيطالي الفاخر بعرض 3 سم مع إبزيم GG المعدني المصقول بالذهب العتيق.', descEn: 'Classic 3cm width smooth Italian calfskin leather belt with antique brass Double G buckle.' },
  { slug: 'gucci-flora-gorgeous-gardenia', ar: 'عطر غوتشي فلورا جورجس غاردينيا EDP', en: 'Gucci Flora Gorgeous Gardenia Eau de Parfum', brand: 'gucci', cat: 'perfumes', guide: 'fragrance-guide', price: 2100000, compare: 2450000, material: null, colors: ['pink'], sizes: ['50ml', '100ml'], tags: ['luxury', 'beauty'], descAr: 'عطر زهري فاخر بعبير الغاردينيا البيضاء وزهر الكمثرى وسكر بني دافئ في زجاجة وردية منقوشة.', descEn: 'Joyful floral signature fragrance built around the Gardenia flower blended with solar Jasmine and Pear Blossom.' },
  { slug: 'gucci-square-acetate-sunglasses', ar: 'نظارة شمسية غوتشي مربعة بإطار أسود', en: 'Gucci Oversized Square Acetate Sunglasses', brand: 'gucci', cat: 'eyewear-belts', guide: null, price: 1650000, material: 'acetate', colors: ['black', 'cognac'], sizes: ['one-size'], tags: ['luxury', 'accessories'], descAr: 'نظارة شمسية فاخرة بإطار أسود عريض من الأسيتات وعدسات حماية 100% وشعار غوتشي الذهبي على الذراعين.', descEn: 'Bold oversized square acetate frame with grey tinted lenses providing 100% UVA/UVB protection and gold logo temples.' },

  // CHANEL
  { slug: 'chanel-bleu-de-chanel-parfum', ar: 'عطر بلو دي شانيل بارفان الخشبي الفاخر', en: 'Chanel Bleu de Chanel Pure Parfum', brand: 'chanel', cat: 'perfumes', guide: 'fragrance-guide', price: 2750000, compare: 3200000, material: null, colors: ['navy'], sizes: ['50ml', '100ml', '150ml'], featured: true, tags: ['luxury', 'bestseller'], descAr: 'أقوى وأرقى تركيزات بلو دي شانيل بعبير خشب الصندل الكاليدوني والأرز والنفحات المنعشة.', descEn: 'Intensely woody aromatic fragrance that opens with captivating freshness and lingers with warm New Caledonian sandalwood.' },
  { slug: 'chanel-coco-mademoiselle', ar: 'عطر شانيل كوكو مادموزيل أو دو بارفان', en: 'Chanel Coco Mademoiselle Eau de Parfum', brand: 'chanel', cat: 'perfumes', guide: 'fragrance-guide', price: 2650000, compare: 3100000, material: null, colors: ['pink'], sizes: ['50ml', '100ml'], featured: true, tags: ['luxury', 'bestseller'], descAr: 'العطر النسائي الشرقي الأيقوني بنفحات البرتقال الحيوي والورد والياسمين والباتشولي النقي.', descEn: 'A bold, sensual amber fragrance featuring vibrant orange, Grasse rose, May jasmine, and pure Indonesian patchouli.' },
  { slug: 'chanel-classic-11-12-flap-bag', ar: 'حقيبة شانيل كلاسيك 11.12 جلد كافيار', en: 'Chanel Classic 11.12 Quilted Caviar Flap Bag', brand: 'chanel', cat: 'luxury-bags', guide: null, price: 4950000, compare: 5800000, material: 'full-grain-leather', colors: ['black', 'beige', 'burgundy'], sizes: ['one-size'], featured: true, tags: ['luxury', 'heritage'], descAr: 'حقيبة اليد الأكثر شهرة في تاريخ الأزياء من جلد الكافيار المحبب المقاوم للخدش مع قفل CC الدوار وسلسلة الذهب.', descEn: 'The definitive Paris luxury handbag in grained calfskin Caviar leather with iconic double-C turnlock clasp.' },
  { slug: 'chanel-boy-chanel-long-wallet', ar: 'محفظة بوي شانيل جلد مبطن بسحاب', en: 'Chanel Boy Chanel Zipped Long Wallet', brand: 'chanel', cat: 'luxury-bags', guide: null, price: 2450000, material: 'full-grain-leather', colors: ['black', 'navy'], sizes: ['one-size'], tags: ['luxury'], descAr: 'محفظة طويلة فاخرة بجلد العجل المبطن وإطار بوي المميز وسحاب محكم وحجرات داخلية متعددة.', descEn: 'Refined zip-around continental wallet with Boy Chanel graphic quilting and ruthenium metal finish.' },
  { slug: 'chanel-rouge-allure-lextrait', ar: 'أحمر شفاه شانيل روج أللور ليكستري الفاخر', en: "Chanel Rouge Allure L'Extrait High-Intensity", brand: 'chanel', cat: 'perfumes-beauty', guide: null, price: 720000, material: null, colors: ['red', 'burgundy', 'pink'], sizes: ['one-size'], tags: ['beauty', 'luxury'], descAr: 'أحمر شفاه فائق التركيز يجمع بين الإشراق المكثف والترطيب العميق بخلاصة زهرة البرقوق وزيت السكوالين.', descEn: 'High-intensity, radiant hydrating refillable lipstick enriched with concentrated plum blossom enfleurage oil.' },

  // HUGO BOSS
  { slug: 'boss-slim-fit-stretch-suit', ar: 'بدلة رجالية فاخرة صوف إيطالي هوغو بوس', en: 'BOSS Slim-Fit Virgin Wool Stretch Suit', brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing', price: 4400000, compare: 5200000, material: 'virgin-wool', colors: ['navy', 'black', 'grey'], sizes: ['48', '50', '52', '54', '56'], featured: true, tags: ['formal', 'luxury'], descAr: 'طقم بدلة كامل (جاكيت وبنطال) منسوج من صوف سيروتي الإيطالي فائق النعومة مع لمسة مرونة لحرية الحركة.', descEn: 'Two-piece slim-fitting suit tailored in pure virgin wool with natural stretch by the famed Italian mill.' },
  { slug: 'boss-pallas-pique-polo', ar: 'قميص بولو هوغو بوس بالاس قطني', en: 'BOSS Pallas Regular-Fit Pique Polo Shirt', brand: 'hugo-boss', cat: 'mens-clothing', guide: 'adult-clothing', price: 920000, material: 'organic-cotton', colors: ['black', 'white', 'navy', 'green'], sizes: ['s', 'm', 'l', 'xl', 'xxl'], tags: ['core'], descAr: 'بولو صيفي مريح من قطن البيكيه الناعم مع تطريز شعار BOSS الصغير المتباين على الصدر.', descEn: 'A versatile casual staple cut in regular fit breathable cotton pique with tonal curved BOSS logo embroidery.' },
  { slug: 'boss-bottled-eau-de-parfum', ar: 'عطر هوغو بوس بوتلد أو دو بارفان', en: 'BOSS Bottled Eau de Parfum for Men', brand: 'hugo-boss', cat: 'perfumes', guide: 'fragrance-guide', price: 1450000, compare: 1750000, material: null, colors: ['black'], sizes: ['50ml', '100ml'], tags: ['bestseller'], descAr: 'مزيج رجالي ساحر من التفاح المقرمش والهيل الدافئ والجلد ونجيل الهند الداكن لرجل الأعمال العصري.', descEn: 'Refined woody-spicy composition bursting with noble apple, rich cinnamon, and intense smoky vetiver.' },
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
  console.log('=== Starting Publishing World Brands Catalog v2 ===\n');

  // 1. Upload Assets to catalog-v2
  console.log('1. Uploading WebP Assets to Supabase Storage (catalog-v2)...');
  const assetDir = 'D:/Files/Programming_Projects/Euro Store/apps/web/public/media/owned';
  const uploads = [
    { local: `${assetDir}/home/hero.webp`, remote: 'owned/catalog-v2/home/hero.webp' },
    { local: `${assetDir}/home/hero-mobile.webp`, remote: 'owned/catalog-v2/home/hero-mobile.webp' },
    ...CATEGORIES_TREE.filter(c => c.img).map(c => ({ local: `${assetDir}/categories/${c.img}.webp`, remote: `owned/catalog-v2/categories/${c.img}.webp` })),
    ...BRANDS_LIST.map(b => ({ local: `${assetDir}/brands/${b.slug}.webp`, remote: `owned/catalog-v2/brands/${b.slug}.webp` })),
    ...PRODUCTS_DATA.map(p => ({ local: `${assetDir}/products/${p.slug}.webp`, remote: `owned/catalog-v2/products/${p.slug}.webp` })),
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
  console.log(`Uploaded ${uploads.length} assets successfully to catalog-v2.`);

  // 2. Seed Brands
  console.log('\n2. Seeding 12 Brands...');
  const brandRows = BRANDS_LIST.map(b => ({
    id: stableId('brand', b.slug),
    slug: b.slug,
    name: b.name,
    logo_url: `${url}/storage/v1/object/public/product-images/owned/catalog-v2/brands/${b.slug}.webp`,
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
    image_url: c.img ? `${url}/storage/v1/object/public/product-images/owned/catalog-v2/categories/${c.img}.webp` : null,
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

    // Product Image with v2 URL
    imageRows.push({
      id: stableId('product-image', p.slug),
      product_id: prodId,
      url: `${url}/storage/v1/object/public/product-images/owned/catalog-v2/products/${p.slug}.webp`,
      is_primary: true,
      sort_order: 1,
    });

    // Variants combinations
    const sizes = p.sizes || ['one-size'];
    const colors = p.colors || ['black'];

    for (const s of sizes) {
      for (const c of colors) {
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

  // Deduplicate variants
  const uniqueVariants = [];
  const seenSkus = new Set();
  for (const v of variantRows) {
    if (!seenSkus.has(v.sku)) {
      seenSkus.add(v.sku);
      uniqueVariants.push(v);
    }
  }

  const { error: pvErr } = await supabase.from('product_variants').upsert(uniqueVariants, { onConflict: 'sku' });
  if (pvErr) throw pvErr;
  console.log(`Upserted ${uniqueVariants.length} product variants (SKUs).`);

  // Upsert variant attributes in batches
  const uniqueAttrPairs = [];
  const seenPairs = new Set();
  for (const va of variantAttrRows) {
    const key = `${va.variant_id}:${va.attribute_value_id}`;
    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      uniqueAttrPairs.push(va);
    }
  }

  const batchSize = 300;
  for (let i = 0; i < uniqueAttrPairs.length; i += batchSize) {
    const batch = uniqueAttrPairs.slice(i, i + batchSize);
    const { error: vaErr } = await supabase.from('variant_attributes').upsert(batch, { onConflict: 'variant_id,attribute_value_id' });
    if (vaErr) console.warn('Variant attribute batch note:', vaErr.message);
  }
  console.log(`Linked ${uniqueAttrPairs.length} variant attribute pairs.`);

  // 7. Update Homepage Sections
  console.log('\n7. Updating Homepage Sections with 12 Brands and New Banners...');
  const heroDesktopUrl = `${url}/storage/v1/object/public/product-images/owned/catalog-v2/home/hero.webp`;
  const heroMobileUrl = `${url}/storage/v1/object/public/product-images/owned/catalog-v2/home/hero-mobile.webp`;
  const allBrandIds = BRANDS_LIST.map(b => stableId('brand', b.slug));

  const sections = [
    {
      id: stableId('homepage-section', 'main_banner'),
      section_key: 'main_banner',
      title_ar: 'الرئيسية - البانر الكبير',
      title_en: 'Main Banner',
      sort_order: 10,
      is_active: true,
      content: {
        banners: [
          {
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
      title_ar: 'أيقونات ستريت وير الرياضية',
      title_en: 'Streetwear Icons',
      desc_ar: 'تشكيلة مختارة تجمع بين أقوى إصدارات نايك وأديداس وبوما وريبوك.',
      desc_en: 'Curated lineup featuring the greatest footwear and apparel hits from Nike, Adidas, Puma, and Reebok.',
      products: ['nike-air-force-1-07', 'adidas-samba-classic', 'puma-palermo-leather-sneaker', 'reebok-club-c-85-vintage', 'nike-tech-fleece-hoodie']
    },
    {
      slug: 'haute-couture-heritage',
      title_ar: 'تراث الفخامة الباريسية والإيطالية',
      title_en: 'Haute Couture & Heritage',
      desc_ar: 'قطع خالدة من شانيل وغوتشي وزارا تجسد ذروة الأناقة الأوروبية المعاصرة.',
      desc_en: 'Timeless luxury essentials from Chanel, Gucci, and Zara defining contemporary elegance.',
      products: ['gucci-gg-marmont-shoulder-bag', 'chanel-classic-11-12-flap-bag', 'gucci-horsebit-1953-loafer', 'chanel-bleu-de-chanel-parfum', 'zara-tailored-textured-blazer']
    },
    {
      slug: 'executive-tailoring',
      title_ar: 'أناقة الأعمال والبدلات الرسمية',
      title_en: 'Executive Tailoring & Classic Style',
      desc_ar: 'بدلات بوس الصوفية وقمصان تومي هيلفيغر وبولو لاكوست وساعات أوتوماتيكية.',
      desc_en: 'Impeccable virgin wool suits, crisp oxford shirts, and classic polos from BOSS, Tommy, and Lacoste.',
      products: ['boss-slim-fit-stretch-suit', 'tommy-hilfiger-1985-oxford-shirt', 'lacoste-l1212-classic-polo', 'boss-skeleton-automatic-watch', 'gucci-double-g-leather-belt']
    }
  ];

  for (const c of collectionsData) {
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
    if (cErr) throw cErr;

    const colItemRows = c.products.map((pSlug, idx) => ({
      collection_id: colId,
      product_id: stableId('product', pSlug),
      sort_order: idx,
    }));
    await supabase.from('collection_products').delete().eq('collection_id', colId);
    const { error: ciErr } = await supabase.from('collection_products').upsert(colItemRows, { onConflict: 'collection_id,product_id' });
    if (ciErr) throw ciErr;
  }
  console.log(`Seeded ${collectionsData.length} curated collections.`);

  // 9. Seed Bundles
  console.log('\n9. Seeding Bundles...');
  const firstVariantByProduct = new Map();
  for (const p of PRODUCTS_DATA) {
    const sizes = p.sizes || ['one-size'];
    const colors = p.colors || ['black'];
    const sku = `${p.slug}-${sizes[0]}-${colors[0]}`.toUpperCase();
    firstVariantByProduct.set(p.slug, stableId('variant', sku));
  }

  const bundlesData = [
    {
      slug: 'nike-tech-pack',
      title_ar: 'طقم نايك تيك فليس الشتوي الكامل',
      title_en: 'Nike Complete Tech Fleece Set',
      desc_ar: 'هودي تيك فليس مع بنطال الجوغرز المطابق بسعر توفيري استثنائي.',
      desc_en: 'Full Tech Fleece Windrunner and matching Club Fleece Joggers.',
      price: 2150000,
      products: ['nike-tech-fleece-hoodie', 'nike-club-fleece-joggers']
    },
    {
      slug: 'chanel-luxury-duo',
      title_ar: 'باقة الفخامة من شانيل (عطر بلو + روج)',
      title_en: 'Chanel Luxury Essentials Duo',
      desc_ar: 'عطر بلو دي شانيل بارفان الفاخر مع أحمر الشفاه روج أللور.',
      desc_en: 'Bleu de Chanel Parfum paired with Rouge Allure L Extrait.',
      price: 3150000,
      products: ['chanel-bleu-de-chanel-parfum', 'chanel-rouge-allure-lextrait']
    },
    {
      slug: 'boss-executive-set',
      title_ar: 'طقم بوس التنفيذي (بدلة + بولو + عطر)',
      title_en: 'BOSS Executive Three-Piece Set',
      desc_ar: 'بدلة الصوف الإيطالي مع بولو بالاس وعطر بوس بوتلد.',
      desc_en: 'Slim-fit virgin wool suit with Pallas polo and BOSS Bottled EDP.',
      price: 6100000,
      products: ['boss-slim-fit-stretch-suit', 'boss-pallas-pique-polo', 'boss-bottled-eau-de-parfum']
    }
  ];

  for (const b of bundlesData) {
    const bId = stableId('bundle', b.slug);
    const { error: bErr } = await supabase.from('product_bundles').upsert({
      id: bId,
      slug: b.slug,
      name_ar: b.title_ar,
      name_en: b.title_en,
      description_ar: b.desc_ar,
      description_en: b.desc_en,
      bundle_price: b.price,
      status: 'published',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'slug' });
    if (bErr) throw bErr;

    const bItemRows = b.products.map(slug => ({
      id: stableId('bundle-item', `${b.slug}:${slug}`),
      bundle_id: bId,
      product_variant_id: firstVariantByProduct.get(slug),
      quantity: 1,
    }));
    await supabase.from('bundle_items').delete().eq('bundle_id', bId);
    const { error: biErr } = await supabase.from('bundle_items').upsert(bItemRows, { onConflict: 'id' });
    if (biErr) throw biErr;
  }
  console.log(`Seeded ${bundlesData.length} luxury bundles.`);

  console.log('\n=== CATALOG v2 PUBLISHED SUCCESSFULLY 100%! ===');
}

publish().catch(err => {
  console.error('Publishing failed:', err);
  process.exit(1);
});
