import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromWeb('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Missing Supabase publishing credentials.');

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

function asset(local, storagePath) {
  return { local: `apps/web/public/media/owned/${local}`, storagePath: `owned/catalog-2026/${storagePath}` };
}

const assetDefinitions = [
  asset('eurostore-hero-2026.webp', 'home/hero.webp'),
  asset('eurostore-hero-mobile-2026.webp', 'home/hero-mobile.webp'),
  asset('categories/mens.webp', 'categories/mens.webp'),
  asset('categories/womens.webp', 'categories/womens.webp'),
  asset('categories/footwear.webp', 'categories/footwear.webp'),
  asset('categories/bags-leather.webp', 'categories/bags-leather.webp'),
  asset('categories/accessories.webp', 'categories/accessories.webp'),
  asset('kids-category-2026.webp', 'categories/kids.webp'),
  ...['maison-aurelia', 'nordhavn-studio', 'cinder-and-vale', 'velora-atelier', 'lumen-step', 'little-loom']
    .map((slug) => asset(`brands/${slug}.webp`, `brands/${slug}.webp`)),
  ...[
    'nordhavn-merino-overshirt', 'aurelia-oxford-shirt', 'cinder-tailored-trousers',
    'velora-silk-blouse', 'velora-pleated-midi-skirt', 'nordhavn-cashmere-cardigan',
    'lumen-court-leather-sneaker', 'lumen-trail-knit-runner', 'cinder-leather-loafer',
    'aurelia-structured-tote', 'cinder-commuter-backpack', 'velora-forest-crossbody',
    'aurelia-automatic-watch', 'nordhavn-polarized-sunglasses', 'cinder-leather-belt',
    'little-loom-rain-jacket', 'little-loom-cotton-sweatshirt', 'little-loom-mini-backpack',
  ].map((slug) => asset(`products/${slug}.webp`, `products/${slug}.webp`)),
];

const brands = [
  ['maison-aurelia', 'Maison Aurelia'],
  ['nordhavn-studio', 'Nordhavn Studio'],
  ['cinder-and-vale', 'Cinder & Vale'],
  ['velora-atelier', 'Velora Atelier'],
  ['lumen-step', 'Lumen Step'],
  ['little-loom', 'Little Loom'],
].map(([slug, name]) => ({ id: stableId('brand', slug), slug, name, is_active: true }));

const sizeGuides = [
  {
    key: 'adult-clothing',
    name: 'دليل الملابس / Adult clothing',
    content: { headers: ['Size', 'Chest cm', 'Waist cm', 'Hip cm'], rows: [['XS', '82-86', '66-70', '88-92'], ['S', '87-92', '71-76', '93-98'], ['M', '93-100', '77-84', '99-106'], ['L', '101-108', '85-92', '107-114'], ['XL', '109-116', '93-100', '115-122']] },
  },
  {
    key: 'eu-footwear',
    name: 'دليل الأحذية / EU footwear',
    content: { headers: ['EU', 'Foot length cm'], rows: [['39', '24.7'], ['40', '25.3'], ['41', '26.0'], ['42', '26.7'], ['43', '27.3'], ['44', '28.0']] },
  },
  {
    key: 'kids-clothing',
    name: 'دليل الأطفال / Kids clothing',
    content: { headers: ['Size', 'Height cm', 'Chest cm'], rows: [['4Y', '104', '56'], ['6Y', '116', '60'], ['8Y', '128', '64'], ['10Y', '140', '70']] },
  },
].map((guide) => ({ ...guide, id: stableId('size-guide', guide.key) }));

const categoryDefinitions = [
  ['mens', 'الرجالي', 'Men', null, 10, 'adult-clothing', 'mens'],
  ['womens', 'النسائي', 'Women', null, 20, 'adult-clothing', 'womens'],
  ['footwear', 'الأحذية', 'Footwear', null, 30, 'eu-footwear', 'footwear'],
  ['bags-leather', 'الحقائب والجلديات', 'Bags & Leather', null, 40, null, 'bags-leather'],
  ['accessories', 'الساعات والإكسسوارات', 'Watches & Accessories', null, 50, null, 'accessories'],
  ['kids', 'الأطفال', 'Kids', null, 60, 'kids-clothing', 'kids'],
  ['mens-essentials', 'أساسيات رجالية', 'Men Essentials', 'mens', 11, 'adult-clothing', null],
  ['womens-essentials', 'أساسيات نسائية', 'Women Essentials', 'womens', 21, 'adult-clothing', null],
  ['sneakers', 'الأحذية الرياضية', 'Sneakers', 'footwear', 31, 'eu-footwear', null],
  ['leather-shoes', 'الأحذية الجلدية', 'Leather Shoes', 'footwear', 32, 'eu-footwear', null],
  ['everyday-bags', 'حقائب يومية', 'Everyday Bags', 'bags-leather', 41, null, null],
  ['kids-essentials', 'أساسيات الأطفال', 'Kids Essentials', 'kids', 61, 'kids-clothing', null],
];

