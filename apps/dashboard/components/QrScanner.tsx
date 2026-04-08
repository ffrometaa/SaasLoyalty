'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

type Props = {
  isActive: boolean;
  onScan: (code: string) => void;
  showFormatsLabel?: boolean;
};

type ScannerState = 'starting' | 'scanning' | 'error';

export function QrScanner({ isActive, onScan, showFormatsLabel = true }: Props) {
  const [state, setState] = useState<ScannerState>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef<any>(null);
  const onScanRef = useRef(onScan);
  const ELEMENT_ID = 'qr-scanner-viewport';

  // Keep onScan ref up to date without re-triggering the effect
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!isActive) {
      stopScanner();
      return;
    }

    let cancelled = false;

    async function start() {
      setState('starting');
      setErrorMsg('');

      try {
        // Dynamic import — avoids SSR issues since Html5Qrcode uses document/navigator
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

        if (cancelled) return;

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ];

        const scanner = new Html5Qrcode(ELEMENT_ID, { formatsToSupport });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (!cancelled) {
              onScanRef.current(decodedText);
            }
          },
          () => {
            // Frame-level scan errors — ignored (fires constantly when no QR in view)
          }
        );

        if (!cancelled) setState('scanning');
      } catch (err: any) {
        if (!cancelled) {
          const msg =
            err?.message?.includes('permission') || err?.message?.includes('Permission')
              ? 'Camera access denied. Please allow camera permissions and try again.'
              : err?.message?.includes('device') || err?.message?.includes('NotFound')
              ? 'No camera found on this device.'
              : 'Could not start camera. Please try again.';
          setErrorMsg(msg);
          setState('error');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [isActive]);

  function stopScanner() {
    const scanner = scannerRef.current;
    if (scanner) {
      scanner.isScanning && scanner.stop().catch(() => {});
      scannerRef.current = null;
    }
  }

  if (!isActive) return null;

  return (
    <div className="space-y-3">
      {/* Scanner viewport — html5-qrcode mounts the video stream here */}
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 min-h-[280px] flex items-center justify-center">
        <div id={ELEMENT_ID} className="w-full" />

        {state === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <div className="animate-spin h-8 w-8 border-2 border-brand-purple border-t-transparent rounded-full mb-3" />
            <p className="text-sm text-gray-500">Starting camera…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <CameraOff className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm font-medium text-red-600">{errorMsg}</p>
          </div>
        )}

        {state === 'scanning' && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className="inline-flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
              <Camera className="h-3.5 w-3.5" />
              Apuntá al QR o código de barras
            </span>
          </div>
        )}
      </div>
    </div>

    {showFormatsLabel && state === 'scanning' && (
      <p className="text-center text-xs text-gray-400">
        QR · EAN-13 · EAN-8 · Code 128 · Code 39 · UPC
      </p>
    )}
  </div>
  );
}
