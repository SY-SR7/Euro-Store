import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const requireFromWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromWeb('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Missing Supabase audit credentials.');

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const outputDir = resolve('output/catalog-media-audit');
await mkdir(outputDir, { recursive: true });

async function select(table, columns) {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

const [
  products, images, categories, brands, homepageSections, variants, variantAttributes,
  attributeTypes, attributeValues, sizeGuides, collections, collectionProducts,
  bundles, bundleItems, orderItems, cartItems, cartBundleItems, wishlists, reviews,
  discountCodes, shippingRates,
] = await Promise.all([
  select('products', 'id,slug,name_ar,name_en,is_active,category_id,brand_id'),
  select('product_images', 'id,product_id,url,alt_ar,alt_en,is_primary,sort_order'),
  select('categories', 'id,slug,name_ar,name_en,image_url,parent_id,is_active'),
  select('brands', 'id,slug,name,logo_url,is_active'),
  select('homepage_sections', 'id,section_key,content,is_active'),
  select('product_variants', 'id,product_id,sku,price_syp,compare_price_syp,stock_quantity,is_active'),
  select('variant_attributes', 'variant_id,attribute_value_id'),
  select('attribute_types', 'id,slug,name_ar,name_en'),
  select('attribute_values', 'id,attribute_type_id,value_ar,value_en,hex_color,sort_order'),
  select('size_guides', 'id,name,content'),
  select('collections', 'id,slug,name_ar,name_en,is_active,is_featured_on_homepage'),
  select('collection_products', 'collection_id,product_id,sort_order'),
  select('product_bundles', 'id,slug,name_ar,name_en,bundle_price,status'),
  select('bundle_items', 'id,bundle_id,product_variant_id,quantity'),
  select('order_items', 'id,variant_id,bundle_id'),
  select('cart_items', 'customer_id,product_variant_id,quantity'),
  select('cart_bundle_items', 'customer_id,bundle_id,quantity'),
  select('wishlist_items', 'customer_id,product_id'),
  select('product_reviews', 'id,product_id,order_id,status'),
  select('discount_codes', 'id,code,is_active,valid_from,valid_until'),
  select('shipping_rates', 'id,governorate,base_rate_syp,free_shipping_threshold_syp,is_active'),
]);

const banners = homepageSections.flatMap((section) => {
  const entries = Array.isArray(section.content?.banners) ? section.content.banners : [];
  return entries.map((banner, index) => ({
    id: `${section.id}-${index}`,
    section_key: section.section_key,
    is_active: section.is_active && banner?.is_active !== false,
    ...banner,
  }));
});

const productById = new Map(products.map((row) => [row.id, row]));
const records = [
  ...images.map((row) => ({
    kind: 'product',
    id: row.id,
    owner: productById.get(row.product_id)?.slug ?? row.product_id,
    url: row.url,
  })),
  ...categories.filter((row) => row.image_url).map((row) => ({ kind: 'category', id: row.id, owner: row.slug, url: row.image_url })),
  ...brands.filter((row) => row.logo_url).map((row) => ({ kind: 'brand', id: row.id, owner: row.slug, url: row.logo_url })),
  ...banners.flatMap((row) => [
    row.image_url ? { kind: 'banner-desktop', id: row.id, owner: row.section_key, url: row.image_url } : null,
    row.mobile_image_url ? { kind: 'banner-mobile', id: row.id, owner: row.section_key, url: row.mobile_image_url } : null,
  ].filter(Boolean)),
];

function extensionFor(contentType, sourceUrl) {
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('avif')) return '.avif';
  if (contentType?.includes('gif')) return '.gif';
  const sourceExtension = extname(new URL(sourceUrl).pathname).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(sourceExtension) ? sourceExtension : '.jpg';
}

const downloaded = [];
for (const [index, record] of records.entries()) {
  const response = await fetch(record.url);
  if (!response.ok) {
    downloaded.push({ ...record, ok: false, status: response.status });
    continue;
  }
  const extension = extensionFor(response.headers.get('content-type'), record.url);
  const safeOwner = record.owner.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const filename = `${String(index + 1).padStart(3, '0')}-${record.kind}-${safeOwner}${extension}`;
  await writeFile(resolve(outputDir, filename), Buffer.from(await response.arrayBuffer()));
  downloaded.push({ ...record, ok: true, filename, contentType: response.headers.get('content-type') });
}

const report = {
  generatedAt: new Date().toISOString(),
  projectHost: new URL(url).hostname,
  counts: {
    products: products.length,
    productImages: images.length,
    categories: categories.length,
    brands: brands.length,
    banners: banners.length,
    variants: variants.length,
    variantAttributes: variantAttributes.length,
    attributeTypes: attributeTypes.length,
    attributeValues: attributeValues.length,
    sizeGuides: sizeGuides.length,
    collections: collections.length,
    collectionProducts: collectionProducts.length,
    bundles: bundles.length,
    bundleItems: bundleItems.length,
    orderItems: orderItems.length,
    cartItems: cartItems.length,
    cartBundleItems: cartBundleItems.length,
    wishlists: wishlists.length,
    reviews: reviews.length,
    discountCodes: discountCodes.length,
    shippingRates: shippingRates.length,
    mediaRecords: records.length,
    downloaded: downloaded.filter((row) => row.ok).length,
    failed: downloaded.filter((row) => !row.ok).length,
  },
  products,
  categories,
  brands,
  banners,
  variants,
  attributeTypes,
  attributeValues,
  sizeGuides,
  collections,
  bundles,
  discountCodes,
  shippingRates,
  media: downloaded,
};

await writeFile(resolve(outputDir, 'catalog-media-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report.counts, null, 2));
