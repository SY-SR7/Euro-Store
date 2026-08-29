'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, Maximize2, RotateCcw } from 'lucide-react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';

interface GalleryImage {
  id: string;
  url: string;
  alt_ar?: string | null;
  alt_en?: string | null;
}

interface ProductImageGalleryProps {
  images: GalleryImage[];
  mainImage: string | null;
  productName: string;
  isAr?: boolean;
}

export function ProductImageGallery({
  images,
  mainImage: initialMainImage,
  productName,
  isAr = true,
}: ProductImageGalleryProps) {
  const allImages = images.length > 0
    ? images
    : initialMainImage
    ? [{ id: 'main', url: initialMainImage }]
    : [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const currentImage = allImages[activeImageIndex]?.url || initialMainImage || '';

  // Zoom Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Hover Magnifier State on Main Card
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, []);

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3.5));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  const resetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') isAr ? prevImage() : nextImage();
      if (e.key === 'ArrowLeft') isAr ? nextImage() : prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, isAr, allImages.length]);

  // Handle Drag / Pan in Lightbox
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
  };

  const handleMouseDrag = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-4">
      {/* Main Image Container with Precision Fit & Hover Magnifier */}
      <div
        ref={imageContainerRef}
        onClick={() => openLightbox(activeImageIndex)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl border border-border/60 bg-white p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md flex items-center justify-center"
      >
        {/* Main Product Image (Always 100% Contained & Beautifully Centered) */}
        <div className="relative h-full w-full">
          <ImageWithFallback
            src={currentImage}
            alt={productName}
            kind="product"
            label={productName}
            className={`h-full w-full object-contain p-2 transition-transform duration-300 ${
              isHovering ? 'scale-105' : 'scale-100'
            }`}
          />
        </div>

        {/* Hover Hint Badge */}
        <div className="absolute bottom-3 end-3 flex items-center gap-1.5 rounded-full bg-background-card/90 px-3 py-1.5 text-xs font-bold text-text-primary shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-80 border border-border/50">
          <Maximize2 className="h-3.5 w-3.5 text-primary" />
          <span>{isAr ? 'انقر للتكبير' : 'Click to zoom'}</span>
        </div>

        {/* Floating Zoom Icon Top Corner */}
        <div className="absolute top-3 end-3 flex h-8 w-8 items-center justify-center rounded-full bg-background-card/80 text-text-secondary opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Thumbnails Row */}
      {allImages.length > 1 && (
        <div className="flex flex-wrap gap-2.5">
          {allImages.map((img, index) => {
            const isActive = index === activeImageIndex;
            return (
              <button
                type="button"
                key={img.id || index}
                onClick={() => setActiveImageIndex(index)}
                aria-label={`${productName} image ${index + 1}`}
                aria-pressed={isActive}
                className={`relative aspect-square w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-2xl border-2 bg-white p-1.5 transition-all flex items-center justify-center ${
                  isActive
                    ? 'border-primary shadow-md ring-2 ring-primary/20 scale-105'
                    : 'border-border/50 hover:border-primary/50 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt_ar || productName}
                  className="h-full w-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Interactive Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={closeLightbox}
          >
            {/* Controls Bar Top */}
            <div
              className="absolute top-4 inset-x-4 flex items-center justify-between z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  {activeImageIndex + 1} / {allImages.length}
                </span>
                <span className="hidden sm:inline text-sm font-bold text-white/90 truncate max-w-xs">
                  {productName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={zoomIn}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:scale-105"
                  title={isAr ? 'تكبير' : 'Zoom In'}
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={zoomOut}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:scale-105"
                  title={isAr ? 'تصغير' : 'Zoom Out'}
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                {zoomLevel > 1 && (
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:scale-105"
                    title={isAr ? 'إعادة ضبط' : 'Reset'}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-red-500/80 hover:scale-105"
                  title={isAr ? 'إغلاق' : 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    isAr ? nextImage() : prevImage();
                  }}
                  className="absolute start-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 hover:scale-110"
                >
                  {isAr ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    isAr ? prevImage() : nextImage();
                  }}
                  className="absolute end-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 hover:scale-110"
                >
                  {isAr ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                </button>
              </>
            )}

            {/* Image Viewer Area */}
            <div
              className="relative flex h-[80vh] w-[85vw] max-w-5xl items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseDrag}
              onMouseUp={handleMouseUp}
              style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <motion.div
                animate={{
                  scale: zoomLevel,
                  x: panPosition.x,
                  y: panPosition.y,
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative flex h-full w-full items-center justify-center"
              >
                <img
                  src={currentImage}
                  alt={productName}
                  className="max-h-full max-w-full object-contain select-none drop-shadow-2xl"
                  draggable={false}
                />
              </motion.div>
            </div>

            {/* Thumbnails Bar Bottom */}
            {allImages.length > 1 && (
              <div
                className="absolute bottom-4 inset-x-4 flex justify-center gap-2 overflow-x-auto py-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {allImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setZoomLevel(1);
                      setPanPosition({ x: 0, y: 0 });
                    }}
                    className={`relative h-14 w-14 overflow-hidden rounded-xl border-2 bg-white p-1 transition-all ${
                      idx === activeImageIndex
                        ? 'border-primary ring-2 ring-primary/40 scale-110'
                        : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
