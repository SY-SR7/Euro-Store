import Link from 'next/link';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';

export const dynamic = 'force-dynamic';

export default async function Home(): Promise<JSX.Element> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const [{ data: sections }, { data: categories }] = await Promise.all([
    supabase
      .from('homepage_sections')
      .select('section_key, title_ar, title_en, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name_ar, name_en, slug')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(6),
  ]);

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5">
          <p className="text-xl font-semibold text-[#C9A84C]">EuroStore</p>
          <div className="flex gap-4 text-sm">
            <Link href="/auth/login">دخول</Link>
            <Link href="/auth/register">حساب جديد</Link>
          </div>
        </nav>

        <header className="grid gap-6 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="text-sm text-[#C9A84C]">متجر أزياء متصل مباشرة بقاعدة البيانات</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">واجهة العملاء جاهزة للبيانات الحقيقية</h1>
          </div>
          <p className="text-sm leading-7 text-[#9CA3AF]">
            تظهر الأقسام والتصنيفات هنا من قاعدة البيانات المفعّلة عند تفعيلها من لوحة الإدارة.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {(sections ?? []).map((section) => (
            <article key={section.section_key} className="rounded border border-[#2E2E2E] p-5">
              <p className="text-xs text-[#9CA3AF]">{section.section_key}</p>
              <h2 className="mt-3 text-xl font-semibold">{section.title_ar}</h2>
              <p className="mt-2 text-sm text-[#9CA3AF]">{section.title_en}</p>
            </article>
          ))}
        </section>

        <section className="border-t border-[#2E2E2E] pt-8">
          <h2 className="text-2xl font-semibold">التصنيفات</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(categories ?? []).map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className="rounded border border-[#2E2E2E] p-4">
                <span>{category.name_ar}</span>
                <span className="mt-1 block text-sm text-[#9CA3AF]">{category.name_en}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