const categories = categoryDefinitions.map(([slug, name_ar, name_en, parentSlug, sort_order, guideKey, imageKey]) => ({
  id: stableId('category', slug), slug, name_ar, name_en, parentSlug, sort_order,
  size_guide_id: guideKey ? stableId('size-guide', guideKey) : null,
  imageKey, is_active: true,
}));

const attributeTypes = [
  ['size', 'المقاس', 'Size'],
  ['color', 'اللون', 'Color'],
  ['material', 'الخامة', 'Material'],
].map(([slug, name_ar, name_en]) => ({ id: stableId('attribute-type', slug), slug, name_ar, name_en }));

const valueDefinitions = [
  ['size', 'xs', 'XS', 'XS', null], ['size', 's', 'S', 'S', null], ['size', 'm', 'M', 'M', null], ['size', 'l', 'L', 'L', null], ['size', 'xl', 'XL', 'XL', null],
  ...['39', '40', '41', '42', '43', '44'].map((value) => ['size', value, value, value, null]),
  ...[['4y', '4 سنوات', '4Y'], ['6y', '6 سنوات', '6Y'], ['8y', '8 سنوات', '8Y'], ['10y', '10 سنوات', '10Y']].map(([key, ar, en]) => ['size', key, ar, en, null]),
  ['color', 'ivory', 'عاجي', 'Ivory', '#F2EBDD'], ['color', 'navy', 'كحلي', 'Navy', '#172A46'], ['color', 'charcoal', 'فحمي', 'Charcoal', '#323232'],
  ['color', 'forest', 'أخضر غابة', 'Forest Green', '#234C3B'], ['color', 'burgundy', 'خمري', 'Burgundy', '#6B1F32'], ['color', 'cognac', 'كونياك', 'Cognac', '#9A542A'],
  ['color', 'mustard', 'خردلي', 'Mustard', '#D99A18'], ['color', 'white', 'أبيض', 'White', '#F7F7F4'], ['color', 'black', 'أسود', 'Black', '#171717'],
  ['material', 'merino-wool', 'صوف ميرينو', 'Merino Wool', null], ['material', 'organic-cotton', 'قطن عضوي', 'Organic Cotton', null],
  ['material', 'wool-blend', 'مزيج صوف', 'Wool Blend', null], ['material', 'silk-blend', 'مزيج حرير', 'Silk Blend', null],
  ['material', 'cashmere-blend', 'مزيج كشمير', 'Cashmere Blend', null], ['material', 'leather', 'جلد طبيعي', 'Full-grain Leather', null],
  ['material', 'knit-mesh', 'نسيج شبكي', 'Knit Mesh', null], ['material', 'recycled-nylon', 'نايلون معاد التدوير', 'Recycled Nylon', null],
];

const attributeValues = valueDefinitions.map(([type, key, value_ar, value_en, hex_color], index) => ({
  id: stableId('attribute-value', `${type}:${key}`),
  attribute_type_id: stableId('attribute-type', type),
  key, type, value_ar, value_en, hex_color, sort_order: index + 1,
}));

