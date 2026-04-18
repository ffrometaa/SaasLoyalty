'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface RedemptionQRCanvasProps {
  qrData: string;
  code: string;
}

export function RedemptionQRCanvas({ qrData, code }: RedemptionQRCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrData, { width: 148, margin: 1 });
  }, [qrData]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} />
      <p className="text-sm font-mono font-semibold tracking-widest text-gray-700">
        {code}
      </p>
    </div>
  );
}
