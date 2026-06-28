import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import {
  ProductCard,
  createCatalogLookup,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogVariant,
} from '../catalog-components';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams?: {
    q?: string | string[];
  };
}

function getSearchTerm(searchParams?: ProductsPageProps['searchParams']): string {
  const rawValue = searchParams?.q;
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  return value?.trim() ?? '';
}

export default async function ProductsPage({ searchParams }: ProductsPageProps): Promise<JSX.Element> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const search = getSearchTerm(searchParams);
  const productsQuery = search
    ? supabase
        .from('products')
        .select('id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured')
        .eq('is_active', true)
        .textSearch('search_vector', search, { type: 'websearch', config: 'simple' })
        .order('created_at', { ascending: false })
    : supabase
        .from('products')
        .select('id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

  const [{ data: productsData }, { data: categoriesData }, { data: brandsData }] = await Promise.all([
    productsQuery,
    supabase.from('categories').select('id, name_ar, name_en, slug').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id, name, slug').eq('is_active', true).order('name'),
  ]);

  const products = (productsData ?? []) as CatalogProduct[];
  const categories = (categoriesData ?? []) as CatalogCategory[];
  const brands = (brandsData ?? []) as CatalogBrand[];
  const productIds = products.map((product) => product.id);
  const { data: variantsData } =
    productIds.length > 0
      ? await supabase
          .from('product_variants')
          .select('id, product_id, sku, price_syp, compare_price_syp, stock_quantity')
          .eq('is_active', true)
          .in('product_id', productIds)
      : { data: [] };
  const variants = (variantsData ?? []) as CatalogVariant[];
  const categoryById = createCatalogLookup(categories);
  const brandById = createCatalogLookup(brands);

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5">
          <Link href="/" className="text-xl font-semibold text-[#C9A84C]">
            EuroStore
          </Link>
          <div className="flex gap-4 text-sm text-[#D6D3C7]">
            <Link href="/auth/login">دخول</Link>
            <Link href="/auth/register">حساب جديد</Link>
          </div>
        </nav>

        <header className="grid gap-6 py-8 md:grid-cols-[1fr_0.9fr] md:items-end">
          <div>
            <p className="text-sm text-[#C9A84C]">الكتالوج</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">منتجات EuroStore</h1>
          </div>
          <form action="/products" className="flex gap-3">
            <input
              name="q"
              defaultValue={search}
              placeholder="ابحث عن فستان، حذاء، حقيبة..."
              className="min-w-0 flex-1 rounded-md border border-[#2E2E2E] bg-[#151515] px-4 py-3 text-sm text-[#F4F1E8] outline-none transition placeholder:text-[#6B7280] focus:border-[#C9A84C]"
            />
            <button
              type="submit"
              className="rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#D8B95F]"
            >
              بحث
            </button>
          </form>
        </header>

        <section className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="rounded-sm border border-[#2E2E2E] px-3 py-2 text-sm text-[#D6D3C7] transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
            >
              {category.name_ar}
            </Link>
          ))}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">{search ? `نتائج "${search}"` : 'كل المنتجات'}</h2>
            <span className="text-sm text-[#9CA3AF]">{products.length} منتج</span>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variants={variants}
                  category={product.category_id ? categoryById.get(product.category_id) : undefined}
                  brand={product.brand_id ? brandById.get(product.brand_id) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center text-[#9CA3AF]">
              لا توجد منتجات مطابقة حالياً.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