const products = [
  { slug: 'nordhavn-merino-overshirt', ar: 'قميص جاكيت ميرينو نوردهامن', en: 'Nordhavn Merino Overshirt', category: 'mens-essentials', brand: 'nordhavn-studio', guide: 'adult-clothing', price: 1420000, compare: 1650000, material: 'merino-wool', colors: ['navy', 'charcoal'], sizes: ['s', 'm', 'l', 'xl'], featured: true, tags: ['new', 'winter'], descAr: 'قميص جاكيت من صوف ميرينو الناعم بجيبين أماميين وقصة مستقيمة. تنظيف جاف لطيف.', descEn: 'Soft merino-wool overshirt with two chest pockets and a straight fit. Gentle dry clean.' },
  { slug: 'aurelia-oxford-shirt', ar: 'قميص أكسفورد أوريليا', en: 'Aurelia Organic Oxford Shirt', category: 'mens-essentials', brand: 'maison-aurelia', guide: 'adult-clothing', price: 720000, material: 'organic-cotton', colors: ['ivory', 'navy'], sizes: ['s', 'm', 'l', 'xl'], tags: ['core'], descAr: 'قميص أكسفورد من القطن العضوي بياقة مثبتة وأساور قابلة للتعديل. يغسل بارداً.', descEn: 'Organic-cotton Oxford shirt with button-down collar and adjustable cuffs. Cold wash.' },
  { slug: 'cinder-tailored-trousers', ar: 'بنطال صوف مفصل سيندر', en: 'Cinder Tailored Wool Trousers', category: 'mens-essentials', brand: 'cinder-and-vale', guide: 'adult-clothing', price: 980000, material: 'wool-blend', colors: ['charcoal', 'navy'], sizes: ['s', 'm', 'l', 'xl'], featured: true, tags: ['core'], descAr: 'بنطال مفصل بمزيج صوف وثنيات أمامية وحزام خصر منظم. تنظيف جاف.', descEn: 'Tailored wool-blend trousers with front pleats and structured waistband. Dry clean.' },
  { slug: 'velora-silk-blouse', ar: 'بلوزة حرير فيلورا', en: 'Velora Gathered Silk Blouse', category: 'womens-essentials', brand: 'velora-atelier', guide: 'adult-clothing', price: 1100000, compare: 1250000, material: 'silk-blend', colors: ['ivory', 'burgundy'], sizes: ['xs', 's', 'm', 'l'], featured: true, tags: ['new', 'sale'], descAr: 'بلوزة بمزيج حرير وياقة مجمعة وأساور عريضة. غسيل يدوي بارد.', descEn: 'Silk-blend blouse with gathered collar and wide cuffs. Cold hand wash.' },
  { slug: 'velora-pleated-midi-skirt', ar: 'تنورة ميدي بطيات فيلورا', en: 'Velora Pleated Midi Skirt', category: 'womens-essentials', brand: 'velora-atelier', guide: 'adult-clothing', price: 860000, material: 'wool-blend', colors: ['forest', 'black'], sizes: ['xs', 's', 'm', 'l'], tags: ['core'], descAr: 'تنورة ميدي بطيات دقيقة وحزام خصر مريح وإغلاق جانبي مخفي.', descEn: 'Precision-pleated midi skirt with comfortable waistband and concealed side closure.' },
  { slug: 'nordhavn-cashmere-cardigan', ar: 'كارديغان كشمير نوردهامن', en: 'Nordhavn Cashmere Cardigan', category: 'womens-essentials', brand: 'nordhavn-studio', guide: 'adult-clothing', price: 1320000, compare: 1550000, material: 'cashmere-blend', colors: ['burgundy', 'ivory'], sizes: ['s', 'm', 'l', 'xl'], featured: true, tags: ['sale', 'winter'], descAr: 'كارديغان ناعم بمزيج كشمير وأزرار مصقولة وحواف مضلعة. يغسل يدوياً.', descEn: 'Soft cashmere-blend cardigan with polished buttons and ribbed edges. Hand wash.' },
  { slug: 'lumen-court-leather-sneaker', ar: 'سنيكرز جلد كورت لومِن', en: 'Lumen Court Leather Sneaker', category: 'sneakers', brand: 'lumen-step', guide: 'eu-footwear', price: 920000, material: 'leather', colors: ['white'], sizes: ['39', '40', '41', '42', '43', '44'], featured: true, tags: ['new', 'core'], descAr: 'سنيكرز من الجلد الطبيعي بنعل مطاطي كريمي وبطانة قابلة للتنفس.', descEn: 'Full-grain leather court sneaker with cream rubber sole and breathable lining.' },
  { slug: 'lumen-trail-knit-runner', ar: 'حذاء جري تريل لومِن', en: 'Lumen Trail Knit Runner', category: 'sneakers', brand: 'lumen-step', guide: 'eu-footwear', price: 1050000, compare: 1200000, material: 'knit-mesh', colors: ['charcoal'], sizes: ['39', '40', '41', '42', '43', '44'], tags: ['sale', 'outdoor'], descAr: 'حذاء جري بنسيج شبكي مرن ونعل خارجي ثابت للمشي اليومي والمسارات الخفيفة.', descEn: 'Flexible knit runner with stable outsole for daily walking and light trails.' },
  { slug: 'cinder-leather-loafer', ar: 'لوفر جلد سيندر', en: 'Cinder Hand-finished Leather Loafer', category: 'leather-shoes', brand: 'cinder-and-vale', guide: 'eu-footwear', price: 1280000, material: 'leather', colors: ['cognac'], sizes: ['39', '40', '41', '42', '43', '44'], featured: true, tags: ['core'], descAr: 'حذاء لوفر من الجلد الطبيعي بدرزة يدوية ونعل مرن مناسب للاستخدام الرسمي.', descEn: 'Full-grain leather loafer with hand-finished apron seam and flexible formal sole.' },
  { slug: 'aurelia-structured-tote', ar: 'حقيبة توت أوريليا', en: 'Aurelia Structured Leather Tote', category: 'everyday-bags', brand: 'maison-aurelia', price: 1480000, compare: 1720000, material: 'leather', colors: ['burgundy', 'black'], featured: true, tags: ['new', 'sale'], descAr: 'حقيبة توت منظمة من الجلد الطبيعي بجيب داخلي مبطن وإغلاق مغناطيسي.', descEn: 'Structured full-grain leather tote with lined inner pocket and magnetic closure.' },
  { slug: 'cinder-commuter-backpack', ar: 'حقيبة ظهر للعمل سيندر', en: 'Cinder Commuter Leather Backpack', category: 'everyday-bags', brand: 'cinder-and-vale', price: 1350000, material: 'leather', colors: ['charcoal', 'cognac'], tags: ['core', 'work'], descAr: 'حقيبة ظهر جلدية بحجرة مبطنة لحاسوب 15 بوصة وجيب أمامي وحزام سفر.', descEn: 'Leather commuter backpack with padded 15-inch laptop sleeve, front pocket and travel strap.' },
  { slug: 'velora-forest-crossbody', ar: 'حقيبة كروس فيلورا', en: 'Velora Forest Crossbody Bag', category: 'everyday-bags', brand: 'velora-atelier', price: 980000, material: 'leather', colors: ['forest', 'burgundy'], tags: ['new'], descAr: 'حقيبة كروس مدمجة من الجلد المحبب بحزام قابل للتعديل وقفل معدني مصقول.', descEn: 'Compact pebbled-leather crossbody with adjustable strap and brushed-metal clasp.' },
  { slug: 'aurelia-automatic-watch', ar: 'ساعة أوريليا أوتوماتيك', en: 'Aurelia Automatic Steel Watch', category: 'accessories', brand: 'maison-aurelia', price: 2450000, compare: 2800000, material: 'leather', colors: ['cognac', 'black'], featured: true, tags: ['sale', 'gift'], descAr: 'ساعة أوتوماتيكية بهيكل فولاذي وقرص فحمي وحزام جلد طبيعي قابل للتبديل.', descEn: 'Automatic watch with brushed-steel case, charcoal dial and interchangeable leather strap.' },
  { slug: 'nordhavn-polarized-sunglasses', ar: 'نظارة شمسية نوردهامن', en: 'Nordhavn Polarized Sunglasses', category: 'accessories', brand: 'nordhavn-studio', price: 620000, material: 'recycled-nylon', colors: ['black', 'burgundy'], tags: ['core'], descAr: 'نظارة بإطار خفيف وعدسات مستقطبة UV400 ومفصلات معدنية مصقولة.', descEn: 'Lightweight frame with polarized UV400 lenses and brushed-metal hinges.' },
  { slug: 'cinder-leather-belt', ar: 'حزام جلد سيندر', en: 'Cinder Full-grain Leather Belt', category: 'accessories', brand: 'cinder-and-vale', guide: 'adult-clothing', price: 460000, material: 'leather', colors: ['cognac', 'black'], sizes: ['s', 'm', 'l', 'xl'], tags: ['core'], descAr: 'حزام من الجلد الطبيعي بحواف مصقولة وإبزيم نحاسي بسيط.', descEn: 'Full-grain leather belt with burnished edges and a simple brushed-brass buckle.' },
  { slug: 'little-loom-rain-jacket', ar: 'جاكيت مطر ليتل لوم', en: 'Little Loom Rain Jacket', category: 'kids-essentials', brand: 'little-loom', guide: 'kids-clothing', price: 540000, compare: 620000, material: 'recycled-nylon', colors: ['mustard', 'forest'], sizes: ['4y', '6y', '8y', '10y'], featured: true, tags: ['kids', 'sale'], descAr: 'جاكيت أطفال مقاوم للماء ببطانة قطنية مخططة وغطاء رأس ثابت.', descEn: 'Water-resistant kids jacket with striped cotton lining and fixed hood.' },
  { slug: 'little-loom-cotton-sweatshirt', ar: 'سويت شيرت ليتل لوم', en: 'Little Loom Organic Sweatshirt', category: 'kids-essentials', brand: 'little-loom', guide: 'kids-clothing', price: 360000, material: 'organic-cotton', colors: ['navy', 'ivory'], sizes: ['4y', '6y', '8y', '10y'], tags: ['kids', 'core'], descAr: 'سويت شيرت أطفال من القطن العضوي بحواف مضلعة وخياطة داخلية ناعمة.', descEn: 'Organic-cotton kids sweatshirt with ribbed edges and soft internal seams.' },
  { slug: 'little-loom-mini-backpack', ar: 'حقيبة ظهر صغيرة ليتل لوم', en: 'Little Loom Mini Backpack', category: 'kids-essentials', brand: 'little-loom', price: 430000, material: 'recycled-nylon', colors: ['forest', 'mustard'], tags: ['kids', 'new'], descAr: 'حقيبة ظهر صغيرة من قماش معاد التدوير المقاوم للماء مع أحزمة مبطنة.', descEn: 'Small water-resistant recycled-fabric backpack with padded adjustable straps.' },
];

