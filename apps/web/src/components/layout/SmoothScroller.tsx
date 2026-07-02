'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export function SmoothScroller({ children }: { children: React.ReactNode }): React.ReactElement {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    try {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      lenisRef.current = lenis;

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      return () => lenis.destroy();
    } catch (e) {
      console.error('Lenis error:', e);
    }
  }, []);

  return <>{children}</>;
}
