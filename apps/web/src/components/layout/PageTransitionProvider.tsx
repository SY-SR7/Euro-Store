'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex-grow flex flex-col">
      {children}
    </div>
  );
}
