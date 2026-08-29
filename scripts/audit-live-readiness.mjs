import { createRequire } from 'node:module';

const requireFromWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createClient } = requireFromWeb('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Missing Supabase audit credentials.');

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

function hostOf(value) {
  if (!value || typeof value !== 'string') return '(empty)';
  try { return new URL(value).hostname; } catch { return '(invalid)'; }
}

function collectBannerUrls(sections) {
  return sections.flatMap((section) => {
    const banners = Array.isArray(section.content?.banners) ? section.content.banners : [];
    return banners.map((banner) => ({
      section: section.section_key,
      active: banner?.is_active !== false,
      imageHost: hostOf(banner?.image_url),
      mobileImageHost: hostOf(banner?.mobile_image_url),
      hasMobileImage: Boolean(String(banner?.mobile_image_url || '').trim()),
      hasArabicTitle: Boolean(String(banner?.title_ar || '').trim()),
      hasEnglishTitle: Boolean(String(banner?.title_en || '').trim()),
      hasLink: Boolean(String(banner?.cta_url || '').trim()),
    }));
  });
}

async function readRows(table, columns) {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

const [sections, productImages, categories, brands, products, variants, storageResult] = await Promise.all([
  readRows('homepage_sections', 'section_key,content,is_active,sort_order'),
  readRows('product_images', 'url,is_primary'),
  readRows('categories', 'image_url,is_active'),
  readRows('brands', 'logo_url,is_active'),
  readRows('products', 'id,is_active'),
  readRows('product_variants', 'id,is_active,stock_quantity'),
  supabase.storage.listBuckets(),
]);

if (storageResult.error) throw new Error(`storage: ${storageResult.error.message}`);

const allUrls = [
  ...productImages.map((row) => row.url),
  ...categories.map((row) => row.image_url),
  ...brands.map((row) => row.logo_url),
].filter(Boolean);

const hosts = Object.entries(allUrls.reduce((result, value) => {
  const host = hostOf(value);
  result[host] = (result[host] ?? 0) + 1;
  return result;
}, {})).sort((a, b) => b[1] - a[1]);

const report = {
  generatedAt: new Date().toISOString(),
  projectHost: hostOf(url),
  catalog: {
    activeProducts: products.filter((row) => row.is_active).length,
    activeVariants: variants.filter((row) => row.is_active).length,
    inStockVariants: variants.filter((row) => row.is_active && Number(row.stock_quantity) > 0).length,
    productImages: productImages.length,
    activeCategories: categories.filter((row) => row.is_active).length,
    activeBrands: brands.filter((row) => row.is_active).length,
  },
  homepage: {
    sections: sections.map((row) => ({ key: row.section_key, active: row.is_active, sortOrder: row.sort_order })),
    banners: collectBannerUrls(sections),
  },
  mediaHosts: hosts.map(([host, count]) => ({ host, count })),
  storageBuckets: (storageResult.data ?? []).map((bucket) => ({ name: bucket.name, public: bucket.public })),
};

console.log(JSON.stringify(report, null, 2));
