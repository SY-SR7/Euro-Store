// @ts-nocheck
/* eslint-disable */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { formatSYP } from '@eurostore/shared';
import { createServerSupabaseClient } from '@/supabase-server';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

export const dynamic = 'force-dynamic';
interface Props { params: { slug: string } }

export default async function ProductPage({ params }: Props) {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();

  const { data: productData } = await supabase
    .from('products')
    .select('id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured, image_url')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!productData) notFound();

  const [variantsRes, categoryRes, brandRes, imagesRes] = await Promise.all([
    supabase.from('product_variants')
      .select('id, product_id, sku, price_syp, compare_price_syp, stock_quantity')
      .eq('product_id', productData.id).eq('is_active', true)
      .order('price_syp', { ascending: true }),
    productData.category_id
      ? supabase.from('categories').select('id, name_ar, slug').eq('id', productData.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    productData.brand_id
      ? supabase.from('brands').select('id, name, slug').eq('id', productData.brand_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('product_images')
      .select('id, url, alt_ar, is_primary')
      .eq('product_id', productData.id)
      .order('sort_order'),
  ]);

  const variants     = variantsRes.data ?? [];
  const category     = categoryRes.data ?? null;
  const brand        = brandRes.data    ?? null;
  const images       = imagesRes.data   ?? [];
  const primaryImage = images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null;
  const cheapest     = variants[0] ?? null;
  const totalStock   = variants.reduce((s: number, v: any) => s + (v.stock_quantity ?? 0), 0);
  const minPrice     = cheapest?.price_syp ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-[#6F6658]">
        <Link href="/" className="hover:text-[#C9A84C] transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#C9A84C] transition-colors">المنتجات</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/categories/${category.slug}`} className="hover:text-[#C9A84C] transition-colors">{category.name_ar}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-[#1F1B16]">{productData.name_ar}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image column */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square overflow-hidden rounded-3xl border border-black/5 bg-[#F3EDE3]">
            {primaryImage ? (
              <img src={primaryImage} alt={productData.name_ar} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[#C9A84C]/30 text-6xl">◈</div>
            )}
          </div>
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: any) => (
                <div key={img.id}
                  className={['h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors',
                    img.is_primary ? 'border-[#C9A84C]' : 'border-transparent hover:border-[#C9A84C]/50'
                  ].join(' ')}>
                  <img src={img.url} alt={img.alt_ar ?? ''} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="space-y-6">
          {brand && (
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">{brand.name}</p>
          )}
          <h1 className="text-3xl font-black text-[#171411] leading-tight">{productData.name_ar}</h1>
          {productData.name_en && (
            <p className="text-sm text-[#6F6658]" dir="ltr">{productData.name_en}</p>
          )}

          {/* Price */}
          {minPrice > 0 ? (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#171411]">{formatSYP(minPrice)}</span>
              {variants.length > 1 && <span className="text-sm text-[#6F6658]">يبدأ من</span>}
            </div>
          ) : (
            <p className="text-lg text-[#6F6658]">السعر قريباً</p>
          )}

          {/* Stock badge */}
          <div>
            {totalStock > 10 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                ✓ متوفر في المخزون
              </span>
            ) : totalStock > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                ⚠ كميات محدودة ({totalStock} قطعة)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
                نفذ المخزون
              </span>
            )}
          </div>

          {/* Description */}
          {productData.description_ar && (
            <div className="rounded-2xl bg-[#F8F5EF] p-5">
              <p className="text-sm leading-relaxed text-[#3C352C]">{productData.description_ar}</p>
            </div>
          )}

          {/* Variants selector */}
          {variants.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#3C352C]">اختر المتغير</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v: any) => (
                  <button key={v.id}
                    className="rounded-xl border border-[#C9A84C]/30 px-4 py-2 text-xs font-bold text-[#3C352C] hover:bg-[#C9A84C] hover:text-[#111] hover:border-[#C9A84C] transition-all">
                    {v.sku} — {formatSYP(v.price_syp)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          {cheapest && totalStock > 0 && (
            <AddToCartButton
              variantId={cheapest.id}
              productId={productData.id}
              productNameAr={productData.name_ar}
              priceSyp={cheapest.price_syp}
              imageUrl={primaryImage ?? undefined}
            />
          )}

          {/* Category link */}
          {category && (
            <p className="text-xs text-[#6F6658]">
              التصنيف:{' '}
              <Link href={`/categories/${category.slug}`} className="text-[#C9A84C] hover:underline">
                {category.name_ar}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}