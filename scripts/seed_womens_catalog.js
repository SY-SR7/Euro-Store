const path = require('path');
const { createClient } = require(path.join(__dirname, '../apps/web/node_modules/@supabase/supabase-js'));
require(path.join(__dirname, '../apps/web/node_modules/dotenv')).config({ path: path.join(__dirname, '../apps/web/.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const womensProducts = [
  {
    name_ar: 'سنيكرز نايك إير فورس 1 نسائي كلاسيك أبيض',
    name_en: "Nike Air Force 1 '07 Women Triple White Sneaker",
    slug: 'nike-air-force-1-women-white',
    description_ar: 'حذاء نايك إير فورس 1 النسائي الأيقوني باللون الأبيض النقي. جلد طبيعي فاخر مع وسادة هوائية مريحة وتصميم كلاسيكي أصلي 100%.',
    description_en: "Iconic Nike Air Force 1 '07 in clean Triple White. Premium leather upper, encapsulated Air cushioning and timeless aesthetic.",
    brand_slug: 'nike',
    category_slug: 'womens',
    base_price: 1850000,
    discount_percentage: 0,
    image_url: 'https://m.media-amazon.com/images/I/71D9ImsvEtL._AC_UY1000_.jpg',
    sizes: ['EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40']
  },
  {
    name_ar: 'حذاء أديداس ستان سميث نسائي أبيض وزهري',
    name_en: 'Adidas Originals Stan Smith Women White Pink',
    slug: 'adidas-stan-smith-women-white-pink',
    description_ar: 'أيقونة أديداس الكلاسيكية ستان سميث بتفاصيل وردية أنيقة. خامات مستدامة مع بطانة داخلية ناعمة ونعل مطاطي متين.',
    description_en: 'Classic Adidas Stan Smith featuring subtle pink accents. Clean silhouette, comfortable sockliner and durable rubber outsole.',
    brand_slug: 'adidas',
    category_slug: 'womens',
    base_price: 1450000,
    discount_percentage: 10,
    image_url: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=1000&q=80',
    sizes: ['EU 36', 'EU 37', 'EU 38', 'EU 39']
  },
  {
    name_ar: 'سنيكرز بوما كارينا 2.0 جلدي نسائي أبيض وذهبي',
    name_en: "Puma Carina 2.0 Women's Leather Sneaker White Gold",
    slug: 'puma-carina-leather-sneaker-women',
    description_ar: 'تصميم مستوحى من أناقة شواطئ كاليفورنيا في الثمانينات. جلد ناعم مع لمسات ذهبية براقة ونعل SoftFoam+ فائق الراحة.',
    description_en: '80s California beach inspired look with premium leather, metallic gold details, and ultra-plush SoftFoam+ cushioning.',
    brand_slug: 'puma',
    category_slug: 'womens',
    base_price: 1200000,
    discount_percentage: 15,
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
    sizes: ['EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40']
  },
  {
    name_ar: 'عطر شانيل كوكو مادموزيل أو دو بارفان 100 مل نسائي',
    name_en: 'Chanel Coco Mademoiselle Eau de Parfum 100ml',
    slug: 'chanel-coco-mademoiselle-edp-100ml',
    description_ar: 'عطر شرقي أنثوي فاخر بعبق الحمضيات والورد والباتشولي والياسمين. تركيز أو دو بارفان الأصلي من باريس.',
    description_en: 'An intensely feminine oriental fragrance with fresh orange, rose, jasmine, and patchouli. Authentic Paris Eau de Parfum.',
    brand_slug: 'chanel',
    category_slug: 'womens',
    base_price: 3400000,
    discount_percentage: 0,
    image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1000&q=80',
    sizes: ['100ml']
  },
  {
    name_ar: 'عطر ديور جادور أو دو بارفان 100 مل نسائي',
    name_en: "Dior J'adore Eau de Parfum 100ml",
    slug: 'dior-jadore-eau-de-parfum-100ml',
    description_ar: 'تحفة ديور الزهرية الأيقونية بنفحات اليلانج يلانج والورد الدمشقي وياسمين غراس الملكي. عطر الأنوثة الخالدة.',
    description_en: "Dior's grand floral bouquet featuring Ylang-Ylang, Damascus Rose, and Grasse Jasmine. Timeless Parisian elegance.",
    brand_slug: 'dior',
    category_slug: 'womens',
    base_price: 3100000,
    discount_percentage: 10,
    image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=80',
    sizes: ['100ml']
  },
  {
    name_ar: 'عطر فرزاتشي برايت كريستال 90 مل نسائي',
    name_en: 'Versace Bright Crystal Eau de Toilette 90ml',
    slug: 'versace-bright-crystal-edt-90ml',
    description_ar: 'عطر إيطالي متألق يمزج الرمان المنعش مع أزهار اللوتس والماغنوليا والعنبر الدافئ في زجاجة كريستالية فاخرة.',
    description_en: 'Sensual floral scent blending refreshing pomegranate, peony, lotus flower, and amber in a jewel-like bottle.',
    brand_slug: 'versace',
    category_slug: 'womens',
    base_price: 2100000,
    discount_percentage: 20,
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
    sizes: ['90ml']
  },
  {
    name_ar: 'قميص بولو لاكوست بيكيه كلاسيك نسائي أبيض',
    name_en: "Lacoste Women's Classic Piqué Slim Polo White",
    slug: 'lacoste-women-classic-pique-polo',
    description_ar: 'بولو لاكوست النسائي الكلاسيكي من قطن البيكيه الفاخر بياقة أنيقة وشعار التمساح المطرز الأخضر الأصلي.',
    description_en: 'Essential women polo shirt in iconic petit piqué cotton with refined mother-of-pearl buttons and crocodile embroidery.',
    brand_slug: 'lacoste',
    category_slug: 'womens',
    base_price: 1550000,
    discount_percentage: 0,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
    sizes: ['S (36)', 'M (38)', 'L (40)', 'XL (42)']
  },
  {
    name_ar: 'تيشيرت تومي هيلفيغر هيريتيج كلاسيك نسائي',
    name_en: "Tommy Hilfiger Women's Heritage Crewneck T-Shirt",
    slug: 'tommy-hilfiger-women-heritage-crewneck',
    description_ar: 'تيشيرت نسائي كلاسيكي من تومي هيلفيغر مصنوع من قطن جيرسي العضوي الفاخر مع تطريز علم تومي الأيقوني.',
    description_en: 'Everyday classic crewneck tee crafted from soft organic cotton jersey with signature Tommy Hilfiger flag embroidery.',
    brand_slug: 'tommy-hilfiger',
    category_slug: 'womens',
    base_price: 980000,
    discount_percentage: 15,
    image_url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name_ar: 'نظارة ريبان إريكا كلاسيك نسائية أصلية',
    name_en: 'Ray-Ban Erika Classic Sunglasses RB4171',
    slug: 'ray-ban-erika-classic-sunglasses',
    description_ar: 'نظارة ريبان إريكا الشهيرة بإطار دائري ناعم وعدسات متدرجة تحجب 100% من الأشعة فوق البنفسجية UV400 مع ذراعين معدنيين.',
    description_en: 'Iconic retro-inspired round frames with metal temples and gradient lenses offering 100% UV protection.',
    brand_slug: 'ray-ban',
    category_slug: 'womens',
    base_price: 2250000,
    discount_percentage: 0,
    image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80',
    sizes: ['Standard 54mm']
  }
];

async function seedWomensCatalog() {
  console.log('Seeding 100% Authentic Women Catalog (0 Humans, 100% Studio Product Shots)...\n');

  const { data: brands } = await supabase.from('brands').select('id, slug');
  const { data: categories } = await supabase.from('categories').select('id, slug');

  const brandMap = {};
  brands.forEach(b => brandMap[b.slug] = b.id);

  const catMap = {};
  categories.forEach(c => catMap[c.slug] = c.id);

  for (const item of womensProducts) {
    const brandId = brandMap[item.brand_slug];
    const catId = catMap[item.category_slug];

    if (!brandId || !catId) {
      console.error(`Missing brand (${item.brand_slug}) or category (${item.category_slug})`);
      continue;
    }

    // 1. Insert/Upsert Product
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .upsert({
        slug: item.slug,
        name_ar: item.name_ar,
        name_en: item.name_en,
        description_ar: item.description_ar,
        description_en: item.description_en,
        brand_id: brandId,
        category_id: catId,
        base_price: item.base_price,
        discount_percentage: item.discount_percentage > 0 ? item.discount_percentage : null,
        is_featured: true,
        status: 'published',
        is_active: true
      }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (prodErr || !product) {
      console.error('Error inserting product:', item.slug, prodErr?.message);
      continue;
    }

    console.log(`✓ Product created/updated: ${item.slug} (${product.id})`);

    // 2. Product Image
    await supabase.from('product_images').delete().eq('product_id', product.id);
    await supabase.from('product_images').insert({
      product_id: product.id,
      url: item.image_url,
      is_primary: true,
      sort_order: 0
    });

    // 3. Product Variants
    await supabase.from('product_variants').delete().eq('product_id', product.id);
    const variants = item.sizes.map((size, idx) => ({
      product_id: product.id,
      sku: `${item.slug.toUpperCase().slice(0, 10)}-${idx + 1}`,
      price_syp: item.base_price,
      stock_quantity: 15,
      is_active: true
    }));
    await supabase.from('product_variants').insert(variants);
    console.log(`  -> Inserted image and ${variants.length} variants for ${item.slug}`);
  }

  console.log('\nFinished seeding women collection successfully!');
}

seedWomensCatalog();
