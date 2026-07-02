import { supabase } from '@/lib/supabase';
import { getLocale } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

export async function BrandsMarquee() {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url')
    .eq('is_active', true)
    .not('logo_url', 'is', null);

  if (!brands || brands.length === 0) return null;

  // Repeat items if too few to ensure marquee fills the screen
  const items = [...brands, ...brands, ...brands, ...brands, ...brands].slice(0, Math.max(12, brands.length * 3));

  return (
    <section className="border-y border-[#1A1A1A] bg-[#050505] py-10 overflow-hidden relative">
      <div className="mx-auto max-w-7xl px-4 md:px-8 mb-8 text-center relative z-20">
        <p className="text-[10px] font-black tracking-[0.3em] text-[#666] uppercase">
          {isAr ? 'ماركات عالمية متوفرة لدينا' : 'Trusted International Brands'}
        </p>
      </div>
      
      <div className="relative flex w-full gap-8 overflow-hidden bg-[#050505]">
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-32 bg-gradient-to-r from-[#050505] to-transparent"></div>
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-32 bg-gradient-to-l from-[#050505] to-transparent"></div>
        
        <div className={`flex min-w-full shrink-0 gap-12 ${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} items-center justify-around`}>
          {items.map((brand, idx) => (
            <Link 
              key={`${brand.id}-${idx}`} 
              href={`/products?brands=${brand.id}`}
              className="group relative flex h-14 w-32 shrink-0 items-center justify-center transition-transform hover:scale-110"
              title={brand.name}
            >
              <Image 
                src={brand.logo_url!} 
                alt={brand.name} 
                fill 
                className="object-contain opacity-40 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                sizes="128px"
              />
            </Link>
          ))}
        </div>
        
        <div aria-hidden="true" className={`flex min-w-full shrink-0 gap-12 ${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} items-center justify-around`}>
          {items.map((brand, idx) => (
            <Link 
              key={`dup-${brand.id}-${idx}`} 
              href={`/products?brands=${brand.id}`}
              className="group relative flex h-14 w-32 shrink-0 items-center justify-center transition-transform hover:scale-110"
              title={brand.name}
              tabIndex={-1}
            >
              <Image 
                src={brand.logo_url!} 
                alt={brand.name} 
                fill 
                className="object-contain opacity-40 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                sizes="128px"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
