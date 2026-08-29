import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '../../.env.local'), quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Missing live Supabase credentials');

const apply = process.argv.includes('--apply');
const bundleSlug = 'executive-luxury-outfit-bundle';
const bundlePrice = 3_600_000;
const productSlugs = [
  'aura-luxury-real-leather-jacket',
  'atelier-gold-chronograph-skeleton-watch',
  'atelier-gold-slim-leather-rfid-wallet',
];
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: bundle, error: bundleError } = await supabase
  .from('product_bundles')
  .select('id, slug, name_ar, bundle_price')
  .eq('slug', bundleSlug)
  .single();
if (bundleError) throw bundleError;

const { data: variants, error: variantsError } = await supabase
  .from('product_variants')
  .select('id, sku, price_syp, products!inner(id, slug, name_ar)')
  .eq('is_active', true)
  .in('products.slug', productSlugs)
  .order('price_syp');
if (variantsError) throw variantsError;

const bySlug = new Map();
for (const variant of variants ?? []) {
  const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
  if (product?.slug && !bySlug.has(product.slug)) bySlug.set(product.slug, { ...variant, product });
}
const selected = productSlugs.map((slug) => bySlug.get(slug));
if (selected.some((variant) => !variant)) throw new Error('A required bundle product has no active variant');

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  project: new URL(url).hostname,
  bundle: { id: bundle.id, slug: bundle.slug, name_ar: bundle.name_ar, old_price_syp: bundle.bundle_price, new_price_syp: bundlePrice },
  selected: selected.map((variant) => ({
    product_slug: variant.product.slug,
    product_name_ar: variant.product.name_ar,
    variant_id: variant.id,
    sku: variant.sku,
    price_syp: variant.price_syp,
  })),
}, null, 2));

if (apply) {
  const { error: updateError } = await supabase
    .from('product_bundles')
    .update({ bundle_price: bundlePrice })
    .eq('id', bundle.id);
  if (updateError) throw updateError;
  const { error: deleteError } = await supabase.from('bundle_items').delete().eq('bundle_id', bundle.id);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase.from('bundle_items').insert(
    selected.map((variant) => ({ bundle_id: bundle.id, product_variant_id: variant.id, quantity: 1 })),
  );
  if (insertError) throw insertError;
  console.log('Live bundle items repaired.');
}
