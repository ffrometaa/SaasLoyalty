'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Check, Download, ExternalLink, Loader2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

const MEMBER_APP_URL =
  process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev';

export function MemberAppTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const joinUrl = slug ? `${MEMBER_APP_URL}/join/${slug}` : '';

  // Fetch tenant join info
  useEffect(() => {
    fetch('/api/tenant/join-info')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError('No se pudo cargar la información del tenant.');
        } else {
          setSlug(data.slug);
          setAppName(data.appName);
        }
      })
      .catch(() => setError('Error de red. Intentá de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  // Render QR when joinUrl is available
  useEffect(() => {
    if (!joinUrl || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, joinUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#1c2117', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(console.error);
  }, [joinUrl]);

  function handleCopy() {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !slug) return;

    // Render a larger version for download
    const offscreen = document.createElement('canvas');
    const size = 600;
    offscreen.width = size;
    offscreen.height = size;

    QRCode.toCanvas(offscreen, joinUrl, {
      width: size,
      margin: 3,
      color: { dark: '#1c2117', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(() => {
      const link = document.createElement('a');
      link.download = `qr-${slug}.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">App de Miembros</h2>
        <p className="text-sm text-gray-500 mb-6">
          Compartí este link o código QR para que tus clientes se unan al programa de lealtad.
        </p>

        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="rounded-2xl border-2 border-gray-100 p-3 bg-white shadow-sm">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar PNG
            </button>
          </div>

          {/* URL + info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 mb-2">Link de acceso</p>

            {/* URL display */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-700 truncate">
                {joinUrl}
              </div>
              <button
                onClick={handleCopy}
                title="Copiar link"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
            </div>

            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir app de miembros
            </a>

            {/* How to use */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-800 mb-3">¿Cómo usarlo?</p>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">1</span>
                  Imprimí el QR o mostralo en tu negocio.
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">2</span>
                  Tus clientes escanean el QR con la cámara del celular.
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">3</span>
                  Ingresan su email y reciben un link mágico para acceder.
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">4</span>
                  ¡Listo! El cliente queda registrado y puede acumular puntos.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Print tip */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <QrCode className="h-4 w-4 text-indigo-500" />
          Consejo para imprimir
        </h3>
        <p className="text-sm text-gray-600">
          Descargá el QR en PNG de alta resolución y agregalo a tus materiales de marketing,
          cartelería o tarjetas de presentación. Recomendamos imprimirlo a no menos de 4×4 cm
          para asegurar que los celulares puedan escanearlo correctamente.
        </p>
      </div>
    </div>
  );
}
