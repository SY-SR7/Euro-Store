const path = require('path');
const fs = require('fs');
const { createClient } = require(path.join(__dirname, '../apps/web/node_modules/@supabase/supabase-js'));
require(path.join(__dirname, '../apps/web/node_modules/dotenv')).config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Exchange rate EUR to SYP
const EUR_TO_SYP = 15000;

// Curated list of famous real products to query Amazon for each brand
const BRAND_PRODUCTS_SPECS = [
  // 1. Adidas
  {
    brand: 'Adidas',
    categorySlug: 'shoes',
    items: [
      {
        query: 'adidas samba og white black',
        slug: 'adidas-samba-og-white-black',
        nameAr: 'حذاء أديداس سامبا كلاسيك أبيض وأسود OG',
        nameEn: 'Adidas Originals Samba OG Cloud White & Core Black',
        descAr: 'حذاء أديداس سامبا الكلاسيكي الأسطوري، مصنوع من الجلد الفاخر مع طبقة T-toe من جلد السويد وقاعدة مطاطية مرنة ذات ثبات عالي.',
        descEn: 'The legendary Adidas Samba OG classic sneaker featuring premium full-grain leather, suede T-toe overlay, and iconic gum rubber outsole.',
        colors: [{ ar: 'أبيض وأسود', en: 'Cloud White / Core Black', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'جلد طبيعي وسويد',
        materialEn: 'Genuine Leather & Suede',
        basePriceEur: 120
      },
      {
        query: 'adidas gazelle sneaker core black',
        slug: 'adidas-gazelle-core-black',
        nameAr: 'حذاء أديداس غازيل كلاسيك أسود مخملي',
        nameEn: 'Adidas Originals Gazelle Core Black Suede',
        descAr: 'حذاء أديداس غازيل الكلاسيكي بتصميم الثمانينات الشهير من جلد السويد الناعم مع خطوط أديداس الثلاثية البيضاء.',
        descEn: 'The timeless Adidas Gazelle low-top sneaker crafted in soft velvet suede with contrasting white three-stripes.',
        colors: [{ ar: 'أسود ملكي', en: 'Core Black', hex: '#1C1917' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد سويد فاخر',
        materialEn: 'Premium Suede Leather',
        basePriceEur: 110
      },
      {
        query: 'adidas superstar white black',
        slug: 'adidas-superstar-white-black',
        nameAr: 'حذاء أديداس سوبر ستار كلاسيك شيل تو',
        nameEn: 'Adidas Originals Superstar Shell Toe White Black',
        descAr: 'أيقونة كرة السلة والشارع بمقدمة الشيل تو المطاطية الشهيرة والجلد الناعم المتين.',
        descEn: 'The iconic street-style superstar with authentic rubber shell-toe and full grain leather upper.',
        colors: [{ ar: 'أبيض كلاسيك', en: 'Cloud White', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'جلد طبيعي ناعم',
        materialEn: 'Full Grain Leather',
        basePriceEur: 115
      },
      {
        query: 'adidas ultraboost light running shoes',
        slug: 'adidas-ultraboost-light-core-black',
        nameAr: 'حذاء أديداس ألترا بوست لايت للجري فائق الراحة',
        nameEn: 'Adidas Ultraboost Light Performance Running Shoes',
        descAr: 'حذاء الجري فائق الخفة بتقنية Boost المطورة ونعل Continental لراحة تدوم طوال اليوم واستجابة طاقة استثنائية.',
        descEn: 'Ultra-lightweight performance running shoes with Light Boost midsole cushioning and Continental rubber grip.',
        colors: [{ ar: 'أسود فحمي', en: 'Core Black Carbon', hex: '#111827' }],
        sizes: ['EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'نسيج برايم نيت تقني',
        materialEn: 'Primeknit+ Technical Textile',
        basePriceEur: 190
      },
      {
        query: 'adidas tiro trainingshose black',
        slug: 'adidas-tiro-track-pants-black',
        nameAr: 'بنطال أديداس تيرو الرياضي بتقنية AEROREADY',
        nameEn: 'Adidas Tiro Classic Slim Track Pants',
        descAr: 'بنطال رياضي بقصة ضيقة أنيقة وسحابات للكاحل مع قماش ماص للعرق بتقنية AEROREADY.',
        descEn: 'Classic slim-fit athletic track pants with ankle zips and moisture-wicking AEROREADY fabric.',
        colors: [{ ar: 'أسود مع خطوط بيضاء', en: 'Black / White', hex: '#1C1917' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'بوليستر معاد تدويره مسامي',
        materialEn: '100% Recycled Polyester',
        basePriceEur: 55
      }
    ]
  },

  // 2. Nike
  {
    brand: 'Nike',
    categorySlug: 'shoes',
    items: [
      {
        query: 'nike air force 1 07 all white',
        slug: 'nike-air-force-1-07-white',
        nameAr: 'حذاء نايك إير فورس 1 07 الأبيض الأسطوري',
        nameEn: 'Nike Air Force 1 07 Triple White Classic',
        descAr: 'الحذاء الأكثر شهرة عالمياً باللون الأبيض الناصع مع وسادة Air المدمجة والجلد النقي المتين.',
        descEn: 'The iconic all-white basketball legend crafted from crisp leather edges and encapsulated Nike Air sole.',
        colors: [{ ar: 'أبيض ناصع', en: 'Triple White', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'جلد طبيعي مصقول',
        materialEn: 'Crisp Genuine Leather',
        basePriceEur: 130
      },
      {
        query: 'nike air max 90 white black',
        slug: 'nike-air-max-90-essential',
        nameAr: 'حذاء نايك إير ماكس 90 كلاسيك ريترو',
        nameEn: 'Nike Air Max 90 Classic Heritage Sneaker',
        descAr: 'حذاء التسعينات الأسطوري بنافذة Air المرئية والطبقات الهندسية المميزة للراحة والأناقة.',
        descEn: 'Heritage running legend with visible Max Air cushioning and stitched waffle overlays.',
        colors: [{ ar: 'أبيض ورمادي', en: 'White / Wolf Grey', hex: '#F3F4F6' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد ونسيج شبكي مبطن',
        materialEn: 'Leather & Mesh Upper',
        basePriceEur: 150
      },
      {
        query: 'nike dunk low retro black white panda',
        slug: 'nike-dunk-low-retro-panda',
        nameAr: 'حذاء نايك دونك لو ريترو باندا الأبيض والأسود',
        nameEn: 'Nike Dunk Low Retro Panda Black White',
        descAr: 'حذاء الباندا الأكثر طلباً بتصميمه الكلاسيكي ثنائي اللون من الجلد الفاخر وبطانة الكاحل المريحة.',
        descEn: 'The sought-after Dunk Low Panda featuring iconic two-tone leather color-blocking and padded low-cut collar.',
        colors: [{ ar: 'أبيض وأسود باندا', en: 'Panda Black & White', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'جلد ناعم مزدوج',
        materialEn: 'Smooth Dual Leather',
        basePriceEur: 140
      },
      {
        query: 'nike air max 270 black white',
        slug: 'nike-air-max-270-black',
        nameAr: 'حذاء نايك إير ماكس 270 العصري أسود وأبيض',
        nameEn: 'Nike Air Max 270 Lifestyle Running Shoes',
        descAr: 'يتميز بأكبر كعب هوائي Air 270 فائق النعومة مع جزء علوي مرن وخفيف كالشراب.',
        descEn: 'Features Nike\'s biggest Max Air heel unit for super-soft cushioning and a breathable sock-like mesh fit.',
        colors: [{ ar: 'أسود مع كعب أبيض', en: 'Black / White', hex: '#1C1917' }],
        sizes: ['EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'نسيج شبكي مرن مع وحدة Air',
        materialEn: 'Engineered Mesh & Max Air Unit',
        basePriceEur: 160
      },
      {
        query: 'nike tech fleece hoodie black',
        slug: 'nike-tech-fleece-full-zip-hoodie',
        nameAr: 'جاكيت نايك تيك فليس بسحاب كامل وغطاء رأس',
        nameEn: 'Nike Sportswear Tech Fleece Full-Zip Windrunner Hoodie',
        descAr: 'سترة تيك فليس التقنية خفيفة الوزن التي توفر دفئاً فائقاً بدون أي ثقل أو حجم زائد مع جيب كم بسحاب.',
        descEn: 'Premium lightweight Tech Fleece fabric that packs immense warmth with signature chevron chest lines.',
        colors: [{ ar: 'أسود فحمي', en: 'Black', hex: '#1C1917' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'تيك فليس تقني عازل',
        materialEn: 'Tech Fleece 66% Cotton / 34% Polyester',
        basePriceEur: 125
      }
    ]
  },

  // 3. Puma
  {
    brand: 'Puma',
    categorySlug: 'shoes',
    items: [
      {
        query: 'puma suede classic xxi black white',
        slug: 'puma-suede-classic-xxi-black',
        nameAr: 'حذاء بوما سويد كلاسيك XXI أسود وأبيض',
        nameEn: 'Puma Suede Classic XXI Iconic Sneaker',
        descAr: 'الحذاء الأيقوني من بوما المصنوع بالكامل من جلد السويد الناعم مع شريط بوما الجانبي المتباين.',
        descEn: 'The definitive street icon made with full suede leather upper and synthetic lining.',
        colors: [{ ar: 'أسود مع شريط أبيض', en: 'Puma Black / White', hex: '#1C1917' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد سويد أصلي',
        materialEn: '100% Genuine Suede',
        basePriceEur: 85
      },
      {
        query: 'puma smash v2 leather sneaker white',
        slug: 'puma-smash-v2-leather-white',
        nameAr: 'حذاء بوما سماش v2 الجلدي كلاسيك أبيض',
        nameEn: 'Puma Smash V2 Leather Low-Top Sneaker',
        descAr: 'حذاء مستوحى من ملاعب التنس الكلاسيكية بجلد ناعم مريح ونعل داخلي مريح SoftFoam+.',
        descEn: 'Tennis-inspired classic court shoe with soft leather upper and SoftFoam+ comfort insert.',
        colors: [{ ar: 'أبيض ناصع', en: 'Puma White', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'جلد طبيعي ناعم',
        materialEn: 'Soft Leather Upper',
        basePriceEur: 70
      },
      {
        query: 'puma caven low sneaker white green',
        slug: 'puma-caven-retro-sneaker',
        nameAr: 'حذاء بوما كافين ريترو كلاسيك أبيض',
        nameEn: 'Puma Caven Retro Court Sneaker',
        descAr: 'حذاء ريترو بطابع الثمانينات بلمسات جلدية فاخرة ونعل مطاطي سميك ومرن.',
        descEn: '80s classic basketball-inspired sneaker with stacked midsole texture and SoftFoam+ cushioning.',
        colors: [{ ar: 'أبيض مع لمسات خضراء', en: 'White / Archive Green', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد تركيبي متين',
        materialEn: 'Durable Synthetic Leather',
        basePriceEur: 65
      },
      {
        query: 'puma essential logo fleece hoodie black',
        slug: 'puma-essentials-fleece-hoodie',
        nameAr: 'هودي بوما إسنشالز بالشعار المميز قطن دافئ',
        nameEn: 'Puma Essentials Big Logo Fleece Hoodie',
        descAr: 'سترة هودي مريحة من الصوف القطني الناعم مع جيب كانغرو وشعار بوما الكبير على الصدر.',
        descEn: 'Cosy fleece hoodie with kangaroo pocket and bold Puma No. 1 chest logo.',
        colors: [{ ar: 'أسود', en: 'Puma Black', hex: '#1C1917' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'قطن صوفي ناعم',
        materialEn: '66% Cotton / 34% Polyester Fleece',
        basePriceEur: 50
      }
    ]
  },

  // 4. Lacoste
  {
    brand: 'Lacoste',
    categorySlug: 'men',
    items: [
      {
        query: 'lacoste classic fit l1212 polo navy blue',
        slug: 'lacoste-classic-l1212-polo-navy',
        nameAr: 'قميص بولو لاكوست كلاسيك L.12.12 كحلي',
        nameEn: 'Lacoste Classic Fit L.12.12 Piqué Polo Shirt Navy Blue',
        descAr: 'قميص البولو الفرنسي الأيقوني المبتكر عام 1933 من نسيج قطن البيكيه الفاخر مع شعار التمساح الأخضر المطرز.',
        descEn: 'The original 1933 French iconic polo shirt crafted in signature petit piqué cotton with embroidered green crocodile.',
        colors: [{ ar: 'كحلي ملكي', en: 'Navy Blue', hex: '#1E293B' }, { ar: 'أبيض ناصع', en: 'Blanc White', hex: '#FFFFFF' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'قطن بيتيت بيكيه 100%',
        materialEn: '100% Cotton Petit Piqué',
        basePriceEur: 110
      },
      {
        query: 'lacoste carnabys evo leather sneaker white',
        slug: 'lacoste-carnaby-evo-leather-sneakers',
        nameAr: 'حذاء لاكوست كارنابي إيفو الجلدي أبيض',
        nameEn: 'Lacoste Carnaby Evo Leather Court Sneakers',
        descAr: 'حذاء تنس جلدي أبيض فاخر بخطوط انسيابية ناعمة وتمساح لاكوست الكلاسيكي المطرز.',
        descEn: 'Refined low-profile court sneaker in soft nappa leather with signature embroidered crocodile badge.',
        colors: [{ ar: 'أبيض مع تمساح أخضر', en: 'White / Green', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'جلد نابا طبيعي فاخر',
        materialEn: 'Premium Nappa Leather',
        basePriceEur: 125
      },
      {
        query: 'lacoste classic cap navy',
        slug: 'lacoste-classic-cotton-gabardine-cap',
        nameAr: 'قبعة لاكوست كلاسيك من قطن الغاباردين',
        nameEn: 'Lacoste Classic Cotton Gabardine Baseball Cap',
        descAr: 'قبعة بيسبول فاخرة من قطن الغاباردين المتين بحزام خلفي قابل للتعديل وشعار التمساح الأخضر المطرز.',
        descEn: 'Timeless protective baseball cap in durable cotton gabardine with adjustable back strap.',
        colors: [{ ar: 'كحلي', en: 'Navy Blue', hex: '#1E293B' }, { ar: 'أسود', en: 'Black', hex: '#1C1917' }],
        sizes: ['One Size'],
        materialAr: 'قطن غاباردين 100%',
        materialEn: '100% Cotton Gabardine',
        basePriceEur: 55
      }
    ]
  },

  // 5. Tommy Hilfiger
  {
    brand: 'Tommy Hilfiger',
    categorySlug: 'men',
    items: [
      {
        query: 'tommy hilfiger core stretch slim polo desert sky',
        slug: 'tommy-hilfiger-core-stretch-polo',
        nameAr: 'بولو تومي هيلفيغر كلاسيك قطن مطاط كحلي',
        nameEn: 'Tommy Hilfiger Core Stretch Slim Fit Polo Shirt',
        descAr: 'قميص بولو كلاسيكي بقصة سليم فت أنيقة مصنوع من القطن العضوي المطاطي مع تطريز علم تومي هيلفيغر على الصدر.',
        descEn: 'Essential slim-fit polo crafted from organic stretch cotton piqué with signature flag embroidery on chest.',
        colors: [{ ar: 'كحلي ديزرت سكاي', en: 'Desert Sky Navy', hex: '#1E293B' }, { ar: 'أبيض ناصع', en: 'Optic White', hex: '#FFFFFF' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'قطن عضوي مطاط 96%',
        materialEn: '96% Organic Cotton / 4% Elastane',
        basePriceEur: 89
      },
      {
        query: 'tommy hilfiger corporate leather sneaker white',
        slug: 'tommy-hilfiger-corporate-leather-sneaker',
        nameAr: 'حذاء تومي هيلفيغر كلاسيك جلدي بشريط العلم',
        nameEn: 'Tommy Hilfiger Corporate Leather Low-Top Sneaker',
        descAr: 'حذاء سنيكرز كلاسيكي من الجلد الطبيعي الأبيض مع تفاصيل شريط علم تومي هيلفيغر الجانبي.',
        descEn: 'Smart-casual white leather trainers accented with signature corporate ribbon stripe on side panels.',
        colors: [{ ar: 'أبيض كلاسيك', en: 'White / Corporate Stripe', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد طبيعي ناعم',
        materialEn: '100% Genuine Leather',
        basePriceEur: 110
      },
      {
        query: 'tommy hilfiger leather belt dark brown',
        slug: 'tommy-hilfiger-classic-leather-belt',
        nameAr: 'حزام تومي هيلفيغر جلدي فاخر بإبزيم معدني',
        nameEn: 'Tommy Hilfiger Classic Reversible Leather Belt',
        descAr: 'حزام رجالي أنيق من الجلد الطبيعي المدبوغ مع إبزيم معدني مصقول ومحفور بشعار تومي.',
        descEn: 'Refined men\'s dress belt crafted from smooth vegetable-tanned leather with brushed metal buckle.',
        colors: [{ ar: 'بني داكن', en: 'Dark Brown', hex: '#451A03' }, { ar: 'أسود', en: 'Black', hex: '#1C1917' }],
        sizes: ['85 cm', '90 cm', '95 cm', '100 cm', '105 cm'],
        materialAr: 'جلد طبيعي 100%',
        materialEn: '100% Cowhide Leather',
        basePriceEur: 60
      }
    ]
  },

  // 6. Calvin Klein
  {
    brand: 'Calvin Klein',
    categorySlug: 'men',
    items: [
      {
        query: 'calvin klein cotton stretch boxer briefs 3 pack black',
        slug: 'calvin-klein-boxer-briefs-3pack',
        nameAr: 'طقم بوكسر كالفن كلاين قطن مطاط 3 قطع أسود',
        nameEn: 'Calvin Klein Cotton Stretch Boxer Briefs 3-Pack',
        descAr: 'البوكسر الأكثر شهرة في العالم من القطن الناعم والمطاطي مع حزام الخصر الأيقوني المطرز باسم Calvin Klein.',
        descEn: 'The world\'s most recognized underwear essentials in breathable stretch cotton with signature repeat logo waistband.',
        colors: [{ ar: 'أسود كلاسيك', en: 'Black 3-Pack', hex: '#1C1917' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'قطن مطاط فائق النعومة',
        materialEn: '95% Cotton / 5% Elastane',
        basePriceEur: 45
      },
      {
        query: 'calvin klein monogram logo t shirt black',
        slug: 'calvin-klein-monogram-tshirt',
        nameAr: 'تيشيرت كالفن كلاين مونوغرام قطن أصلي',
        nameEn: 'Calvin Klein Monogram Logo Crew Neck T-Shirt',
        descAr: 'تيشيرت عصري بقصة مريحة من القطن الناعم يحمل طبعة مونوغرام CK الكلاسيكية على الصدر.',
        descEn: 'Modern casual crew neck t-shirt in pure organic cotton with archival CK monogram chest print.',
        colors: [{ ar: 'أسود', en: 'Black', hex: '#1C1917' }, { ar: 'أبيض', en: 'White', hex: '#FFFFFF' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'قطن عضوي 100%',
        materialEn: '100% Organic Cotton',
        basePriceEur: 42
      }
    ]
  },

  // 7. Ray-Ban
  {
    brand: 'Ray-Ban',
    categorySlug: 'accessories',
    items: [
      {
        query: 'ray ban aviator classic rb3025 gold green',
        slug: 'ray-ban-aviator-classic-rb3025-gold',
        nameAr: 'نظارة ريبان أفياتور كلاسيك الذهبية الأصلية RB3025',
        nameEn: 'Ray-Ban Aviator Classic Gold Frame Green G-15 Lens RB3025',
        descAr: 'نظارة الطيارين الأسطورية الأصلية بإطار معدني ذهبي رفيع وعدسات G-15 الكريستالية الخضراء مع حماية 100% من الأشعة فوق البنفسجية.',
        descEn: 'The quintessential 1937 pilot sunglasses with polished gold metal frame and authentic crystal green G-15 UV lenses.',
        colors: [{ ar: 'إطار ذهبي وعدسات خضراء G-15', en: 'Gold / Green Classic G-15', hex: '#D4AF37' }],
        sizes: ['Standard 58mm', 'Large 62mm'],
        materialAr: 'معدن مطلي بالذهب وزجاج كريستالي',
        materialEn: 'Gold Plated Metal & Crystal Glass',
        basePriceEur: 165
      },
      {
        query: 'ray ban wayfarer classic rb2140 black green',
        slug: 'ray-ban-original-wayfarer-rb2140',
        nameAr: 'نظارة ريبان وايفارير كلاسيك إطار أسود RB2140',
        nameEn: 'Ray-Ban Original Wayfarer Classic Black RB2140',
        descAr: 'تصميم الوايفارير الأيقوني الذي غير عالم النظارات من الأسيتات الأسود اللامع وعدسات كريستال G-15.',
        descEn: 'The most recognizable style in sunglasses history with polished black acetate frame and crystal green lenses.',
        colors: [{ ar: 'أسود لامع', en: 'Polished Black', hex: '#1C1917' }],
        sizes: ['50mm (Medium)', '54mm (Large)'],
        materialAr: 'أسيتات فاخر وعدسات كريستال',
        materialEn: 'Premium Acetate & Crystal Glass',
        basePriceEur: 160
      }
    ]
  },

  // 8. Casio G-Shock
  {
    brand: 'Casio G-Shock',
    categorySlug: 'accessories',
    items: [
      {
        query: 'casio g shock ga 2100 1a1er black',
        slug: 'casio-g-shock-ga-2100-all-black-casioak',
        nameAr: 'ساعة كاسيو جي شوك كاسيوك الفولاذية باللون الأسود الكامل GA-2100',
        nameEn: 'Casio G-Shock Carbon Core Guard Octagonal GA-2100-1A1ER All Black',
        descAr: 'ساعة الجي شوك الأكثر شعبية بالعالم بتصميمها الثماني الأنيق (كاسيوك) وهيكل الكربون الصلب المقاوم للصدمات والماء حتى عمق 200 متر.',
        descEn: 'The iconic "CasiOak" octagonal minimalist stealth timepiece featuring Carbon Core Guard and 200m water resistance.',
        colors: [{ ar: 'أسود بالكامل (Stealth Black)', en: 'All Black Stealth', hex: '#1C1917' }],
        sizes: ['قطر 45.4 مم'],
        materialAr: 'كربون معزز وراتينج مقوى',
        materialEn: 'Carbon Fiber Reinforced Resin',
        basePriceEur: 110
      },
      {
        query: 'casio vintage a168wa 1yes silver digital watch',
        slug: 'casio-vintage-digital-a168wa-silver',
        nameAr: 'ساعة كاسيو فينتاج الرقمية الفضية كلاسيك A168WA',
        nameEn: 'Casio Vintage Digital Chronograph Steel Watch A168WA',
        descAr: 'ساعة كاسيو الرقمية الكلاسيكية الفضية بإضاءة إليكترولومينيسنت وسوار ستانلس ستيل غير قابل للصدأ ومؤقت دقيق.',
        descEn: 'Iconic retro digital watch with stainless steel bracelet, EL backlight, daily alarm, and 1/100-second stopwatch.',
        colors: [{ ar: 'فضي معدني', en: 'Silver Stainless Steel', hex: '#E5E7EB' }],
        sizes: ['مقاس كلاسيكي 38 مم'],
        materialAr: 'ستانلس ستيل غير قابل للصدأ',
        materialEn: 'Stainless Steel',
        basePriceEur: 45
      }
    ]
  },

  // 9. Chanel
  {
    brand: 'Chanel',
    categorySlug: 'luxury',
    items: [
      {
        query: 'chanel bleu de chanel eau de parfum spray 100ml',
        slug: 'chanel-bleu-de-chanel-edp-100ml',
        nameAr: 'عطر شانيل بلو دي شانيل أو دو بارفان رجالي 100 مل',
        nameEn: 'Chanel Bleu de Chanel Eau de Parfum Spray 100ml',
        descAr: 'العطر الخشبي الأروماتي الآسر للرجل الحر مع نفحات العنبر وخشب الصندل الكاليدوني الفاخر مع لمسات الحمضيات المنعشة.',
        descEn: 'An aromatic-woody fragrance with captivating trail of cedar and New Caledonian sandalwood.',
        colors: [{ ar: 'زجاجة كحلية داكنة فاخرة', en: 'Deep Navy Blue Bottle', hex: '#0F172A' }],
        sizes: ['100 ml (3.4 FL. OZ.)', '50 ml (1.7 FL. OZ.)'],
        materialAr: 'ماء عطر مركز (Eau de Parfum)',
        materialEn: 'Eau de Parfum Spray',
        basePriceEur: 155
      },
      {
        query: 'chanel coco mademoiselle eau de parfum 100ml',
        slug: 'chanel-coco-mademoiselle-edp-100ml',
        nameAr: 'عطر شانيل كوكو مادموزيل أو دو بارفان نسائي 100 مل',
        nameEn: 'Chanel Coco Mademoiselle Eau de Parfum 100ml',
        descAr: 'العطر الشرقي الأنثوي الأسطوري بنفحات البرتقال الحيوي والورد والياسمين وقاعدة غنية من الباتشولي ونجيل الهند.',
        descEn: 'An irresistible ambery fragrance with vivid orange sparks, clear jasmine & rose heart, and pure patchouli accents.',
        colors: [{ ar: 'زجاجة وردية كريستالية', en: 'Blush Crystal Bottle', hex: '#FDF2F8' }],
        sizes: ['100 ml (3.4 FL. OZ.)'],
        materialAr: 'ماء عطر مركز فاخر',
        materialEn: 'Eau de Parfum Spray',
        basePriceEur: 160
      }
    ]
  },

  // 10. Dior
  {
    brand: 'Dior',
    categorySlug: 'luxury',
    items: [
      {
        query: 'dior sauvage eau de parfum 100ml spray',
        slug: 'dior-sauvage-eau-de-parfum-100ml',
        nameAr: 'عطر ديور سوفاج أو دو بارفان رجالي 100 مل',
        nameEn: 'Dior Sauvage Eau de Parfum 100ml Spray',
        descAr: 'العطر الرجالي الأكثر مبيعاً في العالم بنفحات البرغموت الكالابري الحيوية وجاذبية الفانيليا الغامضة والأخشاب الدخانية.',
        descEn: 'The world\'s #1 bestselling men\'s fragrance blending juicy Calabrian bergamot with sensual Papua New Guinean vanilla absolute.',
        colors: [{ ar: 'زجاجة ديور التدرجية الليلية', en: 'Midnight Gradient Bottle', hex: '#1E1B4B' }],
        sizes: ['100 ml (3.4 FL. OZ.)', '60 ml (2.0 FL. OZ.)'],
        materialAr: 'ماء عطر مركز (Eau de Parfum)',
        materialEn: 'Eau de Parfum Natural Spray',
        basePriceEur: 145
      }
    ]
  },

  // 11. Gucci
  {
    brand: 'Gucci',
    categorySlug: 'luxury',
    items: [
      {
        query: 'gucci gg marmont matelasse small shoulder bag black',
        slug: 'gucci-gg-marmont-matelasse-shoulder-bag',
        nameAr: 'حقيبة غوتشي جي جي مارمونت الجلدية المبطنة بحزام سلسلة',
        nameEn: 'Gucci GG Marmont Small Matelassé Shoulder Bag Black',
        descAr: 'حقيبة كتف فاخرة من جلد الشيفرون المبطن باللون الأسود مزينة بحلية Double G الذهبية الأيقونية وسلسلة كتف معدنية منزلقة.',
        descEn: 'Iconic structured shoulder bag in black matelassé chevron leather finished with antique gold-toned Double G hardware.',
        colors: [{ ar: 'أسود ملكي مع ذهبي عتيق', en: 'Black / Antique Gold', hex: '#1C1917' }],
        sizes: ['Small (26 x 15 x 7 cm)'],
        materialAr: 'جلد شيفرون طبيعي 100%',
        materialEn: '100% Matelassé Chevron Leather',
        basePriceEur: 1890
      }
    ]
  },

  // 12. New Balance
  {
    brand: 'New Balance',
    categorySlug: 'shoes',
    items: [
      {
        query: 'new balance 574 core grey sneaker',
        slug: 'new-balance-574-core-grey',
        nameAr: 'حذاء نيو بالانس 574 كلاسيك ريترو رمادي',
        nameEn: 'New Balance 574 Core Classic Grey Sneaker',
        descAr: 'الحذاء الأكثر شهرة وتاريخاً من نيو بالانس بجلد السويد الرمادي وتقنية ENCAP لتوفير دعم وثبات استثنائي.',
        descEn: 'The quintessential New Balance running shoe featuring iconic grey suede upper and ENCAP midsole technology.',
        colors: [{ ar: 'رمادي كلاسيك', en: 'Classic Grey', hex: '#9CA3AF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
        materialAr: 'جلد سويد وشبكة تنفس',
        materialEn: 'Suede & Mesh Upper',
        basePriceEur: 110
      },
      {
        query: 'new balance 550 low white green',
        slug: 'new-balance-550-white-green',
        nameAr: 'حذاء نيو بالانس 550 كلاسيك كرة سلة أبيض وأخضر',
        nameEn: 'New Balance 550 Basketball Retro White Green',
        descAr: 'حذاء كرة السلة الكلاسيكي من أواخر الثمانينات بجلد أبيض عالي الجودة وتفاصيل خضراء عتيقة.',
        descEn: 'Tribute to 1989 pro basketball players with premium leather construction and vintage dark green accents.',
        colors: [{ ar: 'أبيض وأخضر غابات', en: 'White / Dark Green', hex: '#FFFFFF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد طبيعي متين',
        materialEn: 'Premium Heavy-duty Leather',
        basePriceEur: 130
      }
    ]
  },

  // 13. Converse
  {
    brand: 'Converse',
    categorySlug: 'shoes',
    items: [
      {
        query: 'converse chuck taylor all star classic high top black',
        slug: 'converse-chuck-taylor-all-star-high-black',
        nameAr: 'حذاء كونفرس تشاك تايلور أول ستار هاي توب أسود',
        nameEn: 'Converse Chuck Taylor All Star High Top Black Canvas',
        descAr: 'حذاء القماش الأسطوري عالي الرقبة برقعة الكاحل الأيقونية وتصميم لا يتغير منذ أكثر من قرن.',
        descEn: 'The definitive high-top canvas sneaker with vintage ankle patch and diamond tread outsole.',
        colors: [{ ar: 'أسود كلاسيك', en: 'Black Monochrome', hex: '#1C1917' }],
        sizes: ['EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'قماش كانفاس قطني متين',
        materialEn: 'Durable 100% Cotton Canvas',
        basePriceEur: 75
      }
    ]
  },

  // 14. Vans
  {
    brand: 'Vans',
    categorySlug: 'shoes',
    items: [
      {
        query: 'vans old skool classic black white skate shoes',
        slug: 'vans-old-skool-black-white',
        nameAr: 'حذاء فانز أولد سكول كلاسيك أسود وأبيض',
        nameEn: 'Vans Old Skool Core Classic Black & White Skateboard Shoe',
        descAr: 'حذاء التزلج الكلاسيكي الأول الذي حمل شريط فانز الجانبي (Sidestripe) بجلد سويد وقماش كانفاس متين.',
        descEn: 'The iconic skate shoe that debuted the famous side stripe, built with durable suede and canvas uppers.',
        colors: [{ ar: 'أسود مع خط أبيض', en: 'Black / True White', hex: '#1C1917' }],
        sizes: ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد سويد وقماش كانفاس',
        materialEn: 'Suede & Canvas Combination',
        basePriceEur: 80
      }
    ]
  },

  // 15. Polo Ralph Lauren
  {
    brand: 'Polo Ralph Lauren',
    categorySlug: 'men',
    items: [
      {
        query: 'polo ralph lauren custom slim fit mesh polo navy',
        slug: 'polo-ralph-lauren-custom-slim-mesh-polo',
        nameAr: 'قميص بولو رالف لورين كستوم سليم فت كحلي مطرز بالمهر',
        nameEn: 'Polo Ralph Lauren Custom Slim Fit Mesh Polo Shirt Navy',
        descAr: 'بولو رالف لورين الأيقوني من قطن البيكيه المسامي بقصة سليم فت مريحة وشعار لاعب البولو الشهير المطرز بألوان متعددة.',
        descEn: 'The definitive American style standard in breathable cotton mesh with signature multicolored pony embroidery.',
        colors: [{ ar: 'كحلي كلاسيك', en: 'Cruise Navy', hex: '#1E293B' }, { ar: 'أبيض', en: 'White', hex: '#FFFFFF' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'قطن بيكيه مسامي 100%',
        materialEn: '100% Breathable Cotton Mesh',
        basePriceEur: 120
      }
    ]
  },

  // 16. Hugo Boss
  {
    brand: 'Hugo Boss',
    categorySlug: 'men',
    items: [
      {
        query: 'boss polo shirt regular fit black',
        slug: 'boss-paddy-polo-shirt-black',
        nameAr: 'قميص بولو بوس بادي ريغولار فت أسود فاخر',
        nameEn: 'BOSS Paddy Regular Fit Luxury Piqué Polo Shirt',
        descAr: 'قميص بولو ألماني فاخر من BOSS بياقة متباينة وحواف أكمام مخططة وشعار BOSS مطرز على الصدر.',
        descEn: 'Contemporary luxury polo crafted in certified organic cotton piqué with contrast collar tipping.',
        colors: [{ ar: 'أسود مع حواف ذهبية/بيضاء', en: 'Black / Gold Tip', hex: '#1C1917' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'قطن عضوي فاخر 100%',
        materialEn: '100% Organic Piqué Cotton',
        basePriceEur: 99
      }
    ]
  },

  // 17. Versace
  {
    brand: 'Versace',
    categorySlug: 'luxury',
    items: [
      {
        query: 'versace eros eau de parfum spray 100ml',
        slug: 'versace-eros-eau-de-parfum-100ml',
        nameAr: 'عطر فرزاتشي إيروس أو دو بارفان رجالي 100 مل',
        nameEn: 'Versace Eros Eau de Parfum Spray 100ml',
        descAr: 'عطر القوة والجاذبية المستوحى من الأساطير الإغريقية بنفحات النعناع والتفاح الإيطالي وخشب الأرز وفول التونكا.',
        descEn: 'A luminous and sensual fragrance for the heroic man with vibrant Italian lemon, mint, and cedarwood.',
        colors: [{ ar: 'زجاجة زرقاء زمردية بشعار ميدوسا', en: 'Turquoise Blue Medusa Bottle', hex: '#0284C7' }],
        sizes: ['100 ml (3.4 FL. OZ.)', '50 ml (1.7 FL. OZ.)'],
        materialAr: 'ماء عطر مكثف (Eau de Parfum)',
        materialEn: 'Eau de Parfum Intense Spray',
        basePriceEur: 115
      }
    ]
  },

  // 18. Prada
  {
    brand: 'Prada',
    categorySlug: 'luxury',
    items: [
      {
        query: 'prada paradoxe eau de parfum refillable 90ml',
        slug: 'prada-paradoxe-eau-de-parfum-90ml',
        nameAr: 'عطر برادا بارادوكس أو دو بارفان نسائي 90 مل',
        nameEn: 'Prada Paradoxe Eau de Parfum Refillable 90ml',
        descAr: 'العطر الزهري العنبري الثوري من برادا بزجاجته المثلثة الأيقونية ونفحات زهر البرتقال والعنبر الحيوي والمستخلصات الطبيعية.',
        descEn: 'Floral ambery fragrance that embraces the paradoxes of iconic ingredients in Prada\'s triangular signature bottle.',
        colors: [{ ar: 'زجاجة مثلثة كريستالية وردية', en: 'Triangular Crystal Bottle', hex: '#FDF2F8' }],
        sizes: ['90 ml (3.0 FL. OZ.)', '50 ml (1.7 FL. OZ.)'],
        materialAr: 'ماء عطر فاخر قابل لإعادة التعبئة',
        materialEn: 'Refillable Eau de Parfum Spray',
        basePriceEur: 150
      }
    ]
  },

  // 19. Skechers
  {
    brand: 'Skechers',
    categorySlug: 'shoes',
    items: [
      {
        query: 'skechers uno stand on air sneaker black',
        slug: 'skechers-uno-stand-on-air-black',
        nameAr: 'حذاء سكيتشرز أونو ستاند أون إير أسود ميموري فوم',
        nameEn: 'Skechers Uno Stand On Air Air-Cooled Memory Foam Sneaker',
        descAr: 'حذاء رياضي عصري بوسادة هوائية Skech-Air المرئية ونعل داخلي Air-Cooled Memory Foam لراحة استثنائية طوال اليوم.',
        descEn: 'Classic air-cushioned style meets updated comfort with visible air-cushioned midsole and Memory Foam insole.',
        colors: [{ ar: 'أسود مونوكروم', en: 'Black Monochrome', hex: '#1C1917' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد صناعي دورابك مثقّب',
        materialEn: 'Smooth Perforated Durabuck',
        basePriceEur: 85
      }
    ]
  },

  // 20. Reebok
  {
    brand: 'Reebok',
    categorySlug: 'shoes',
    items: [
      {
        query: 'reebok club c 85 vintage chalk green',
        slug: 'reebok-club-c-85-vintage-chalk',
        nameAr: 'حذاء ريبوك كلوب سي 85 فينتاج أبيض عتيق وأخضر',
        nameEn: 'Reebok Club C 85 Vintage Court Sneaker Chalk Glen Green',
        descAr: 'حذاء التنس الكلاسيكي من عام 1985 المصنوع من الجلد الفاخر الناعم مع بطانة مريحة ونعل عتيق بلون الطباشير.',
        descEn: 'Court-inspired 1985 classic constructed from buttery soft leather with retro terry lining and chalk midsole.',
        colors: [{ ar: 'أبيض عتيق وأخضر', en: 'Chalk / Glen Green', hex: '#FAF5EF' }],
        sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
        materialAr: 'جلد طبيعي ناعم جداً',
        materialEn: 'Buttery Soft Garment Leather',
        basePriceEur: 100
      }
    ]
  },

  // 21. Michael Kors
  {
    brand: 'Michael Kors',
    categorySlug: 'women',
    items: [
      {
        query: 'michael kors jet set travel tote bag black',
        slug: 'michael-kors-jet-set-travel-tote-black',
        nameAr: 'حقيبة مايكل كورس جيت ست ترافيل الجلدية سوداء',
        nameEn: 'Michael Kors Jet Set Travel Large Saffiano Leather Tote Bag',
        descAr: 'حقيبة يد فاخرة وواسعة من جلد السافيانو المقاوم للخدوش مع شعار مايكل كورس الذهبي وسحاب علوي متين.',
        descEn: 'Spacious everyday luxury tote crafted from scratch-resistant saffiano leather with polished gold-tone hardware.',
        colors: [{ ar: 'أسود مع حلية ذهبية', en: 'Black / Gold Hardware', hex: '#1C1917' }],
        sizes: ['Large (38 x 28 x 14 cm)'],
        materialAr: 'جلد سافيانو فاخر مقاوم للماء والخدش',
        materialEn: '100% Saffiano Leather',
        basePriceEur: 295
      }
    ]
  },

  // 22. Under Armour
  {
    brand: 'Under Armour',
    categorySlug: 'men',
    items: [
      {
        query: 'under armour tech 2.0 short sleeve t-shirt black',
        slug: 'under-armour-tech-2-tshirt-black',
        nameAr: 'تيشيرت أندر آرمر تك 2.0 الرياضي خفيف الوزن أسود',
        nameEn: 'Under Armour Men\'s Tech 2.0 Short Sleeve Training T-Shirt',
        descAr: 'تيشيرت تدريب تقني فائق النعومة وسريع الجفاف ومقاوم للعرق والروائح بتقنية UA Tech الأصلية.',
        descEn: 'Original go-to training gear with loose, light fabric that wicks sweat and dries incredibly fast.',
        colors: [{ ar: 'أسود', en: 'Black / Metallic Silver', hex: '#1C1917' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'نسيج تقني ماص للرطوبة 100%',
        materialEn: '100% UA Tech Polyester',
        basePriceEur: 35
      }
    ]
  },

  // 23. Emporio Armani
  {
    brand: 'Emporio Armani',
    categorySlug: 'men',
    items: [
      {
        query: 'ea7 emporio armani train core polo black',
        slug: 'ea7-emporio-armani-train-core-polo',
        nameAr: 'قميص بولو إمبوريو أرماني EA7 رياضي فاخر أسود',
        nameEn: 'Emporio Armani EA7 Train Core ID Stretch Piqué Polo',
        descAr: 'قميص بولو رياضي إيطالي أنيق من مجموعة EA7 من قطن البيكيه الناعم مع شعار النسر الفضي المميز.',
        descEn: 'Athletic luxury stretch cotton polo featuring the iconic silver EA7 eagle chest badge.',
        colors: [{ ar: 'أسود مع فضي', en: 'Black / Silver', hex: '#1C1917' }],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        materialAr: 'قطن مطاط فائق الجودة',
        materialEn: '95% Cotton / 5% Elastane',
        basePriceEur: 95
      }
    ]
  },

  // 24. Zara
  {
    brand: 'Zara',
    categorySlug: 'women',
    items: [
      {
        query: 'zara structured blazer jacket black',
        slug: 'zara-structured-double-breasted-blazer',
        nameAr: 'بليزر زارا أنيق بقصة مزدوجة الأزرار أسود',
        nameEn: 'Zara Tailored Double-Breasted Structured Blazer Jacket',
        descAr: 'سترة بليزر نسائية راقية بقصة منظمة وأكتاف محددة وأزرار أمامية متباينة لإطلالة رسمية وعصرية ساحرة.',
        descEn: 'Chic structured double-breasted blazer with peaked lapels and contrast metallic buttons.',
        colors: [{ ar: 'أسود كلاسيك', en: 'Classic Black', hex: '#1C1917' }],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        materialAr: 'قماش صوف تويل منظم',
        materialEn: 'Structured Twill Blend',
        basePriceEur: 89
      }
    ]
  }
];

async function fetchAmazonItemDetails(query) {
  const url = `https://www.amazon.de/s?k=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    const containerRegex = /<div[^>]*data-asin="([A-Z0-9]{10})"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    let match;

    while ((match = containerRegex.exec(html)) !== null) {
      const asin = match[1];
      const chunk = match[2];
      const imgMatch = chunk.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
      const titleMatch = chunk.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) || chunk.match(/alt="([^"]+)"/);
      const priceMatch = chunk.match(/<span class="a-price-whole">([0-9.,]+)<\/span>/);

      if (imgMatch && titleMatch) {
        let highResImg = imgMatch[1].replace(/\._AC_[^.]+\./, '._AC_SL1500_.');
        let title = titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"');
        let priceEur = priceMatch ? parseFloat(priceMatch[1].replace('.', '').replace(',', '.')) : null;

        if (title.length > 5 && !title.toLowerCase().includes('sponsor')) {
          return {
            asin,
            title,
            image: highResImg,
            priceEur: priceEur && !isNaN(priceEur) ? priceEur : null
          };
        }
      }
    }
    return null;
  } catch (err) {
    console.error(`Error scraping Amazon for "${query}":`, err.message);
    return null;
  }
}

async function getOrCreateAttributeValue(typeId, valAr, valEn, hex = null) {
  const { data: existing } = await supabase
    .from('attribute_values')
    .select('id')
    .eq('attribute_type_id', typeId)
    .eq('value_ar', valAr)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('attribute_values')
    .insert({
      attribute_type_id: typeId,
      value_ar: valAr,
      value_en: valEn || valAr,
      hex_color: hex
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating attribute value:', error);
    return null;
  }
  return created.id;
}

async function runImport() {
  console.log('🚀 Starting 100% Real Amazon Product Sourcing Pipeline...');

  // 1. Fetch DB Brand Map and Category Map
  const { data: dbBrands, error: bErr } = await supabase.from('brands').select('id, name, slug');
  if (bErr || !dbBrands) throw new Error('Could not fetch brands: ' + JSON.stringify(bErr));
  const brandMap = new Map(dbBrands.map(b => [b.name.toLowerCase().trim(), b.id]));

  const { data: dbCategories, error: cErr } = await supabase.from('categories').select('id, name_ar, slug');
  if (cErr || !dbCategories) throw new Error('Could not fetch categories: ' + JSON.stringify(cErr));
  const catMap = new Map(dbCategories.map(c => [c.slug, c.id]));
  const defaultCatId = dbCategories[0]?.id;

  // 2. Fetch Attribute Types
  const { data: attrTypes } = await supabase.from('attribute_types').select('id, name_ar, slug');
  const sizeTypeId = attrTypes?.find(t => t.slug === 'size' || t.name_ar === 'المقاس')?.id;
  const colorTypeId = attrTypes?.find(t => t.slug === 'color' || t.name_ar === 'اللون')?.id;
  const materialTypeId = attrTypes?.find(t => t.slug === 'material' || t.name_ar === 'الخامة')?.id;

  let importedCount = 0;

  for (const group of BRAND_PRODUCTS_SPECS) {
    const brandId = brandMap.get(group.brand.toLowerCase().trim());
    if (!brandId) {
      console.warn(`⚠️ Brand not found in DB: ${group.brand}`);
      continue;
    }

    const categoryId = catMap.get(group.categorySlug) || defaultCatId;

    for (const item of group.items) {
      console.log(`\n🔍 Searching Amazon for [${group.brand}] -> "${item.query}"...`);
      const amazonData = await fetchAmazonItemDetails(item.query);

      let finalImageUrl = amazonData?.image;
      let asin = amazonData?.asin || 'AMZ' + Math.floor(10000000 + Math.random() * 90000000);
      let eurPrice = amazonData?.priceEur || item.basePriceEur || 99;
      let priceSyp = Math.round(eurPrice * EUR_TO_SYP);
      let comparePriceSyp = Math.round(priceSyp * 1.25);

      if (!finalImageUrl) {
        console.warn(`⚠️ Could not scrape Amazon image for "${item.query}", skipping.`);
        continue;
      }

      console.log(`✅ Found Amazon Product: ${amazonData?.title?.slice(0, 50)}...`);
      console.log(`   Image URL: ${finalImageUrl}`);
      console.log(`   ASIN: ${asin} | Price: ${eurPrice} EUR -> ${priceSyp.toLocaleString()} SYP`);

      // Upsert product into DB
      const { data: existingProd } = await supabase
        .from('products')
        .select('id')
        .eq('slug', item.slug)
        .maybeSingle();

      let productId = existingProd?.id;

      if (!productId) {
        const { data: newProd, error: pErr } = await supabase.from('products').insert({
          brand_id: brandId,
          category_id: categoryId,
          name_ar: item.nameAr,
          name_en: item.nameEn,
          slug: item.slug,
          description_ar: item.descAr,
          description_en: item.descEn,
          base_price: priceSyp,
          status: 'published',
          is_active: true,
          is_featured: true,
        }).select().single();

        if (pErr || !newProd) {
          console.error('Error inserting product:', pErr);
          continue;
        }
        productId = newProd.id;
      } else {
        await supabase.from('products').update({
          brand_id: brandId,
          category_id: categoryId,
          name_ar: item.nameAr,
          name_en: item.nameEn,
          description_ar: item.descAr,
          description_en: item.descEn,
          base_price: priceSyp,
          status: 'published',
          is_active: true,
          is_featured: true,
        }).eq('id', productId);
      }

      // Upsert Product Images
      await supabase.from('product_images').delete().eq('product_id', productId);
      await supabase.from('product_images').insert({
        product_id: productId,
        url: finalImageUrl,
        is_primary: true,
        sort_order: 0,
        alt_ar: item.nameAr,
        alt_en: item.nameEn
      });

      // Clear existing variants & variant_attributes
      const { data: oldVariants } = await supabase.from('product_variants').select('id').eq('product_id', productId);
      if (oldVariants && oldVariants.length > 0) {
        const oldIds = oldVariants.map(v => v.id);
        await supabase.from('variant_attributes').delete().in('variant_id', oldIds);
        await supabase.from('product_variants').delete().eq('product_id', productId);
      }

      // Insert Variants & Link Variant Attributes
      let varIndex = 1;
      for (const col of item.colors) {
        const colorValId = colorTypeId ? await getOrCreateAttributeValue(colorTypeId, col.ar, col.en, col.hex) : null;
        const matValId = (materialTypeId && item.materialAr) ? await getOrCreateAttributeValue(materialTypeId, item.materialAr, item.materialEn || item.materialAr) : null;

        for (const sz of item.sizes) {
          const sizeValId = sizeTypeId ? await getOrCreateAttributeValue(sizeTypeId, sz, sz) : null;
          const skuCode = `${group.brand.slice(0, 3).toUpperCase()}-${asin.slice(0, 5)}-${sz.replace(/[^a-zA-Z0-9]/g, '')}-${varIndex}`;
          const stockQty = Math.floor(5 + Math.random() * 20);

          const { data: insertedVariant, error: varErr } = await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              sku: skuCode,
              price_syp: priceSyp,
              compare_price_syp: comparePriceSyp,
              stock_quantity: stockQty,
              is_active: true
            })
            .select('id')
            .single();

          if (varErr || !insertedVariant) {
            console.error('Error inserting variant:', varErr);
            continue;
          }

          const junctionRows = [];
          if (colorValId) junctionRows.push({ variant_id: insertedVariant.id, attribute_value_id: colorValId });
          if (sizeValId) junctionRows.push({ variant_id: insertedVariant.id, attribute_value_id: sizeValId });
          if (matValId) junctionRows.push({ variant_id: insertedVariant.id, attribute_value_id: matValId });

          if (junctionRows.length > 0) {
            await supabase.from('variant_attributes').insert(junctionRows);
          }

          varIndex++;
        }
      }

      console.log(`   ✨ Successfully created ${varIndex - 1} real variants with full attribute links.`);
      importedCount++;
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log(`\n🎉 DONE! Successfully imported ${importedCount} authentic Amazon products across all 24 world brands!`);
}

runImport().catch(console.error);
