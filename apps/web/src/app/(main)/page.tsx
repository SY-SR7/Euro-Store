import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ProductCard } from '@/app/catalog-components';
import { HomeBannerCarousel, type HomeBanner } from '@/components/home/HomeBannerCarousel';
import { BrandMarqueeSection } from '@/components/home/BrandMarqueeSection';
import { createAdminSupabaseClient } from '@/supabase-server';
import type { Database } from '@eurostore/database';

export const dynamic = 'force-dynamic';

type SectionKey = 'main_banner' | 'new_arrivals' | 'sales' | 'featured_brands' | 'most_popular';
type HomeSection = {
  id: string;
  section_key: SectionKey;
  title_ar: string;
  title_en: string;
  content: unknown;
  sort_order: number;
};

type ProductBase = Pick<Database['public']['Tables']['products']['Row'],
  'id' | 'name_ar' | 'name_en' | 'slug' | 'base_price' | 'discount_percentage' |
  'discount_start_at' | 'discount_end_at' | 'is_featured' | 'created_at'>;
type ProductRow = ProductBase & {
  product_images: Array<Pick<Database['public']['Tables']['product_images']['Row'], 'url' | 'is_primary' | 'sort_order'>>;
  product_variants: Array<Pick<Database['public']['Tables']['product_variants']['Row'], 'id' | 'price_syp' | 'price_override' | 'stock_quantity' | 'is_active'>>;
};
type FormattedProduct = ProductRow & {
  image_url: string;
  minPrice: number;
  variants_count: number;
  total_stock: number;
  is_on_sale: boolean;
  is_new: boolean;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function limitFrom(content: unknown) {
  const settings = record(content);
  const value = Number(settings.limit ?? settings.item_count ?? 12);
  return Number.isInteger(value) ? Math.min(24, Math.max(1, value)) : 12;
}

function formatProduct(product: ProductRow, applyDiscount = false, newBadgeDays = 30): FormattedProduct {
  const images = product.product_images;
  const variants = product.product_variants.filter((variant) => variant.is_active);
  const prices = variants.map((variant) => Number(variant.price_syp)).filter(Number.isFinite);
  const basePrice = prices.length ? Math.min(...prices) : Number(product.base_price ?? 0);
  const percentage = applyDiscount ? Number(product.discount_percentage ?? 0) : 0;
  const price = percentage > 0 ? Math.round(basePrice * (1 - percentage / 100)) : basePrice;
  const primary = images.find((image) => image.is_primary) ?? [...images].sort((a, b) => Number(a.sort_order) - Number(b.sort_order))[0];

  return {
    ...product,
    image_url: primary?.url ?? '',
    minPrice: price,
    variants_count: variants.length,
    total_stock: variants.reduce((sum, variant) => sum + Number(variant.stock_quantity ?? 0), 0),
    is_on_sale: percentage > 0,
    is_new: product.created_at ? Date.now() - new Date(product.created_at).getTime() <= newBadgeDays * 24 * 60 * 60 * 1000 : false,
  };
}

const productSelection = `
  id, name_ar, name_en, slug, base_price, discount_percentage, discount_start_at,
  discount_end_at, is_featured, created_at,
  product_images(url, is_primary, sort_order),
  product_variants(id, price_syp, price_override, stock_quantity, is_active)
`;

async function loadProducts(admin: ReturnType<typeof createAdminSupabaseClient>, key: SectionKey, content: unknown, newBadgeDays: number) {
  const limit = limitFrom(content);
  let query = admin.from('products').select(productSelection).eq('status', 'published').eq('is_active', true);

  if (key === 'new_arrivals') query = query.order('created_at', { ascending: false }).limit(limit);
  if (key === 'sales') query = query.not('discount_percentage', 'is', null).order('created_at', { ascending: false }).limit(limit * 3);
  if (key === 'most_popular') {
    const { data: soldItems } = await admin
      .from('order_items')
      .select('variant_id, quantity, orders!inner(status)')
      .in('orders.status', ['delivered', 'completed']);
    const salesByVariant = new Map<string, number>();
    for (const item of soldItems ?? []) {
      if (item.variant_id) salesByVariant.set(item.variant_id, (salesByVariant.get(item.variant_id) ?? 0) + Number(item.quantity ?? 0));
    }
    if (!salesByVariant.size) return [];
    const { data: variants } = await admin.from('product_variants').select('id, product_id').in('id', [...salesByVariant.keys()]);
    const salesByProduct = new Map<string, number>();
    for (const variant of variants ?? []) {
      if (variant.product_id) salesByProduct.set(variant.product_id, (salesByProduct.get(variant.product_id) ?? 0) + (salesByVariant.get(variant.id) ?? 0));
    }
    const productIds = [...salesByProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
    if (!productIds.length) return [];
    const { data } = await admin.from('products').select(productSelection).in('id', productIds).eq('status', 'published').eq('is_active', true);
    const byId = new Map((data ?? []).map((product) => [product.id, product]));
    return productIds.map((id) => byId.get(id)).filter((product): product is ProductRow => Boolean(product)).map((product) => formatProduct(product, false, newBadgeDays));
  }

  const { data } = await query;
  const now = Date.now();
  return (data ?? [])
    .filter((product) => key !== 'sales' || (
      Number(product.discount_percentage ?? 0) > 0 &&
      (!product.discount_start_at || new Date(product.discount_start_at).getTime() <= now) &&
      (!product.discount_end_at || new Date(product.discount_end_at).getTime() >= now)
    ))
    .slice(0, limit)
    .map((product) => formatProduct(product, key === 'sales', newBadgeDays));
}

function ProductSection({ section, products, locale }: { section: HomeSection; products: FormattedProduct[]; locale: string }) {
  if (!products.length) return null;
  const isAr = locale === 'ar';
  return (
    <section className="border-t border-border bg-background px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-text-primary md:text-4xl">{isAr ? section.title_ar : section.title_en}</h2>
          <Link href={section.section_key === 'sales' ? '/products?discount_min=1' : '/products'} className="text-sm font-bold text-primary hover:underline">
            {isAr ? 'عرض الكل' : 'View all'}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {products.map((product) => <ProductCard key={product.id} product={product} minPrice={product.minPrice} variantCount={product.variants_count} totalStock={product.total_stock} />)}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const admin = createAdminSupabaseClient();
  const [{ data }, { data: badgeSetting }] = await Promise.all([
    admin.from('homepage_sections').select('*').eq('is_active', true).order('sort_order'),
    admin.from('system_settings').select('value').eq('key', 'new_badge_days').maybeSingle(),
  ]);
  const sections = (data ?? []) as HomeSection[];
  const configuredBadgeDays = Number(badgeSetting?.value ?? 30);
  const newBadgeDays = Number.isFinite(configuredBadgeDays) ? Math.max(0, configuredBadgeDays) : 30;

  const rendered = await Promise.all(sections.map(async (section) => {
    const content = record(section.content);
    if (section.section_key === 'main_banner') {
      const banners = (Array.isArray(content.banners) ? content.banners : [])
        .filter((banner): banner is HomeBanner => Boolean(banner) && typeof banner === 'object' && (banner as HomeBanner).is_active !== false)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
      return banners.length ? <HomeBannerCarousel key={section.id} banners={banners} locale={locale} /> : null;
    }

    if (section.section_key === 'featured_brands') {
      const brandIds = Array.isArray(content.brand_ids) ? content.brand_ids.filter((id): id is string => typeof id === 'string') : [];
      let brandsQuery = admin.from('brands').select('id, name, slug, logo_url').eq('is_active', true);
      if (brandIds.length > 0) {
        brandsQuery = brandsQuery.in('id', brandIds);
      } else {
        brandsQuery = brandsQuery.order('name');
      }
      const { data: brands } = await brandsQuery;
      if (!brands || !brands.length) return null;

      let orderedBrands = brands;
      if (brandIds.length > 0) {
        const byId = new Map(brands.map((b) => [b.id, b]));
        orderedBrands = brandIds.map((id) => byId.get(id)).filter(Boolean) as typeof brands;
      }

      return (
        <BrandMarqueeSection
          key={section.id}
          title={isAr ? section.title_ar : section.title_en}
          brands={orderedBrands}
          isAr={isAr}
        />
      );
    }

    const products = await loadProducts(admin, section.section_key, section.content, newBadgeDays);
    return <ProductSection key={section.id} section={section} products={products} locale={locale} />;
  }));

  return <main className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>{rendered}</main>;
}
