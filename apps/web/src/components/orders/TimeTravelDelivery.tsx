'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass, Zap } from 'lucide-react';

export function TimeTravelDelivery() {
  const [isTraveling, setIsTraveling] = useState(false);
  const [traveled, setTraveled] = useState(false);

  const launchTimeMachine = () => {
    if (isTraveling || traveled) return;
    setIsTraveling(true);
    
    // Simulate time travel duration
    setTimeout(() => {
      setIsTraveling(false);
      setTraveled(true);
      // Optional: Add a class to body to invert colors or something crazy, but let's keep it safe
    }, 4000);
  };

  return (
    <div className="mt-4 border border-purple-500/20 bg-purple-500/5 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
        <div>
          <h3 className="font-bold text-purple-600 text-lg flex items-center gap-2">
            <Hourglass className="text-purple-400" />
            توصيل السفر عبر الزمن (Time Travel)
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            {traveled 
              ? 'لقد عدنا بالزمن! تم تسليم طلبك بنجاح في عام 1999م قبل أن تطلبه أصلاً.'
              : 'مستعجل جداً؟ أرسل طلبك للماضي لتستلمه قبل أن تقوم بطلبه! (حصرياً لعملاء يورو ستور).'}
          </p>
        </div>
        
        {!traveled ? (
          <button
            onClick={launchTimeMachine}
            disabled={isTraveling}
            className={`shrink-0 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isTraveling 
                ? 'bg-background-elevated text-text-muted cursor-wait'
                : 'bg-purple-600 text-white hover:scale-105 shadow-[0_0_20px_rgba(147,51,234,0.5)]'
            }`}
          >
            {isTraveling ? 'جاري اختراق الزمن... ⚡' : 'سافر عبر الزمن ⏳'}
          </button>
        ) : (
          <div className="shrink-0 px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Zap size={20} />
            تم التسليم (سنة 1999)
          </div>
        )}
      </div>

      {/* Wormhole Animation Overlay */}
      <AnimatePresence>
        {isTraveling && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden mix-blend-screen"
          >
            <motion.div
              animate={{ 
                scale: [1, 20],
                rotate: [0, 360],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 3, ease: "easeIn" }}
              className="w-24 h-24 rounded-full border-4 border-dashed border-purple-500 shadow-[0_0_50px_#A855F7]"
            />
            <motion.div
              animate={{ 
                scale: [1, 15],
                rotate: [0, -360],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 3, delay: 0.5, ease: "easeIn" }}
              className="absolute w-32 h-32 rounded-full border-4 border-dotted border-blue-500 shadow-[0_0_50px_#3B82F6]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
