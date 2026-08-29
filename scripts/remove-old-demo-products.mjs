/**
 * Remove all old demo products and house brands from Supabase.
 * Keeps only the 24 real world brands and their authentic products.
 */

import { createRequire } from 'node:module';
const requireFromWeb = createRequire('D:/Files/Programming_Projects/Euro Store/apps/web/package.json');
const { createClient } = requireFromWeb('@supabase/supabase-js');

const url = 'https://szhpqyvxodhaichrrdfb.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aHBxeXZ4b2RoYWljaHJyZGZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkxOTA4NywiZXhwIjoyMTAxNDk1MDg3fQ.i7alqh2XyiDs2Qxb3KLy1AZE-6nd9yVx_VHjKLGtU2Q';
const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const OLD_BRAND_SLUGS = [
  'maison-aurelia',
  'nordhavn-studio',
  'cinder-and-vale',
  'velora-atelier',
  'lumen-step',
  'little-loom'
];

async function removeOldProducts() {
  console.log('🗑️ Removing old demo products and house brands...');

  // 1. Get old brands
  const { data: oldBrands, error: bErr } = await supabase.from('brands').select('id, slug, name').in('slug', OLD_BRAND_SLUGS);
  if (bErr) throw bErr;
  console.log(`Found ${oldBrands.length} old brands.`);
  const oldBrandIds = oldBrands.map(b => b.id);

  // 2. Get old products
  const { data: oldProds, error: pErr } = await supabase.from('products').select('id, slug, name_ar').in('brand_id', oldBrandIds);
  if (pErr) throw pErr;
  console.log(`Found ${oldProds.length} old products.`);
  const oldProductIds = oldProds.map(p => p.id);

  if (oldProductIds.length === 0) {
    console.log('No old products to delete.');
    return;
  }

  // 3. Get old variants
  const { data: oldVariants } = await supabase.from('product_variants').select('id').in('product_id', oldProductIds);
  const oldVariantIds = (oldVariants || []).map(v => v.id);
  console.log(`Found ${oldVariantIds.length} old product variants.`);

  // 4. Delete related records
  if (oldVariantIds.length > 0) {
    console.log('Deleting bundle_items...');
    await supabase.from('bundle_items').delete().in('product_variant_id', oldVariantIds);

    console.log('Deleting variant_attributes...');
    await supabase.from('variant_attributes').delete().in('variant_id', oldVariantIds);

    console.log('Deleting cart_items...');
    await supabase.from('cart_items').delete().in('product_variant_id', oldVariantIds);

    console.log('Deleting product_variants...');
    await supabase.from('product_variants').delete().in('id', oldVariantIds);
  }

  console.log('Deleting collection_products...');
  await supabase.from('collection_products').delete().in('product_id', oldProductIds);

  console.log('Deleting product_images...');
  await supabase.from('product_images').delete().in('product_id', oldProductIds);

  console.log('Deleting product_reviews...');
  await supabase.from('product_reviews').delete().in('product_id', oldProductIds);

  console.log('Deleting wishlist_items...');
  await supabase.from('wishlist_items').delete().in('product_id', oldProductIds);

  console.log('Deleting old products...');
  const { error: dpErr } = await supabase.from('products').delete().in('id', oldProductIds);
  if (dpErr) console.error('Error deleting products:', dpErr.message);
  else console.log(`  ✅ Deleted ${oldProductIds.length} old products`);

  console.log('Deleting old demo brands...');
  const { error: dbErr } = await supabase.from('brands').delete().in('id', oldBrandIds);
  if (dbErr) console.error('Error deleting brands:', dbErr.message);
  else console.log(`  ✅ Deleted ${oldBrandIds.length} old brands`);

  // Verification
  const { count: remainingProds } = await supabase.from('products').select('id', { count: 'exact' });
  const { count: remainingBrands } = await supabase.from('brands').select('id', { count: 'exact' });
  const { count: remainingVariants } = await supabase.from('product_variants').select('id', { count: 'exact' });

  console.log('\n' + '='.repeat(60));
  console.log('🎉 CLEANUP COMPLETE!');
  console.log(`📊 Remaining in Database:`);
  console.log(`   • ${remainingProds} Real Products`);
  console.log(`   • ${remainingBrands} Authentic World Brands`);
  console.log(`   • ${remainingVariants} Active SKUs`);
}

removeOldProducts().catch(console.error);
