'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Credits() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Secret keyboard shortcut to open credits: Shift + C + R
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'c') {
        // Wait for 'r'
        const handleR = (e2: KeyboardEvent) => {
          if (e2.key.toLowerCase() === 'r') {
            setIsOpen(true);
          }
          window.removeEventListener('keydown', handleR);
        };
        window.addEventListener('keydown', handleR);
        setTimeout(() => window.removeEventListener('keydown', handleR), 1000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-2 left-2 text-[8px] text-text-muted/20 hover:text-text-muted transition-colors z-50"
      >
        v1.0.0
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-10"
            >
              <X size={32} />
            </button>

            {/* Starfield background */}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

            <motion.div
              initial={{ y: '100vh' }}
              animate={{ y: '-200vh' }}
              transition={{ duration: 25, ease: 'linear' }}
              className="flex flex-col items-center text-center space-y-16 w-full max-w-2xl px-8 z-10"
            >
              <div className="space-y-4">
                <h1 className="text-6xl font-black text-[#CFA63D] tracking-widest uppercase">Euro Store</h1>
                <p className="text-2xl text-white tracking-widest uppercase">A Luxury E-Commerce Experience</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl text-text-muted uppercase tracking-widest">Executive Producer & Visionary</h2>
                <p className="text-3xl text-white font-bold">Ammar</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl text-text-muted uppercase tracking-widest">Lead Engineer & Architect</h2>
                <p className="text-3xl text-white font-bold">Antigravity (AI)</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl text-text-muted uppercase tracking-widest">Technologies Used</h2>
                <p className="text-2xl text-white">Next.js 14 App Router</p>
                <p className="text-2xl text-white">Expo & React Native</p>
                <p className="text-2xl text-white">Supabase & PostgreSQL</p>
                <p className="text-2xl text-white">Framer Motion</p>
                <p className="text-2xl text-white">Tailwind CSS</p>
                <p className="text-2xl text-white">Zustand</p>
                <p className="text-2xl text-white">Docker & Turborepo</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl text-text-muted uppercase tracking-widest">Special Thanks To</h2>
                <p className="text-2xl text-white">The concept of "أكمل"</p>
                <p className="text-2xl text-white">Endless Patience</p>
              </div>

              <div className="pt-32 space-y-4">
                <p className="text-[#CFA63D] text-4xl font-black">Thank You For Shopping</p>
                <p className="text-text-muted">© 2026 Euro Store. All Rights Reserved.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