const collections = [
  { slug: 'quiet-luxury', ar: 'فخامة هادئة', en: 'Quiet Luxury', description_ar: 'قطع متقنة بخامات هادئة وتفاصيل تدوم.', description_en: 'Refined pieces with quiet materials and lasting detail.', products: ['nordhavn-merino-overshirt', 'aurelia-oxford-shirt', 'velora-silk-blouse', 'nordhavn-cashmere-cardigan', 'cinder-leather-loafer', 'aurelia-automatic-watch'], featured: true, order: 10 },
  { slug: 'city-essentials', ar: 'أساسيات المدينة', en: 'City Essentials', description_ar: 'اختيارات عملية للعمل والتنقل اليومي.', description_en: 'Practical choices for work and daily movement.', products: ['cinder-tailored-trousers', 'lumen-court-leather-sneaker', 'cinder-commuter-backpack', 'velora-forest-crossbody', 'nordhavn-polarized-sunglasses', 'cinder-leather-belt'], featured: true, order: 20 },
  { slug: 'little-weekends', ar: 'عطلة الصغار', en: 'Little Weekends', description_ar: 'أساسيات مريحة ومتينة للأطفال.', description_en: 'Comfortable, durable essentials for children.', products: ['little-loom-rain-jacket', 'little-loom-cotton-sweatshirt', 'little-loom-mini-backpack'], featured: true, order: 30 },
];

