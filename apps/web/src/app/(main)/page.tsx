import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ProductCard } from '@/app/catalog-components';
import { HomeBannerCarousel } from '@/components/home/HomeBannerCarousel';
import { BrandMarqueeSection } from '@/components/home/BrandMarqueeSection';
import { CategoryBentoShowcase } from '@/components/home/CategoryBentoShowcase';
import { SneakersSpotlightSection } from '@/components/home/SneakersSpotlightSection';
import { LuxuryFragranceVault } from '@/components/home/LuxuryFragranceVault';
import { ApparelPoloSpotlight } from '@/components/home/ApparelPoloSpotlight';
import { AccessoriesSpotlightSection } from '@/components/home/AccessoriesSpotlightSection';
import { VipClubNewsletter } from '@/components/home/VipClubNewsletter';
import { getStorefrontHomeData } from '@/lib/storefront-home';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const { products: formattedProducts, banners, brands: activeBrands } = await getStorefrontHomeData();

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

  const accessoriesProducts = formattedProducts.filter(
    (p) =>
      p.categories?.slug === 'watches-accessories' ||
      p.categories?.slug === 'accessories' ||
      p.categories?.slug === 'bags-leather' ||
      p.name_ar.includes('نظارة') ||
      p.name_ar.includes('ساعة') ||
      p.name_ar.includes('حزام') ||
      p.name_ar.includes('قبعة') ||
      p.name_ar.includes('حقيبة')
  );

  const newArrivals = formattedProducts.slice(0, 12);

  return (
    <main className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Hero Main Banner Carousel */}
      {banners.length > 0 && (
        <HomeBannerCarousel banners={banners} locale={locale} />
      )}

      {/* 2. Continuous Infinite Brand Marquee (All 24 World Brands) */}
      {activeBrands.length > 0 && (
        <BrandMarqueeSection
          title={isAr ? 'العلامات التجارية العالمية' : 'World Iconic Brands'}
          brands={activeBrands}
          isAr={isAr}
        />
      )}

      {/* 3. Luxury Category Bento Grid */}
      <CategoryBentoShowcase isAr={isAr} />

      {/* 4. Iconic Sneakers Spotlight */}
      <SneakersSpotlightSection products={sneakersProducts} isAr={isAr} />

      {/* 5. Luxury Fragrance & Parfumerie Vault */}
      <LuxuryFragranceVault products={fragranceProducts} isAr={isAr} />

      {/* 6. Designer Apparel & Polos Spotlight */}
      <ApparelPoloSpotlight products={apparelProducts} isAr={isAr} />

      {/* 7. Watches, Sunglasses & Accessories Vault */}
      <AccessoriesSpotlightSection products={accessoriesProducts} isAr={isAr} />

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
                  {isAr ? 'أحدث المنتجات المضافة' : 'New In EuroStore'}
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

      {/* 9. VIP Club & 10% Coupon Promo */}
      <VipClubNewsletter isAr={isAr} />
    </main>
  );
}
