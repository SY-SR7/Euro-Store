const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([^=]+)=(.*)/);
  if (m) env[m[1]] = m[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randBool() { return Math.random() > 0.5; }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function run() {
  console.log('Wiping existing dummy data...');
  // Wipe in correct order to respect FK constraints
  await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('variant_attributes').delete().neq('variant_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('brands').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Seeding root categories...');
  const roots = [
    { name_ar: 'رجالي', name_en: 'Men', slug: 'men' },
    { name_ar: 'نسائي', name_en: 'Women', slug: 'women' },
    { name_ar: 'أطفال', name_en: 'Kids', slug: 'kids' },
  ];
  await supabase.from('categories').insert(roots);
  const { data: insertedRoots } = await supabase.from('categories').select('*').in('slug', roots.map(r => r.slug));

  console.log('Seeding subcategories...');
  const subs = [
    { name_ar: 'ملابس', name_en: 'Clothing', slug: 'clothing' },
    { name_ar: 'أحذية', name_en: 'Shoes', slug: 'shoes' },
    { name_ar: 'إكسسوارات', name_en: 'Accessories', slug: 'accessories' }
  ];
  
  const subcatsToInsert = [];
  for (const root of insertedRoots) {
    for (const sub of subs) {
      subcatsToInsert.push({
        name_ar: sub.name_ar,
        name_en: sub.name_en,
        slug: `${root.slug}-${sub.slug}`,
        parent_id: root.id,
      });
    }
  }
  await supabase.from('categories').insert(subcatsToInsert);
  const { data: categories } = await supabase.from('categories').select('*');

  console.log('Seeding brands...');
  const brandData = [
    { name: 'Nike', slug: 'nike' },
    { name: 'Adidas', slug: 'adidas' },
    { name: 'Zara', slug: 'zara' },
    { name: 'Gucci', slug: 'gucci' },
    { name: 'LocalBrand', slug: 'localbrand' }
  ];
  await supabase.from('brands').insert(brandData);
  const { data: brands } = await supabase.from('brands').select('id');

  console.log('Fetching attributes...');
  const { data: attrTypes } = await supabase.from('attribute_types').select('id, slug, name_en');
  const { data: attrValues } = await supabase.from('attribute_values').select('id, attribute_type_id, value_en');
  let colorTypeId = attrTypes.find(a => a.slug === 'color')?.id;
  let sizeTypeId = attrTypes.find(a => a.slug === 'size')?.id;
  const colors = attrValues.filter(v => v.attribute_type_id === colorTypeId);
  const sizes = attrValues.filter(v => v.attribute_type_id === sizeTypeId);

  console.log('Generating 50 highly varied products...');
  for (let i = 1; i <= 50; i++) {
    const isActive = rand(1, 10) > 2; // 80% active
    const isFeatured = randBool();
    const hasDiscount = randBool();
    const outOfStock = rand(1, 10) > 8; // 20% out of stock
    const category = randItem(categories.filter(c => c.parent_id !== null)); // Assign to subcategories
    
    // 1. Create Product
    const { data: product, error: prodErr } = await supabase.from('products').insert({
      name_ar: `منتج تجريبي معقد ${i} - ${isActive ? 'مفعل' : 'معطل'} - ${isFeatured ? 'مميز' : 'عادي'}`,
      name_en: `Complex Test Product ${i} - ${isActive ? 'Active' : 'Inactive'}`,
      slug: `test-product-complex-${i}-${Date.now()}`,
      description_ar: `هذا وصف طويل للمنتج التجريبي رقم ${i}. يحتوي على معلومات كثيرة لاختبار الواجهة الطويلة. ` + (i % 3 === 0 ? '\nسطر جديد\nوآخر' : ''),
      description_en: `This is a long description for test product ${i}. Used to test UI constraints.`,
      category_id: category.id,
      brand_id: randItem(brands).id,
      is_active: isActive,
      is_featured: isFeatured,
      tags: i % 2 === 0 ? ['جديد', 'عرض'] : [],
    }).select().single();

    if (prodErr) {
      console.error('Error inserting product', i, prodErr);
      continue;
    }

    // 2. Create Variants
    const numVariants = rand(1, 4); // 1 to 4 variants
    for (let v = 1; v <= numVariants; v++) {
      const price = rand(10, 500) * 1000;
      const comparePrice = hasDiscount ? price + rand(10, 50) * 1000 : null;
      const stock = outOfStock ? 0 : rand(1, 100);
      
      const { data: variant, error: varErr } = await supabase.from('product_variants').insert({
        product_id: product.id,
        sku: `SKU-CPLX-${product.id.substring(0, 4)}-${v}-${Date.now()}`,
        price_syp: price,
        compare_price_syp: comparePrice,
        stock_quantity: stock,
        weight_grams: rand(100, 2000),
        is_active: rand(1, 10) > 1, // 90% active variant
      }).select().single();

      if (varErr) {
        console.error('Error variant', varErr);
        continue;
      }

      // Link Attributes
      if (colors.length > 0 && sizes.length > 0) {
        // Just link random size and color
        await supabase.from('variant_attributes').insert([
          { variant_id: variant.id, attribute_value_id: randItem(colors).id },
        ]);
        await supabase.from('variant_attributes').insert([
          { variant_id: variant.id, attribute_value_id: randItem(sizes).id }
        ]);
      }
    }

    // 3. Create Images
    const numImages = rand(1, 3);
    for (let img = 1; img <= numImages; img++) {
      await supabase.from('product_images').insert({
        product_id: product.id,
        url: `https://picsum.photos/seed/${product.id}-${img}/800/800`,
        is_primary: img === 1,
        sort_order: img
      });
    }

    if (i % 10 === 0) console.log(`Inserted ${i}/50`);
  }
  console.log('Seeding complete! Restart your Next.js server to apply the next.config.js image domain changes.');
}
run();
