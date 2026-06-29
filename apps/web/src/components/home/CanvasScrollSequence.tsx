'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSpring, useMotionValue, useAnimationFrame } from 'framer-motion';

interface Props {
  /** مسار الصور المتسلسلة — مثال: /frames/shoes/frame_{index:04d}.jpg
   *  استخدم {index} أو {index:04d} لوضع رقم الإطار */
  frameSrc: (index: number) => string;
  /** عدد الإطارات الكلي */
  frameCount: number;
  /** تقدم السكرول بين 0 و 1 */
  progress: number;
  /** جودة التحميل: 'low' | 'high' */
  quality?: 'low' | 'high';
  className?: string;
}

export function CanvasScrollSequence({
  frameSrc,
  frameCount,
  progress,
  quality = 'high',
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);

  // Smooth spring for frame index
  const rawFrame = useMotionValue(0);
  const smoothFrame = useSpring(rawFrame, {
    stiffness: 150,
    damping: 28,
    mass: 0.05,
  });

  // Preload all images eagerly
  const preloadImages = useCallback(() => {
    const total = frameCount;
    imagesRef.current = new Array(total).fill(null);
    loadedRef.current = new Array(total).fill(false);

    // Load priority: first frame first, then rest
    const loadFrame = (i: number) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        imagesRef.current[i] = img;
        loadedRef.current[i] = true;

        // Draw first frame immediately so canvas isn't empty
        if (i === 0) {
          drawFrame(0);
        }
      };
      img.src = frameSrc(i);
    };

    // Load first frame immediately
    loadFrame(0);

    // Load rest with slight delay to not block UI
    requestIdleCallback
      ? requestIdleCallback(() => {
          for (let i = 1; i < total; i++) loadFrame(i);
        })
      : setTimeout(() => {
          for (let i = 1; i < total; i++) loadFrame(i);
        }, 50);
  }, [frameSrc, frameCount]);

  function drawFrame(frameIndex: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = imagesRef.current[frameIndex];
    if (!img) {
      // Find nearest loaded frame
      let nearest = frameIndex;
      for (let d = 1; d < frameCount; d++) {
        if (frameIndex - d >= 0 && loadedRef.current[frameIndex - d]) {
          nearest = frameIndex - d;
          break;
        }
        if (frameIndex + d < frameCount && loadedRef.current[frameIndex + d]) {
          nearest = frameIndex + d;
          break;
        }
      }
      if (nearest !== frameIndex && imagesRef.current[nearest]) {
        drawFrame(nearest);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // Cover fit — same as CSS object-fit: cover
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (imgAspect > canvasAspect) {
      drawH = height;
      drawW = height * imgAspect;
      drawX = (width - drawW) / 2;
      drawY = 0;
    } else {
      drawW = width;
      drawH = width / imgAspect;
      drawX = 0;
      drawY = (height - drawH) / 2;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    currentFrameRef.current = frameIndex;
  }

  // Sync canvas size to element size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width * (quality === 'high' ? devicePixelRatio : 1));
      canvas.height = Math.round(height * (quality === 'high' ? devicePixelRatio : 1));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Redraw current frame at new size
      drawFrame(currentFrameRef.current);
    });

    ro.observe(canvas);
    return () => ro.disconnect();
  }, [quality]);

  // Start preloading
  useEffect(() => {
    preloadImages();
  }, [preloadImages]);

  // Update target frame from progress
  useEffect(() => {
    const frame = Math.min(
      frameCount - 1,
      Math.max(0, Math.round(progress * (frameCount - 1))),
    );
    targetFrameRef.current = frame;
    rawFrame.set(frame);
  }, [progress, frameCount, rawFrame]);

  // Animation loop — draw smooth frame every RAF tick
  useAnimationFrame(() => {
    const smoothVal = smoothFrame.get();
    const frameIndex = Math.min(frameCount - 1, Math.max(0, Math.round(smoothVal)));

    if (frameIndex !== currentFrameRef.current) {
      drawFrame(frameIndex);
    }
  });

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      style={{ imageRendering: 'auto' }}
    />
  );
}
