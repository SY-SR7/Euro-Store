'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Box, CheckCircle2, PackageSearch, Search } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

interface InventoryItem {
  id: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  products: {
    name_ar: string;
    name_en: string;
    product_images: Array<{
      url: string;
      is_primary: boolean | null;
      sort_order: number | null;
    }>;
  };
}

export default function HelperInventoryPage() {
  const t = useTranslations('helper');
  const locale = useLocale();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function loadInventory() {
      setLoading(true);
      setError('');
      try {
        const url = new URL('/api/helper/inventory', window.location.origin);
        if (search.trim()) url.searchParams.set('q', search.trim());
        const response = await fetch(url.toString(), { signal: controller.signal });
        if (!response.ok) throw new Error('inventory_load_failed');
        const data = await response.json() as InventoryItem[];
        setItems(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setItems([]);
        setError(t('inventoryLoadError'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    const timer = window.setTimeout(() => { void loadInventory(); }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, t]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black text-text-primary">
          <Box className="h-7 w-7 text-primary" />
          {t('inventoryLookup')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('inventoryLookupDescription')}</p>
      </header>

      <section className="rounded-lg border border-border bg-background-card p-6 shadow-sm">
        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="search"
            aria-label={t('inventorySearchPlaceholder')}
            placeholder={t('inventorySearchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            className="block w-full rounded-lg border border-border bg-background py-3 pe-4 ps-10 text-start text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        {error ? (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : loading ? (
          <div className="py-12 text-center text-text-muted">{t('inventorySearching')}</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <PackageSearch className="mx-auto h-12 w-12 text-border" />
            <p className="mt-3 text-text-muted">{t('inventoryNoResults')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-text-muted">
                <tr>
                  <th className="w-16 pb-3 text-start font-bold">{t('image')}</th>
                  <th className="pb-3 text-start font-bold">{t('product')}</th>
                  <th className="pb-3 text-start font-bold">SKU</th>
                  <th className="pb-3 text-start font-bold">{t('stockQuantity')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const isLowStock = item.stock_quantity <= (item.low_stock_threshold || 5);
                  const isOutOfStock = item.stock_quantity === 0;
                  const productName = locale === 'ar' ? item.products?.name_ar : item.products?.name_en;
                  const imageUrl = [...(item.products?.product_images ?? [])]
                    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-background-elevated">
                      <td className="py-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border border-border bg-background">
                          {imageUrl ? (
                            <Image src={imageUrl} alt={productName || item.sku} width={48} height={48} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-background-elevated">
                              <Box className="h-5 w-5 text-text-muted opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 font-semibold text-text-primary">{productName || item.sku}</td>
                      <td className="px-2 py-3 text-text-secondary" dir="ltr">{item.sku}</td>
                      <td className="px-2 py-3">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5" /> {t('outOfStock')}
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" /> {t('lowStockCount', { count: item.stock_quantity })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t('availableCount', { count: item.stock_quantity })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
