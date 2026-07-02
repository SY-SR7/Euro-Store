'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden" dir="rtl">
      
      {/* Background Gradient Orbs (Red/Amber for error) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-amber-900/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative inline-block"
        >
          <h1 className="text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500/50 via-red-900/50 to-background leading-none select-none">
            500
          </h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full"
          >
            <div className="bg-background/80 backdrop-blur-md border border-red-900/50 py-3 px-8 rounded-2xl shadow-2xl rotate-[-5deg]">
              <p className="text-xl font-black text-white tracking-widest uppercase">System Error</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mt-8 mb-4">
            عذراً، حدث خطأ غير متوقع في الخادم!
          </h2>
          <p className="text-text-secondary text-lg mb-12 leading-relaxed max-w-xl mx-auto">
            يبدو أن هناك عطلاً مؤقتاً في أنظمتنا يمنعنا من تلبية طلبك حالياً. فريقنا التقني تم إبلاغه وجاري العمل على حله.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => reset()}
              className="w-full sm:w-auto bg-primary text-[#0F0F0F] font-black py-4 px-8 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              حاول مرة أخرى
            </button>
            
            <Link 
              href="/"
              className="w-full sm:w-auto bg-background-elevated border border-border/50 text-white font-bold py-4 px-8 rounded-xl hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={20} />
              العودة للرئيسية
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