const bundles = [
  { slug: 'city-commute-set', ar: 'طقم تنقل المدينة', en: 'City Commute Set', description_ar: 'قميص جاكيت وحقيبة ظهر وسنيكرز بتسعير مجموعة.', description_en: 'Overshirt, commuter backpack and court sneakers at a set price.', price: 3420000, products: ['nordhavn-merino-overshirt', 'cinder-commuter-backpack', 'lumen-court-leather-sneaker'] },
  { slug: 'weekend-edit-set', ar: 'طقم عطلة أنيق', en: 'Weekend Edit Set', description_ar: 'كارديغان وحقيبة توت ونظارة شمسية.', description_en: 'Cashmere cardigan, leather tote and polarized sunglasses.', price: 3040000, products: ['nordhavn-cashmere-cardigan', 'aurelia-structured-tote', 'nordhavn-polarized-sunglasses'] },
  { slug: 'little-explorer-set', ar: 'طقم المستكشف الصغير', en: 'Little Explorer Set', description_ar: 'جاكيت مطر وسويت شيرت وحقيبة صغيرة.', description_en: 'Rain jacket, organic sweatshirt and mini backpack.', price: 1180000, products: ['little-loom-rain-jacket', 'little-loom-cotton-sweatshirt', 'little-loom-mini-backpack'] },
];

