'use client';

import { useState } from 'react';
import { Check, Package, ShoppingCart } from 'lucide-react';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { useCartStore } from '@/lib/cart/cartStore';
import type { ProductBundleView } from '@/types/catalog';

function bundleAvailability(bundle: ProductBundleView): number {
  const items = bundle.bundle_items ?? [];
  if (!items.length) return 0;
  return Math.min(...items.map((item) => {
    const variant = item.product_variant;
    const product = variant?.products;
    if (!variant?.is_active || !product?.is_active || product.status !== 'published') return 0;
    return Math.floor(Number(variant.stock_quantity ?? 0) / Number(item.quantity || 1));
  }));
}

export function ProductBundlesList({ bundles, isAr }: { bundles: ProductBundleView[]; isAr: boolean }) {
  const addItem = useCartStore((state) => state.addItem);
  const [addedId, setAddedId] = useState<string | null>(null);
  if (!bundles?.length) return null;

  function addBundle(bundle: ProductBundleView, available: number) {
    if (available <= 0) return;
    const firstProduct = bundle.bundle_items?.[0]?.product_variant?.products;
    const images = [...(firstProduct?.product_images ?? [])].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    const image = images.find((item) => item.is_primary) ?? images[0] ?? null;
    addItem({
      itemType: 'bundle',
      variantId: bundle.id,
      productId: bundle.id,
      productSlug: bundle.slug,
      nameAr: bundle.name_ar,
      nameEn: bundle.name_en ?? '',
      sku: `BUNDLE-${String(bundle.id).slice(0, 6).toUpperCase()}`,
      priceSyp: Number(bundle.bundle_price),
      comparePriceSyp: null,
      imageUrl: image?.url ?? null,
      maxQuantity: Math.min(available, 99),
    });
    setAddedId(bundle.id);
    setTimeout(() => setAddedId(null), 1600);
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-text-primary">{isAr ? 'عروض وحزم متوفرة' : 'Available Bundles'}</h3>
      </div>
      <div className="grid gap-4">
        {bundles.map((bundle) => {
          const available = bundleAvailability(bundle);
          return (
            <article key={bundle.id} className="rounded-lg border border-border bg-background-card p-4 transition-colors hover:border-primary/30">
              <h4 className="mb-1 font-bold text-text-primary">{isAr ? bundle.name_ar : (bundle.name_en || bundle.name_ar)}</h4>
              {bundle.description_ar && (
                <p className="mb-3 line-clamp-2 text-xs text-text-muted">{isAr ? bundle.description_ar : (bundle.description_en || bundle.description_ar)}</p>
              )}
              <div className="mb-3 flex gap-2 overflow-x-auto border-b border-border pb-3">
                {bundle.bundle_items.map((item) => {
                  const product = item.product_variant?.products;
                  if (!product) return null;
                  const images = [...(product.product_images ?? [])].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
                  const image = images.find((entry) => entry.is_primary) ?? images[0] ?? null;
                  return (
                    <div key={item.id} className="flex shrink-0 items-center gap-2 rounded-lg bg-surface-elevated p-2">
                      <div className="h-12 w-12 overflow-hidden rounded-md bg-background">
                        <ImageWithFallback src={image?.url ?? null} alt={isAr ? product.name_ar : (product.name_en || product.name_ar)} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="w-28 truncate text-xs font-bold text-text-primary">{isAr ? product.name_ar : (product.name_en || product.name_ar)}</p>
                        <p className="text-xs text-text-muted">x{item.quantity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-text-muted">{isAr ? 'سعر الحزمة' : 'Bundle price'}</p>
                  <PriceDisplay amountSyp={bundle.bundle_price} className="!text-lg" />
                </div>
                <button
                  type="button"
                  disabled={available <= 0}
                  onClick={() => addBundle(bundle, available)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addedId === bundle.id ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  {available <= 0
                    ? (isAr ? 'غير متوفرة' : 'Out of stock')
                    : addedId === bundle.id
                      ? (isAr ? 'تمت الإضافة' : 'Added')
                      : (isAr ? 'أضف الحزمة' : 'Add bundle')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
