'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function BentoFeatures() {
  const t = useTranslations('home.features');

  return (
    <section className="relative z-20 px-6 py-24 mx-auto max-w-7xl bg-background">
      <div className="mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-black mb-4 text-text-primary font-headline">
          The EuroStore <span className="text-primary italic">Difference</span>
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Experience luxury shopping tailored to your absolute convenience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Large Feature */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-[2rem] bg-background-elevated p-10 border border-border/40 shadow-sm flex flex-col justify-end min-h-[300px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <h3 className="relative z-10 text-2xl font-bold mb-2">Immersive Cinematic Shopping</h3>
          <p className="relative z-10 text-text-secondary max-w-md">Every scroll reveals a story. Our state-of-the-art cinematic sequences let you experience fashion before you even wear it.</p>
        </motion.div>

        {/* Small Feature 1 */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="relative overflow-hidden rounded-[2rem] bg-background-elevated p-8 border border-border/40 shadow-sm flex flex-col justify-end min-h-[200px]"
        >
          <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Next-Day Delivery</h3>
          <p className="text-sm text-text-secondary">Exclusive VIP shipping available on all premium orders.</p>
        </motion.div>

        {/* Small Feature 2 */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="relative overflow-hidden rounded-[2rem] bg-background-elevated p-8 border border-border/40 shadow-sm flex flex-col justify-end min-h-[200px]"
        >
          <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Luxury Packaging</h3>
          <p className="text-sm text-text-secondary">Unbox perfection with our signature aesthetic packaging.</p>
        </motion.div>
      </div>
    </section>
  );
}
