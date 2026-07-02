'use client';
import { useEffect, useState } from 'react';

export function KonamiCode() {
  const [sequence, setSequence] = useState<string[]>([]);
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      setSequence((prev) => {
        const newSequence = [...prev, key];
        if (newSequence.length > konamiCode.length) {
          newSequence.shift();
        }
        
        // Check if matched
        if (newSequence.join(',') === konamiCode.join(',')) {
          // Trigger the ultimate easter egg
          document.body.style.transition = 'transform 3s ease-in-out';
          document.body.style.transform = 'rotate(360deg) scale(0.5)';
          setTimeout(() => {
            document.body.style.transform = 'rotate(0deg) scale(1)';
            alert('لقد اكتشفت الشفرة السرية! أنت الآن المطور الرئيسي ليورو ستور! 🎮✨');
          }, 3000);
          return [];
        }
        
        return newSequence;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiCode]);

  return null;
}
