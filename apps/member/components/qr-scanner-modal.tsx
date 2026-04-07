'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

interface QrScannerModalProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QrScannerModal({ onScan, onClose }: QrScannerModalProps) {
  const t = useTranslations('qr_scanner');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch {
        if (active) setError(t('camera_error'));
      }
    }

    startCamera();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleVideoPlay() {
    scanFrame();
  }

  async function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Dynamically import jsqr to keep it out of the initial bundle
    const jsQR = (await import('jsqr')).default;
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code?.data) {
      setScanning(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      // Extract just the code — QR may contain a full URL or just the raw code
      const raw = code.data.trim();
      const extracted = extractCode(raw);
      onScan(extracted);
      return;
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }

  /** Extract the join code from various QR formats:
   * - Raw code: "ABC123"
   * - URL with ?code=ABC123
   * - URL path ending in /ABC123
   */
  function extractCode(raw: string): string {
    try {
      const url = new URL(raw);
      const codeParam = url.searchParams.get('code');
      if (codeParam) return codeParam.trim().toUpperCase();
      const pathParts = url.pathname.split('/').filter(Boolean);
      const last = pathParts[pathParts.length - 1];
      if (last) return last.trim().toUpperCase();
    } catch {
      // Not a URL — treat as raw code
    }
    return raw.toUpperCase();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#000' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 z-10">
        <p className="text-white font-semibold text-base">{t('title')}</p>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label={t('close')}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          onPlay={handleVideoPlay}
        />

        {/* Hidden canvas for frame processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Dimmed background */}
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />

            {/* Scan frame */}
            <div className="relative w-64 h-64">
              {/* Corner accents */}
              {[
                'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
              ].map((cls, i) => (
                <span key={i} className={`absolute w-8 h-8 border-[#a78bfa] ${cls}`} />
              ))}

              {/* Scan line */}
              <div
                className="absolute left-2 right-2 h-0.5 bg-[#a78bfa]/70 rounded"
                style={{ animation: 'scan-line 2s ease-in-out infinite', top: '50%' }}
              />
            </div>

            {/* Hint text */}
            <p className="absolute bottom-24 left-0 right-0 text-center text-sm text-white/70">
              {t('hint')}
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-4">
            <div className="p-4 rounded-full bg-red-500/15">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <p className="text-white text-center font-medium">{error}</p>
            <p className="text-white/50 text-sm text-center">{t('camera_hint')}</p>
          </div>
        )}
      </div>

      {/* Keyframe for scan line — injected via style tag */}
      <style>{`
        @keyframes scan-line {
          0%, 100% { transform: translateY(-40px); opacity: 0.4; }
          50% { transform: translateY(40px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
