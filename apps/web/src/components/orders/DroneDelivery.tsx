'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Package, CheckCircle2 } from 'lucide-react';

export function DroneDelivery({ status }: { status: string }) {
  const [isFlying, setIsFlying] = useState(false);
  const [delivered, setDelivered] = useState(false);

  // Show drone option only for shipped or processing orders
  if (status !== 'shipped' && status !== 'processing') return null;

  const launchDrone = () => {
    if (isFlying || delivered) return;
    setIsFlying(true);
    
    // Simulate flight time
    setTimeout(() => {
      setIsFlying(false);
      setDelivered(true);
    }, 5000);
  };

  return (
    <div className="mt-8 border border-primary/20 bg-primary/5 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Plane className="text-primary" />
            توصيل كبار الشخصيات (VIP Drone)
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            {delivered 
              ? 'تم التوصيل بنجاح عبر طائرات الدرون السريعة!'
              : 'هل أنت مستعجل؟ اطلب توصيل فائق السرعة عبر طائرات الدرون الخاصة بيورو ستور.'}
          </p>
        </div>
        
        {!delivered ? (
          <button
            onClick={launchDrone}
            disabled={isFlying}
            className={`shrink-0 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isFlying 
                ? 'bg-background-elevated text-text-muted cursor-wait'
                : 'bg-primary text-[#0F0F0F] hover:scale-105 shadow-lg shadow-primary/20'
            }`}
          >
            {isFlying ? 'جارٍ التحليق...' : 'أرسل الدرون الآن 🚁'}
          </button>
        ) : (
          <div className="shrink-0 px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle2 size={20} />
            تم التسليم
          </div>
        )}
      </div>

      {/* Drone Animation Overlay */}
      <AnimatePresence>
        {isFlying && (
          <motion.div 
            initial={{ x: '-100vw', y: 50, scale: 0.5 }}
            animate={{ 
              x: '100vw', 
              y: [50, -20, 30, -10, 0], 
              scale: [0.5, 1, 1.2, 1, 0.8] 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 5, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 -translate-y-1/2 z-0 pointer-events-none drop-shadow-2xl flex flex-col items-center"
          >
            <div className="relative">
              {/* Drone Body */}
              <div className="w-24 h-6 bg-white rounded-full flex justify-between items-center px-2 relative z-10 shadow-lg">
                <div className="w-4 h-1 bg-red-500 rounded-full animate-pulse" />
                <div className="w-8 h-8 bg-background-elevated rounded-full absolute left-1/2 -top-4 -translate-x-1/2 border-2 border-primary" />
                <div className="w-4 h-1 bg-green-500 rounded-full animate-pulse" />
              </div>
              {/* Propellers */}
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -left-2 w-10 h-1 bg-gray-400 rounded-full"
              />
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2 w-10 h-1 bg-gray-400 rounded-full"
              />
            </div>
            
            {/* String & Package */}
            <div className="w-0.5 h-8 bg-border" />
            <motion.div 
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="bg-[#CFA63D] w-12 h-12 rounded-lg shadow-xl border-2 border-[#1F1B16] flex items-center justify-center text-[#1F1B16]"
            >
              <Package size={20} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
