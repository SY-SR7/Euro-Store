'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function BentoFeatures() {
  const t = useTranslations('home.features');

  return (
    <section className="relative z-20 w-full bg-background text-[#0F0F0F] px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-[#0F0F0F] font-headline">
            {t('title')} <span className="text-primary italic">{t('titleHighlight')}</span>
          </h2>
          <p className="text-[#333333] max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Large Feature */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-[2rem] bg-background-elevated p-10 border border-border/40 shadow-sm flex flex-col justify-end min-h-[300px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <h3 className="relative z-10 text-2xl font-bold mb-2 text-[#0F0F0F]">{t('bento1.title')}</h3>
          <p className="relative z-10 text-[#333333] max-w-md">{t('bento1.description')}</p>
        </motion.div>

        {/* Small Feature 1 */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="relative overflow-hidden rounded-[2rem] bg-background-elevated p-8 border border-border/40 shadow-sm flex flex-col justify-end min-h-[200px]"
        >
          <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
          <h3 className="text-lg font-bold mb-2 text-[#0F0F0F]">{t('bento2.title')}</h3>
          <p className="text-sm text-[#333333]">{t('bento2.description')}</p>
        </motion.div>

        {/* Small Feature 2 */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="relative overflow-hidden rounded-[2rem] bg-background-elevated p-8 border border-border/40 shadow-sm flex flex-col justify-end min-h-[200px]"
        >
          <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h3 className="text-lg font-bold mb-2 text-[#0F0F0F]">{t('bento3.title')}</h3>
          <p className="text-sm text-[#333333]">{t('bento3.description')}</p>
        </motion.div>
      </div>
      </div>
    </section>
  );
}
