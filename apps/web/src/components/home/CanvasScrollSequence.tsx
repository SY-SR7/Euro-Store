'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useAnimationFrame, type MotionValue } from 'framer-motion';

interface Props {
  /** مسار الصور: يستقبل رقم الإطار (0-based) ويعيد مسار الصورة */
  frameSrc: (index: number) => string;
  /** عدد الإطارات الكلي */
  frameCount: number;
  /** تقدم السكرول بين 0 و 1 (للقيمة الأولية فقط — يُحدَّث عبر smoothProgress) */
  progress: number;
  /** Framer Motion MotionValue للتحديث التلقائي في كل frame بدون re-render */
  smoothProgress?: MotionValue<number>;
  /** جودة التحميل */
  quality?: 'low' | 'high';
  className?: string;
}

export interface CanvasScrollSequenceHandle {
  seek: (progress: number) => void;
}

export const CanvasScrollSequence = forwardRef<CanvasScrollSequenceHandle, Props>(
  function CanvasScrollSequence(
    { frameSrc, frameCount, progress, smoothProgress, quality = 'high', className = '' },
    ref,
  ) {
    const canvasRef      = useRef<HTMLCanvasElement>(null);
    const imagesRef      = useRef<(HTMLImageElement | null)[]>([]);
    const loadedRef      = useRef<boolean[]>([]);
    const currentFrameRef = useRef(-1);

    // ─── Draw ────────────────────────────────────────────────────────────
    const drawFrame = useCallback(
      (frameIndex: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const clamped = Math.min(frameCount - 1, Math.max(0, frameIndex));

        // Nearest loaded frame fallback
        let target = clamped;
        if (!loadedRef.current[clamped]) {
          for (let d = 1; d < frameCount; d++) {
            if (clamped - d >= 0 && loadedRef.current[clamped - d]) { target = clamped - d; break; }
            if (clamped + d < frameCount && loadedRef.current[clamped + d]) { target = clamped + d; break; }
          }
        }

        const img = imagesRef.current[target];
        if (!img) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const imgAspect    = img.naturalWidth / img.naturalHeight;
        const canvasAspect = width / height;

        let drawW: number, drawH: number, drawX: number, drawY: number;

        const isMobile = width < 768;

        if (isMobile) {
          // Fit width perfectly without zooming, so the sides of the shoes are fully visible.
          // Center vertically so details are shown nicely.
          const scale = width / img.naturalWidth;
          drawW = img.naturalWidth * scale;
          drawH = img.naturalHeight * scale;
          drawX = (width - drawW) / 2;
          drawY = (height - drawH) / 2;
        } else {
          // On desktop, we want a cinematic feel without extreme zooming of 'cover'.
          // We scale up the 'contain' size by ~1.35x, and anchor it towards the bottom 
          // (which effectively crops out the empty top part of the portrait video).
          const scale = (height / img.naturalHeight) * 1.35;
          drawW = img.naturalWidth * scale;
          drawH = img.naturalHeight * scale;
          drawX = (width - drawW) / 2; // Center horizontally
          // By subtracting drawH from height, we align the bottom of the image 
          // with the bottom of the canvas, pushing all the excess height to the top (cropping it).
          drawY = height - drawH + (height * 0.05); // slight padding at bottom
        }

        // We fill the canvas with a background color if we want, but it's transparent by default
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        currentFrameRef.current = target;
      },
      [frameCount],
    );

    // ─── Preload ──────────────────────────────────────────────────────────
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const total = frameCount;
      imagesRef.current = new Array(total).fill(null);
      loadedRef.current = new Array(total).fill(false);

      const loadOne = (i: number) => {
        if (loadedRef.current[i]) return;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          imagesRef.current[i] = img;
          loadedRef.current[i] = true;
          if (i === 0) drawFrame(0); // draw first frame ASAP
        };
        img.src = frameSrc(i);
      };

      // Load first frame immediately to have something to show
      loadOne(0);

      // Lazy load the rest only when the container is near the viewport
      let observer: IntersectionObserver;
      const scheduleRest = () => {
        for (let i = 1; i < total; i++) loadOne(i);
      };

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (typeof requestIdleCallback !== 'undefined') {
              requestIdleCallback(scheduleRest);
            } else {
              setTimeout(scheduleRest, 32);
            }
            observer.disconnect();
          }
        },
        { rootMargin: '100% 0px' } // Start loading when 1 screen away
      );

      // Observe the parent container for better accuracy since canvas is absolute
      observer.observe(canvas.parentElement ?? canvas);

      return () => observer.disconnect();
    }, [frameSrc, frameCount, drawFrame]);

    // ─── Resize observer ─────────────────────────────────────────────────
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = quality === 'high' ? (window.devicePixelRatio || 1) : 1;

      // Observe the PARENT element — canvas uses position:absolute so its own contentRect is unreliable
      const target = canvas.parentElement ?? canvas;

      const setSize = (width: number, height: number) => {
        canvas.width  = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        drawFrame(currentFrameRef.current < 0 ? 0 : currentFrameRef.current);
      };

      // Set initial size immediately
      setSize(target.clientWidth, target.clientHeight);

      const ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setSize(width, height);
      });

      ro.observe(target);
      return () => ro.disconnect();
    }, [quality, drawFrame]);

    // ─── Imperative handle (for external seek calls) ──────────────────────
    useImperativeHandle(ref, () => ({
      seek(p: number) {
        const frameIndex = Math.round(p * (frameCount - 1));
        if (frameIndex !== currentFrameRef.current) {
          drawFrame(frameIndex);
        }
      },
    }));

    // ─── Animation loop — reads smoothProgress MotionValue directly ───────
    useAnimationFrame(() => {
      if (!smoothProgress) return;
      const p = smoothProgress.get();
      const frameIndex = Math.round(p * (frameCount - 1));
      if (frameIndex !== currentFrameRef.current) {
        drawFrame(frameIndex);
      }
    });

    // ─── Fallback: static progress prop when no smoothProgress given ──────
    useEffect(() => {
      if (smoothProgress) return; // handled by animation frame above
      const frameIndex = Math.round(progress * (frameCount - 1));
      drawFrame(frameIndex);
    }, [progress, frameCount, drawFrame, smoothProgress]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    );
  },
);
