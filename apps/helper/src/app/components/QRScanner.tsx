'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { CameraOff, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function QRScanner({ onScan, onClose, title, description }: QRScannerProps) {
  const t = useTranslations('helper');
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const rafRef     = useRef<number>(0);
  const [error, setError]   = useState<string>('');
  const [ready, setReady]   = useState(false);
  const [scanned, setScanned] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || scanned) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(() => { void scanFrame(); });
      return;
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code?.data) {
        setScanned(true);
        stopCamera();
        onScan(code.data);
        return;
      }
    } catch {}

    rafRef.current = requestAnimationFrame(() => { void scanFrame(); });
  }, [scanned, stopCamera, onScan]);

  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
          rafRef.current = requestAnimationFrame(() => { void scanFrame(); });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t('cameraUnknownError');
        setError(
          msg.includes('Permission') || msg.includes('NotAllowed')
            ? t('cameraDenied')
            : t('cameraOpenError', { message: msg })
        );
      }
    }
    void startCamera();
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [scanFrame, stopCamera, t]);

  useEffect(() => {
    if (ready && !scanned) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => { void scanFrame(); });
    }
  }, [ready, scanned, scanFrame]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0F0F0F]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2E2E2E]">
        <div>
          <h2 className="text-lg font-bold text-[#E2E2E2]">{title ?? t('scanQr')}</h2>
          {description && <p className="text-xs text-[#9CA3AF] mt-0.5">{description}</p>}
        </div>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="rounded-full p-2 text-[#9CA3AF] hover:bg-[#1E1E1E] hover:text-[#E2E2E2] transition-colors"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Camera View */}
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <CameraOff size={48} className="text-[#EF4444]" />
            <p className="text-[#EF4444] text-sm leading-6">{error}</p>
            <button
              onClick={() => { stopCamera(); onClose(); }}
              className="rounded-xl bg-[#1E1E1E] border border-[#2E2E2E] px-6 py-3 text-sm text-[#E2E2E2] hover:border-primary transition-colors"
            >
              {t('back')}
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {/* QR Targeting Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative h-56 w-56">
                {/* Corners */}
                {[
                  'top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
                  'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
                  'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
                  'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl',
                ].map((cls, i) => (
                  <div key={i} className={`absolute h-10 w-10 border-primary ${cls}`} />
                ))}
                {/* Scanning line */}
                {!scanned && ready && (
                  <div
                    className="absolute left-1 right-1 h-0.5 bg-primary/70 animate-scan"
                    style={{ animation: 'scan 2s linear infinite' }}
                  />
                )}
              </div>
            </div>

            {/* Scanning indicator */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <div className="rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
                {scanned ? (
                  <p className="text-green-400 text-sm font-bold">{t('scanComplete')}</p>
                ) : ready ? (
                  <p className="text-[#9CA3AF] text-sm">{t('pointCamera')}</p>
                ) : (
                  <p className="text-[#9CA3AF] text-sm">{t('cameraStarting')}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      <style jsx global>{`
        @keyframes scan {
          0%   { top: 8px; opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 0.6; }
          100% { top: 8px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