async function readRows(table, columns) {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

async function countRows(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function deleteAll(table, column = 'id') {
  const { error } = await supabase.from(table).delete().neq(column, zero);
  if (error) throw new Error(`clear ${table}: ${error.message}`);
}

async function upsert(table, rows, onConflict = 'id') {
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict }).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

function storagePathFromUrl(value) {
  if (!value) return null;
  try {
    const marker = '/storage/v1/object/public/product-images/';
    const pathname = new URL(value).pathname;
    const index = pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(pathname.slice(index + marker.length)) : null;
  } catch { return null; }
}

const [oldImages, oldCategories, oldBrands, homepageSections] = await Promise.all([
  readRows('product_images', 'url'), readRows('categories', 'image_url'), readRows('brands', 'logo_url'),
  readRows('homepage_sections', 'id,section_key,content'),
]);

const oldMediaPaths = new Set([
  ...oldImages.map((row) => storagePathFromUrl(row.url)),
  ...oldCategories.map((row) => storagePathFromUrl(row.image_url)),
  ...oldBrands.map((row) => storagePathFromUrl(row.logo_url)),
  ...homepageSections.flatMap((section) => (Array.isArray(section.content?.banners) ? section.content.banners : []))
    .flatMap((banner) => [storagePathFromUrl(banner?.image_url), storagePathFromUrl(banner?.mobile_image_url)]),
].filter(Boolean));

const safetyTables = ['order_items', 'exchange_items', 'exchange_requests', 'cart_items', 'cart_bundle_items', 'wishlist_items', 'product_reviews', 'notify_me_subscriptions'];
const safetyCounts = Object.fromEntries(await Promise.all(safetyTables.map(async (table) => [table, await countRows(table)])));
if (Object.values(safetyCounts).some((count) => count > 0)) {
  throw new Error(`Catalog replacement refused because dependent customer data exists: ${JSON.stringify(safetyCounts)}`);
}

const backupTables = [
  'brands', 'categories', 'attribute_types', 'attribute_values', 'size_guides', 'products',
  'product_variants', 'variant_attributes', 'product_images', 'product_videos', 'collections',
  'collection_products', 'product_bundles', 'bundle_items', 'discount_codes', 'homepage_sections',
];
const backup = Object.fromEntries(await Promise.all(backupTables.map(async (table) => [table, await readRows(table, '*')])));
await mkdir('_handoff/backups', { recursive: true });
const backupStamp = new Date().toISOString().replace(/[:.]/g, '-');
await writeFile(`_handoff/backups/catalog-before-${backupStamp}.json`, `${JSON.stringify({ createdAt: new Date().toISOString(), projectHost: new URL(url).hostname, tables: backup }, null, 2)}\n`, 'utf8');

const published = new Map();
for (const definition of assetDefinitions) {
  const bytes = await readFile(definition.local);
  const { error } = await bucket.upload(definition.storagePath, bytes, { contentType: 'image/webp', cacheControl: '31536000', upsert: true });
  if (error) throw new Error(`${definition.storagePath}: ${error.message}`);
  published.set(definition.storagePath, bucket.getPublicUrl(definition.storagePath).data.publicUrl);
}

for (const [table, column] of [
  ['collection_products', 'collection_id'], ['bundle_items', 'id'], ['variant_attributes', 'variant_id'],
  ['product_images', 'id'], ['product_videos', 'id'], ['product_variants', 'id'], ['products', 'id'],
  ['product_bundles', 'id'], ['collections', 'id'], ['categories', 'id'], ['brands', 'id'],
  ['attribute_values', 'id'], ['attribute_types', 'id'], ['size_guides', 'id'], ['discount_codes', 'id'],
]) await deleteAll(table, column);

await upsert('size_guides', sizeGuides.map(({ key, ...guide }) => guide));
await upsert('brands', brands.map((brand) => ({
  ...brand,
  logo_url: published.get(`owned/catalog-2026/brands/${brand.slug}.webp`),
})));

const categoryBySlug = new Map(categories.map((row) => [row.slug, row]));
const categoryRows = categories.map(({ parentSlug, imageKey, ...category }) => ({
  ...category,
  parent_id: parentSlug ? categoryBySlug.get(parentSlug).id : null,
  image_url: imageKey ? published.get(`owned/catalog-2026/categories/${imageKey}.webp`) : null,
}));
await upsert('categories', categoryRows);
await upsert('attribute_types', attributeTypes);
await upsert('attribute_values', attributeValues.map(({ key, type, ...value }) => value));

const brandBySlug = new Map(brands.map((row) => [row.slug, row]));
const guideByKey = new Map(sizeGuides.map((row) => [row.key, row]));
const valueByKey = new Map(attributeValues.map((row) => [`${row.type}:${row.key}`, row]));
const productRows = products.map((product, index) => {
  const discount = product.compare ? Math.round((1 - product.price / product.compare) * 100) : null;
  return {
    id: stableId('product', product.slug), slug: product.slug, name_ar: product.ar, name_en: product.en,
    description_ar: product.descAr, description_en: product.descEn,
    category_id: categoryBySlug.get(product.category).id, brand_id: brandBySlug.get(product.brand).id,
    size_guide_id: product.guide ? guideByKey.get(product.guide).id : null,
    base_price: product.price, status: 'published', is_active: true, is_featured: Boolean(product.featured), tags: product.tags,
    discount_percentage: discount, discount_start_at: discount ? '2026-08-01T00:00:00Z' : null,
    discount_end_at: discount ? '2027-12-31T23:59:59Z' : null,
    created_at: new Date(Date.UTC(2026, 7, 1 + index)).toISOString(), updated_at: new Date().toISOString(),
  };
});
await upsert('products', productRows);

const variants = [];
const variantAttributes = [];
const firstVariantByProduct = new Map();
for (const product of products) {
  const combinations = product.colors.flatMap((color) => (product.sizes?.length ? product.sizes.map((size) => ({ color, size })) : [{ color, size: null }]));
  combinations.forEach((combination, index) => {
    const key = `${product.slug}:${combination.color}:${combination.size ?? 'one'}`;
    const variantId = stableId('variant', key);
    const stock = (product.slug === 'lumen-trail-knit-runner' && combination.size === '44') || (product.slug === 'little-loom-rain-jacket' && combination.size === '10y' && combination.color === 'mustard')
      ? 0 : 8 + ((index * 7 + product.slug.length) % 23);
    variants.push({
      id: variantId, product_id: stableId('product', product.slug),
      sku: `${product.slug.split('-').map((part) => part[0]).join('').toUpperCase()}-${combination.color.slice(0, 3).toUpperCase()}-${(combination.size ?? 'OS').toUpperCase()}`,
      price_syp: product.price, compare_price_syp: product.compare ?? null, stock_quantity: stock,
      weight_grams: product.category.includes('sneaker') || product.category.includes('shoes') ? 900 : product.category.includes('bags') ? 750 : 450,
      is_active: true,
    });
    if (!firstVariantByProduct.has(product.slug)) firstVariantByProduct.set(product.slug, variantId);
    for (const value of [valueByKey.get(`color:${combination.color}`), combination.size ? valueByKey.get(`size:${combination.size}`) : null, valueByKey.get(`material:${product.material}`)].filter(Boolean)) {
      variantAttributes.push({ variant_id: variantId, attribute_value_id: value.id });
    }
  });
}
await upsert('product_variants', variants);
await upsert('variant_attributes', variantAttributes, 'variant_id,attribute_value_id');
await upsert('product_images', products.map((product) => ({
  id: stableId('product-image', product.slug), product_id: stableId('product', product.slug), variant_id: null,
  url: published.get(`owned/catalog-2026/products/${product.slug}.webp`),
  alt_ar: `صورة ${product.ar} بدون أشخاص`, alt_en: `${product.en} product-only image`,
  alt_text_ar: `صورة ${product.ar} بدون أشخاص`, alt_text_en: `${product.en} product-only image`,
  sort_order: 0, is_primary: true, source: 'upload',
})));

const collectionRows = collections.map((collection) => ({
  id: stableId('collection', collection.slug), slug: collection.slug, name_ar: collection.ar, name_en: collection.en,
  description_ar: collection.description_ar, description_en: collection.description_en,
  is_featured_on_homepage: collection.featured, has_standalone_page: true, is_active: true, sort_order: collection.order,
}));
await upsert('collections', collectionRows);
await upsert('collection_products', collections.flatMap((collection) => collection.products.map((slug, index) => ({
  collection_id: stableId('collection', collection.slug), product_id: stableId('product', slug), sort_order: index,
}))), 'collection_id,product_id');

await upsert('product_bundles', bundles.map((bundle) => ({
  id: stableId('bundle', bundle.slug), slug: bundle.slug, name_ar: bundle.ar, name_en: bundle.en,
  description_ar: bundle.description_ar, description_en: bundle.description_en,
  bundle_price: bundle.price, status: 'published', updated_at: new Date().toISOString(),
})));
await upsert('bundle_items', bundles.flatMap((bundle) => bundle.products.map((slug) => ({
  id: stableId('bundle-item', `${bundle.slug}:${slug}`), bundle_id: stableId('bundle', bundle.slug),
  product_variant_id: firstVariantByProduct.get(slug), quantity: 1,
}))));

const kidsCategoryId = categoryBySlug.get('kids').id;
await upsert('discount_codes', [
  { id: stableId('discount', 'WELCOME10'), code: 'WELCOME10', description: 'خصم أول طلب / First order discount', type: 'percentage', value: 10, min_order_syp: 250000, valid_from: '2026-01-01T00:00:00Z', valid_until: '2027-12-31T23:59:59Z', max_uses: 10000, max_uses_per_user: 1, used_count: 0, is_active: true, eligibility: 'first_time_buyers', scope: 'entire_store', category_ids: null, product_ids: null },
  { id: stableId('discount', 'STYLE15'), code: 'STYLE15', description: 'خصم الطلبات الكبيرة / Large order discount', type: 'percentage', value: 15, min_order_syp: 2500000, valid_from: '2026-08-01T00:00:00Z', valid_until: '2027-12-31T23:59:59Z', max_uses: 500, max_uses_per_user: 2, used_count: 0, is_active: true, eligibility: 'all_users', scope: 'entire_store', category_ids: null, product_ids: null },
  { id: stableId('discount', 'KIDS12'), code: 'KIDS12', description: 'خصم مجموعة الأطفال / Kids collection discount', type: 'percentage', value: 12, min_order_syp: 500000, valid_from: '2026-08-01T00:00:00Z', valid_until: '2027-12-31T23:59:59Z', max_uses: 1000, max_uses_per_user: 3, used_count: 0, is_active: true, eligibility: 'all_users', scope: 'categories', category_ids: [kidsCategoryId, categoryBySlug.get('kids-essentials').id], product_ids: null },
]);

const sectionByKey = new Map(homepageSections.map((section) => [section.section_key, section]));
const hero = published.get('owned/catalog-2026/home/hero.webp');
const heroMobile = published.get('owned/catalog-2026/home/hero-mobile.webp');
const bannerSection = sectionByKey.get('main_banner');
const banner = {
  id: bannerSection?.content?.banners?.[0]?.id || randomUUID(),
  title_ar: 'منتجات مختارة لحياة يومية أجمل', title_en: 'Considered products for everyday life',
  subtitle_ar: 'خامات واضحة، مقاسات فعلية، مخزون مباشر، ودفع عند الاستلام.',
  subtitle_en: 'Clear materials, real sizing, live inventory, and cash on delivery.',
  image_url: hero, mobile_image_url: heroMobile, cta_url: '/products',
  cta_label_ar: 'استكشف الكتالوج', cta_label_en: 'Explore the catalog', is_active: true, sort_order: 0,
  created_at: bannerSection?.content?.banners?.[0]?.created_at || new Date().toISOString(),
};

for (const section of [
  { key: 'main_banner', title_ar: 'الرئيسية', title_en: 'Main banner', content: { banners: [banner] }, order: 10 },
  { key: 'new_arrivals', title_ar: 'وصل حديثاً', title_en: 'New arrivals', content: { item_count: 12, limit: 12 }, order: 20 },
  { key: 'sales', title_ar: 'العروض', title_en: 'Sales', content: { item_count: 6, limit: 6 }, order: 30 },
  { key: 'featured_brands', title_ar: 'علامات مختارة', title_en: 'Featured brands', content: { brand_ids: brands.map((brand) => brand.id), item_count: 6 }, order: 40 },
  { key: 'most_popular', title_ar: 'الأكثر طلباً', title_en: 'Most popular', content: { item_count: 12 }, order: 50 },
]) {
  const current = sectionByKey.get(section.key);
  const row = { id: current?.id || stableId('homepage-section', section.key), section_key: section.key, title_ar: section.title_ar, title_en: section.title_en, content: section.content, is_active: true, sort_order: section.order, updated_at: new Date().toISOString() };
  await upsert('homepage_sections', [row]);
}

const newPaths = new Set(assetDefinitions.map((definition) => definition.storagePath));
const removablePaths = [...oldMediaPaths].filter((path) => !newPaths.has(path));
if (removablePaths.length) {
  const { error } = await bucket.remove(removablePaths);
  if (error) throw new Error(`remove old media: ${error.message}`);
}

console.log(JSON.stringify({
  projectHost: new URL(url).hostname,
  uploadedAssets: assetDefinitions.length,
  removedOldAssets: removablePaths.length,
  brands: brands.length,
  categories: categories.length,
  products: products.length,
  variants: variants.length,
  variantAttributes: variantAttributes.length,
  collections: collections.length,
  bundles: bundles.length,
  discounts: 3,
  safetyCounts,
}, null, 2));
