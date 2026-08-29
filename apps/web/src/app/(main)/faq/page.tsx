'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const t = useTranslations('faq');
  const faqItems = Array.from({ length: 6 }, (_, index) => ({
    question: t(`q${index + 1}.q`),
    answer: t(`q${index + 1}.a`),
  }));

  return (
    <main className="min-h-screen bg-background px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-6 uppercase tracking-wider">
            {t('title')}
          </h1>
          <p className="text-lg text-text-secondary">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqItems.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-background-elevated border border-border/50 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full px-6 py-6 flex items-center justify-between hover:bg-primary/5 transition-colors"
                >
                  <h3 className={`text-lg font-bold text-right transition-colors ${isOpen ? 'text-primary' : 'text-text-primary'}`}>
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className={`shrink-0 ml-4 ${isOpen ? 'text-primary' : 'text-text-muted'}`}
                  >
                    <ChevronDown size={24} />
                  </motion.div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    >
                      <div className="px-6 pb-6 text-text-secondary leading-relaxed">
                        <div className="h-px w-full bg-border/50 mb-6" />
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center bg-primary/10 border border-primary/20 rounded-2xl p-8"
        >
          <h4 className="text-xl font-bold text-text-primary mb-4">{t('anotherQuestion')}</h4>
          <p className="text-text-secondary mb-6">{t('supportText')}</p>
          <Link href="/contact" className="inline-block bg-primary text-[#0F0F0F] font-black py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors">
            {t('contactAction')}
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
