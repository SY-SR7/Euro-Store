'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package, Shapes } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SearchSuggestion = {
  type: 'product' | 'category';
  id: string;
  name: string;
  slug: string;
};

function isSearchSuggestion(value: unknown): value is SearchSuggestion {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const suggestion = value as Record<string, unknown>;
  return (suggestion.type === 'product' || suggestion.type === 'category')
    && typeof suggestion.id === 'string'
    && typeof suggestion.name === 'string'
    && typeof suggestion.slug === 'string';
}

export function SmartSearch() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function loadSuggestions() {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}&lang=${locale}`, { signal: controller.signal });
          if (res.ok) {
            const data: unknown = await res.json();
            const suggestions = data && typeof data === 'object' && !Array.isArray(data)
              ? (data as Record<string, unknown>).suggestions
              : null;
            setResults(Array.isArray(suggestions) ? suggestions.filter(isSearchSuggestion) : []);
          }
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setResults([]);
        }
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }
    const delayDebounceFn = setTimeout(() => { void loadSuggestions(); }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query, locale]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value.length < 2) return;
    setResults([]);
    router.push(`/products?search=${encodeURIComponent(value)}`);
  }

  return (
    <div className='relative flex items-center'>
      <form onSubmit={submitSearch} className="flex w-full min-w-[200px] items-center overflow-hidden rounded-full border border-border bg-background-secondary px-4 py-2 sm:min-w-[280px]">
        <Search className='h-4 w-4 text-text-secondary mr-2 shrink-0' />
        <input
          ref={inputRef}
          type='text'
          aria-label={t('searchPlaceholder', { fallback: 'ابحث عن منتج...' })}
          name="storefront-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder', { fallback: 'ابحث عن منتج...' })}
          className='flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent text-text-primary text-sm placeholder:text-text-secondary w-full rtl'
          dir={isAr ? 'rtl' : 'ltr'}
          maxLength={100}
          autoComplete="off"
        />
        {isLoading && <Loader2 className='h-4 w-4 text-primary animate-spin shrink-0' />}
      </form>

      {/* Results Dropdown */}
      <AnimatePresence>
        {results.length > 0 && query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute top-14 ${isAr ? 'left-0 sm:left-auto' : 'right-0 sm:right-auto'} w-[90vw] sm:w-[320px] bg-background-card rounded-2xl border border-border shadow-2xl p-4 overflow-hidden z-50`}
          >
            <p className='text-xs text-text-secondary mb-3 font-bold px-2'>{t('searchResults', { fallback: 'نتائج البحث' })} ({results.length})</p>
            <div className='flex flex-col gap-2'>
              {results.map((item, i) => (
                <Link
                  key={`${item.type}-${item.id}-${i}`}
                  href={item.type === 'category' ? `/categories/${item.slug}` : `/products/${item.slug}`}
                  onClick={() => setQuery('')}
                  className='flex items-center gap-3 p-2 rounded-xl hover:bg-background-elevated transition-colors'
                >
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-background-elevated text-primary'>
                    {item.type === 'category' ? <Shapes size={18} /> : <Package size={18} />}
                  </div>
                  <div>
                    <p className='text-sm font-bold text-text-primary line-clamp-1'>{item.name}</p>
                    <p className='text-xs text-text-secondary mt-0.5'>
                      {item.type === 'category' ? t('category', { fallback: 'قسم' }) : t('product', { fallback: 'منتج' })}
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

