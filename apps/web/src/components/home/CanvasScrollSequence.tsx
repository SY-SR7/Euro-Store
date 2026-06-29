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

        if (imgAspect > canvasAspect) {
          drawH = height; drawW = height * imgAspect;
          drawX = (width - drawW) / 2; drawY = 0;
        } else {
          drawW = width; drawH = width / imgAspect;
          drawX = 0; drawY = (height - drawH) / 2;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        currentFrameRef.current = target;
      },
      [frameCount],
    );

    // ─── Preload ──────────────────────────────────────────────────────────
    useEffect(() => {
      const total = frameCount;
      imagesRef.current = new Array(total).fill(null);
      loadedRef.current = new Array(total).fill(false);

      const loadOne = (i: number) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          imagesRef.current[i] = img;
          loadedRef.current[i] = true;
          if (i === 0) drawFrame(0); // draw first frame ASAP
        };
        img.src = frameSrc(i);
      };

      loadOne(0); // critical first frame

      const scheduleRest = () => {
        for (let i = 1; i < total; i++) loadOne(i);
      };

      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(scheduleRest);
      } else {
        setTimeout(scheduleRest, 32);
      }
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
