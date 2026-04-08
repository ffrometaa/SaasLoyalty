'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Check, Download, ExternalLink, Loader2, Hash } from 'lucide-react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';

const MEMBER_APP_URL =
  process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev';

export function MemberAppTab() {
  const t = useTranslations('memberApp');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const registerUrl = joinCode ? `${MEMBER_APP_URL}/join?code=${joinCode}` : '';

  useEffect(() => {
    fetch('/api/tenant/join-info')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(t('loadError'));
        else setJoinCode(data.joinCode ?? null);
      })
      .catch(() => setError(t('networkError')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!registerUrl || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, registerUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#1c2117', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(console.error);
  }, [registerUrl]);

  function copy(text: string, key: 'code' | 'link') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleDownload() {
    const offscreen = document.createElement('canvas');
    const size = 600;
    offscreen.width = size;
    offscreen.height = size;
    QRCode.toCanvas(offscreen, registerUrl, {
      width: size,
      margin: 3,
      color: { dark: '#1c2117', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(() => {
      const link = document.createElement('a');
      link.download = `qr-join-${joinCode}.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">{t('loading')}</p>
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
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-1">
        <Hash className="h-4 w-4 text-brand-purple" />
        <h2 className="text-lg font-semibold text-gray-900">{t('joinCodeTitle')}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-8">{t('joinCodeSubtitle')}</p>

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
            {t('downloadPng')}
          </button>
        </div>

        {/* Code + actions */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-center sm:justify-start mb-6">
            <div className="inline-block bg-gray-50 border-2 border-gray-200 rounded-2xl px-8 py-4 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-medium">
                {t('joinCodeTitle')}
              </p>
              <span className="font-mono text-4xl font-bold tracking-[0.3em] text-gray-900">
                {joinCode}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => copy(joinCode!, 'code')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple/90 transition-colors"
            >
              {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === 'code' ? t('codeCopied') : t('copyCode')}
            </button>

            <button
              onClick={() => copy(registerUrl, 'link')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === 'link' ? t('codeCopied') : t('copyLink')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-600 truncate">
              {registerUrl}
            </div>
            <a
              href={registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-2.5 text-gray-500 hover:text-brand-purple border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title={t('openApp')}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
