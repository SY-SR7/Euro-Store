const path = require('path');
const { createClient } = require(path.join(__dirname, '../apps/web/node_modules/@supabase/supabase-js'));
require(path.join(__dirname, '../apps/web/node_modules/dotenv')).config({ path: path.join(__dirname, '../apps/web/.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const categoryCovers = {
  'womens': 'https://m.media-amazon.com/images/I/71B1hp5wMAL._AC_SL1500_.jpg',
  'mens': 'https://m.media-amazon.com/images/I/61++oCXypXL._AC_SL1500_.jpg',
  'footwear': 'https://m.media-amazon.com/images/I/71M4f912LrL._AC_SL1500_.jpg',
  'bags-leather': 'https://m.media-amazon.com/images/I/71B1hp5wMAL._AC_SL1500_.jpg',
  'perfumes-beauty': 'https://m.media-amazon.com/images/I/51Hxl7J1jzL._AC_SL1500_.jpg',
  'watches-accessories': 'https://m.media-amazon.com/images/I/61g6yHKxg0L._AC_SL1500_.jpg',
  'kids': 'https://m.media-amazon.com/images/I/71D9ImsvEtL._AC_UY1000_.jpg'
};

async function fixCategoryData() {
  console.log('Fixing category images and removing duplicates...\n');

  for (const [slug, url] of Object.entries(categoryCovers)) {
    const { error } = await supabase.from('categories').update({ image_url: url, is_active: true }).eq('slug', slug);
    console.log(`✓ Updated [${slug}] cover:`, error ? error.message : 'OK');
  }

  // Deactivate duplicate 'accessories' category
  const { error: deactErr } = await supabase.from('categories').update({ is_active: false }).eq('slug', 'accessories');
  console.log('\n✓ Deactivated duplicate [accessories] category:', deactErr ? deactErr.message : 'OK');

  // Verify active main categories
  const { data: mainCats } = await supabase
    .from('categories')
    .select('id, name_ar, slug, image_url')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order');

  console.log('\n--- ACTIVE MAIN CATEGORIES IN DB ---');
  (mainCats || []).forEach(c => console.log(c.slug.padEnd(25), '|', c.name_ar.padEnd(25), '|', c.image_url));
}

fixCategoryData();
