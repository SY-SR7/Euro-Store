'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { createSupabaseBrowserClientFromEnv } from '@eurostore/database';
import Link from 'next/link';

export function SmartSearch() {
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createSupabaseBrowserClientFromEnv();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        // We use full text search on search_vector
        const { data, error } = await supabase
          .from('products')
          .select('id, name_ar, product_variants(price_syp), product_images(url)')
          .textSearch('search_vector', query.split(' ').join(' & '), {
            type: 'websearch',
            config: 'arabic'
          })
          .eq('is_active', true)
          .limit(5);

        if (data) {
          setResults(data);
        }
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className='relative flex items-center'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className='absolute right-12 z-50 flex items-center overflow-hidden bg-background-secondary rounded-full border border-border px-4 py-2'
          >
            <Search className='h-4 w-4 text-text-secondary mr-2' />
            <input
              ref={inputRef}
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='???? ?? ??????...'
              className='flex-1 bg-transparent border-none outline-none text-text-primary text-sm placeholder:text-text-secondary w-full rtl'
              dir='rtl'
            />
            {isLoading && <Loader2 className='h-4 w-4 text-primary animate-spin' />}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('search')}
        className='hidden rounded-full p-2.5 transition-all duration-200 hover:bg-primary/20 hover:text-primary md:inline-flex'
      >
        {isOpen ? <X className='h-4 w-4' /> : <Search className='h-4 w-4' />}
      </button>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className='absolute top-14 right-12 w-[320px] bg-background-card rounded-2xl border border-border shadow-2xl p-4 overflow-hidden z-50'
          >
            <p className='text-xs text-text-secondary mb-3 font-bold px-2'>????? ????? ({results.length})</p>
            <div className='flex flex-col gap-2'>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={() => setIsOpen(false)}
                  className='flex items-center gap-3 p-2 hover:bg-background-secondary rounded-xl transition'
                >
                  <img
                    src={product.product_images?.[0]?.url || 'https://via.placeholder.com/50'}
                    alt={product.name_ar}
                    className='w-12 h-12 rounded-lg object-cover bg-background'
                  />
                  <div>
                    <p className='text-sm font-bold text-text-primary line-clamp-1'>{product.name_ar}</p>
                    <p className='text-xs text-primary font-bold mt-1'>
                      {(product.product_variants?.[0]?.price_syp || 0).toLocaleString('ar-SY')} ?.?
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

