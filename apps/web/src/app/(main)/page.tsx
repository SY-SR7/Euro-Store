import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ProductCard } from '@/app/catalog-components';
import { HomeBannerCarousel, type HomeBanner } from '@/components/home/HomeBannerCarousel';
import { BrandMarqueeSection } from '@/components/home/BrandMarqueeSection';
import { TrustPillars } from '@/components/home/TrustPillars';
import { CategoryBentoShowcase } from '@/components/home/CategoryBentoShowcase';
import { SneakersSpotlightSection } from '@/components/home/SneakersSpotlightSection';
import { LuxuryFragranceVault } from '@/components/home/LuxuryFragranceVault';
import { ApparelPoloSpotlight } from '@/components/home/ApparelPoloSpotlight';
import { WhyEuroStoreEditorial } from '@/components/home/WhyEuroStoreEditorial';
import { CustomerReviewsSection } from '@/components/home/CustomerReviewsSection';
import { VipClubNewsletter } from '@/components/home/VipClubNewsletter';
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
  categories?: { name_ar: string; slug: string } | null;
  brands?: { name: string; slug: string } | null;
  product_images: Array<Pick<Database['public']['Tables']['product_images']['Row'], 'url' | 'is_primary' | 'sort_order'>>;
  product_variants: Array<Pick<Database['public']['Tables']['product_variants']['Row'], 'id' | 'price_syp' | 'price_override' | 'stock_quantity' | 'is_active'>>;
};
export type FormattedProduct = ProductRow & {
  image_url: string;
  minPrice: number;
  variants_count: number;
  total_stock: number;
  is_on_sale: boolean;
  is_new: boolean;
};

function formatProduct(product: ProductRow, applyDiscount = false, newBadgeDays = 30): FormattedProduct {
  const images = product.product_images || [];
  const variants = (product.product_variants || []).filter((variant) => variant.is_active);
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
  categories(name_ar, slug),
  brands(name, slug),
  product_images(url, is_primary, sort_order),
  product_variants(id, price_syp, price_override, stock_quantity, is_active)
`;

export default async function HomePage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const admin = createAdminSupabaseClient();

  // Fetch sections, settings, brands, and catalog items in parallel
  const [
    { data: sectionsData },
    { data: badgeSetting },
    { data: brandsData },
    { data: allProductsData },
  ] = await Promise.all([
    admin.from('homepage_sections').select('*').eq('is_active', true).order('sort_order'),
    admin.from('system_settings').select('value').eq('key', 'new_badge_days').maybeSingle(),
    admin.from('brands').select('id, name, slug, logo_url').eq('is_active', true).order('name'),
    admin.from('products').select(productSelection).eq('status', 'published').eq('is_active', true).order('created_at', { ascending: false }),
  ]);

  const configuredBadgeDays = Number(badgeSetting?.value ?? 30);
  const newBadgeDays = Number.isFinite(configuredBadgeDays) ? Math.max(0, configuredBadgeDays) : 30;

  // Format all active products
  const formattedProducts = (allProductsData ?? []).map((p: any) => formatProduct(p, false, newBadgeDays));

  // Segment products for dedicated thematic sections
  const sneakersProducts = formattedProducts.filter(
    (p) =>
      p.categories?.slug === 'footwear' ||
      p.categories?.slug === 'sneakers' ||
      p.name_ar.includes('حذاء')
  );

  const fragranceProducts = formattedProducts.filter(
    (p) =>
      p.categories?.slug === 'perfumes-beauty' ||
      p.categories?.slug === 'perfumes' ||
      p.name_ar.includes('عطر')
  );

  const apparelProducts = formattedProducts.filter(
    (p) =>
      p.categories?.slug === 'mens' ||
      p.categories?.slug === 'mens-clothing' ||
      p.name_ar.includes('بولو') ||
      p.name_ar.includes('تيشيرت') ||
      p.name_ar.includes('بنطال') ||
      p.name_ar.includes('جاكيت') ||
      p.name_ar.includes('طقم')
  );

  const newArrivals = formattedProducts.slice(0, 12);

  // Extract main banner
  const bannerSection = (sectionsData ?? []).find((s) => s.section_key === 'main_banner');
  const bannerContent = bannerSection?.content && typeof bannerSection.content === 'object'
    ? (bannerSection.content as Record<string, unknown>)
    : {};
  const banners = (Array.isArray(bannerContent.banners) ? bannerContent.banners : [])
    .filter((banner): banner is HomeBanner => Boolean(banner) && typeof banner === 'object' && (banner as HomeBanner).is_active !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

  const activeBrands = brandsData ?? [];

  return (
    <main className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Hero Main Banner Carousel */}
      {banners.length > 0 && (
        <HomeBannerCarousel banners={banners} locale={locale} />
      )}

      {/* 2. Trust Pillars (100% Authentic, Express Delivery, Loyalty, Guaranteed Exchange) */}
      <TrustPillars isAr={isAr} />

      {/* 3. Continuous Infinite Brand Marquee (All 24 World Brands) */}
      {activeBrands.length > 0 && (
        <BrandMarqueeSection
          title={isAr ? 'العلامات التجارية العالمية الفاخرة' : 'World Iconic Brands'}
          brands={activeBrands}
          isAr={isAr}
        />
      )}

      {/* 4. Luxury Category Bento Grid */}
      <CategoryBentoShowcase isAr={isAr} />

      {/* 5. Iconic Sneakers Spotlight */}
      <SneakersSpotlightSection products={sneakersProducts} isAr={isAr} />

      {/* 6. Luxury Fragrance & Parfumerie Vault */}
      <LuxuryFragranceVault products={fragranceProducts} isAr={isAr} />

      {/* 7. Designer Apparel & Polos Spotlight */}
      <ApparelPoloSpotlight products={apparelProducts} isAr={isAr} />

      {/* 8. New Arrivals Grid */}
      {newArrivals.length > 0 && (
        <section className="border-t border-border/80 bg-background-card/20 px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
                  {isAr ? 'وصل حديثاً' : 'Latest Drops'}
                </span>
                <h2 className="text-2xl font-black text-text-primary md:text-4xl">
                  {isAr ? 'أحدث المنتجات المضافة إلى يورو ستور' : 'New In EuroStore'}
                </h2>
              </div>
              <Link href="/products" className="text-sm font-bold text-primary hover:underline">
                {isAr ? 'عرض كافة المنتجات' : 'View all products'}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  minPrice={product.minPrice}
                  variantCount={product.variants_count}
                  totalStock={product.total_stock}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Editorial Standard & Why EuroStore */}
      <WhyEuroStoreEditorial isAr={isAr} />

      {/* 10. Verified Customer Reviews */}
      <CustomerReviewsSection isAr={isAr} />

      {/* 11. VIP Club & 10% Coupon Promo */}
      <VipClubNewsletter isAr={isAr} />
    </main>
  );
}
