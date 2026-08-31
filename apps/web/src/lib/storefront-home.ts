import 'server-only';

import type { Database } from '@eurostore/database';
import { createAdminSupabaseClient } from '@/supabase-server';
import type { HomeBanner } from '@/components/home/HomeBannerCarousel';

type ProductBase = Pick<Database['public']['Tables']['products']['Row'],
  'id' | 'name_ar' | 'name_en' | 'slug' | 'base_price' | 'discount_percentage' |
  'discount_start_at' | 'discount_end_at' | 'is_featured' | 'created_at'>;

type ProductRow = ProductBase & {
  categories?: { name_ar: string; slug: string } | null;
  brands?: { name: string; slug: string } | null;
  product_images: Array<Pick<Database['public']['Tables']['product_images']['Row'], 'url' | 'is_primary' | 'sort_order'>>;
  product_variants: Array<Pick<Database['public']['Tables']['product_variants']['Row'], 'id' | 'price_syp' | 'price_override' | 'stock_quantity' | 'is_active'>>;
};

export type StorefrontHomeProduct = ProductRow & {
  image_url: string;
  minPrice: number;
  comparePrice: number | null;
  variants_count: number;
  total_stock: number;
  default_variant_id: string | null;
  is_on_sale: boolean;
  is_new: boolean;
};

const productSelection = `
  id, name_ar, name_en, slug, base_price, discount_percentage, discount_start_at,
  discount_end_at, is_featured, created_at,
  categories(name_ar, slug),
  brands(name, slug),
  product_images(url, is_primary, sort_order),
  product_variants(id, price_syp, price_override, stock_quantity, is_active)
`;

function isDiscountActive(product: ProductRow, now = Date.now()) {
  const percentage = Number(product.discount_percentage ?? 0);
  if (percentage <= 0) return false;
  const startsAt = product.discount_start_at ? new Date(product.discount_start_at).getTime() : null;
  const endsAt = product.discount_end_at ? new Date(product.discount_end_at).getTime() : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
}

function formatProduct(product: ProductRow, newBadgeDays: number, now: number): StorefrontHomeProduct {
  const images = product.product_images || [];
  const variants = (product.product_variants || []).filter((variant) => variant.is_active);
  const prices = variants
    .map((variant) => Number(variant.price_override ?? variant.price_syp))
    .filter((price) => Number.isFinite(price) && price >= 0);
  const basePrice = prices.length ? Math.min(...prices) : Number(product.base_price ?? 0);
  const percentage = isDiscountActive(product, now) ? Number(product.discount_percentage ?? 0) : 0;
  const price = percentage > 0 ? Math.round(basePrice * (1 - percentage / 100)) : basePrice;
  const sortedImages = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const defaultVariant = variants.find((variant) => Number(variant.stock_quantity ?? 0) > 0) ?? variants[0] ?? null;

  return {
    ...product,
    discount_percentage: percentage || null,
    image_url: sortedImages[0]?.url ?? '',
    minPrice: price,
    comparePrice: percentage > 0 ? basePrice : null,
    variants_count: variants.length,
    total_stock: variants.reduce((sum, variant) => sum + Number(variant.stock_quantity ?? 0), 0),
    default_variant_id: defaultVariant?.id ?? null,
    is_on_sale: percentage > 0,
    is_new: product.created_at ? now - new Date(product.created_at).getTime() <= newBadgeDays * 86_400_000 : false,
  };
}

export async function getStorefrontHomeData() {
  const admin = createAdminSupabaseClient();
  const [sectionsResult, badgeResult, brandsResult, productsResult, categoriesResult] = await Promise.all([
    admin.from('homepage_sections').select('*').eq('is_active', true).order('sort_order'),
    admin.from('system_settings').select('value').eq('key', 'new_badge_days').maybeSingle(),
    admin.from('brands').select('id, name, slug, logo_url').eq('is_active', true).order('name'),
    admin.from('products').select(productSelection).eq('status', 'published').eq('is_active', true).order('created_at', { ascending: false }),
    admin.from('categories').select('id, name_ar, name_en, image_url, slug, parent_id').eq('is_active', true).order('sort_order', { ascending: true }),
  ]);

  const queryError = sectionsResult.error || badgeResult.error || brandsResult.error || productsResult.error || categoriesResult.error;
  if (queryError) throw queryError;

  const configuredBadgeDays = Number(badgeResult.data?.value ?? 30);
  const newBadgeDays = Number.isFinite(configuredBadgeDays) ? Math.max(0, configuredBadgeDays) : 30;
  const now = Date.now();
  const products = (productsResult.data ?? []).map((product) => formatProduct(product as unknown as ProductRow, newBadgeDays, now));
  const bannerSection = (sectionsResult.data ?? []).find((section) => section.section_key === 'main_banner');
  const content = bannerSection?.content && typeof bannerSection.content === 'object'
    ? bannerSection.content as Record<string, unknown>
    : {};
  const banners = (Array.isArray(content.banners) ? content.banners : [])
    .filter((banner): banner is HomeBanner => Boolean(banner) && typeof banner === 'object' && (banner as HomeBanner).is_active !== false)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

  return {
    banners,
    brands: brandsResult.data ?? [],
    categories: categoriesResult.data ?? [],
    products,
    new_badge_days: newBadgeDays,
  };
}
