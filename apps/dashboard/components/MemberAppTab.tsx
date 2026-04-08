'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Check, Download, ExternalLink, Loader2, QrCode, Hash, Gift, ToggleLeft, ToggleRight } from 'lucide-react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';

const MEMBER_APP_URL =
  process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev';

export function MemberAppTab() {
  const t = useTranslations('memberApp');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [slug, setSlug] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'link' | 'code' | 'reglink' | null>(null);

  // Referral program state
  const [referralEnabled, setReferralEnabled] = useState(false);
  const [referralPointsReferrer, setReferralPointsReferrer] = useState(50);
  const [referralPointsReferee, setReferralPointsReferee] = useState(50);
  const [referralSaving, setReferralSaving] = useState(false);
  const [referralSaved, setReferralSaved] = useState(false);

  const joinUrl = slug ? `${MEMBER_APP_URL}/join/${slug}` : '';
  const registerUrl = joinCode ? `${MEMBER_APP_URL}/join?code=${joinCode}` : '';

  // Fetch tenant join info + referral settings
  useEffect(() => {
    Promise.all([
      fetch('/api/tenant/join-info').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([joinData, settingsData]) => {
        if (joinData.error) {
          setError(t('loadError'));
        } else {
          setSlug(joinData.slug);
          setAppName(joinData.appName);
          setBusinessName(joinData.businessName ?? joinData.appName);
          setJoinCode(joinData.joinCode ?? null);
        }
        if (!settingsData.error) {
          setReferralEnabled(settingsData.referralEnabled ?? false);
          setReferralPointsReferrer(settingsData.referralPointsReferrer ?? 50);
          setReferralPointsReferee(settingsData.referralPointsReferee ?? 50);
        }
      })
      .catch(() => setError(t('networkError')))
      .finally(() => setLoading(false));
  }, []);

  async function saveReferralSettings() {
    setReferralSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralEnabled, referralPointsReferrer, referralPointsReferee }),
      });
      setReferralSaved(true);
      setTimeout(() => setReferralSaved(false), 2000);
    } finally {
      setReferralSaving(false);
    }
  }

  // Render QR for join URL (slug-based)
  useEffect(() => {
    if (!joinUrl || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, joinUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#1c2117', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(console.error);
  }, [joinUrl]);

  // Render QR for register?code= URL
  useEffect(() => {
    if (!registerUrl || !codeCanvasRef.current) return;
    QRCode.toCanvas(codeCanvasRef.current, registerUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#1c2117', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(console.error);
  }, [registerUrl]);

  function copy(text: string, key: 'link' | 'code' | 'reglink') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleDownload(canvas: HTMLCanvasElement | null, filename: string) {
    if (!canvas) return;
    const offscreen = document.createElement('canvas');
    const size = 600;
    offscreen.width = size;
    offscreen.height = size;
    const url = canvas === canvasRef.current ? joinUrl : registerUrl;
    QRCode.toCanvas(offscreen, url, {
      width: size,
      margin: 3,
      color: { dark: '#1c2117', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(() => {
      const link = document.createElement('a');
      link.download = filename;
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
    <div className="space-y-6">
      {/* ── JOIN CODE CARD ─────────────────────────────────────────────────── */}
      {joinCode && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-4 w-4 text-brand-purple" />
            <h2 className="text-lg font-semibold text-gray-900">{t('joinCodeTitle')}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">{t('joinCodeSubtitle')}</p>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* QR for register?code= URL */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="rounded-2xl border-2 border-gray-100 p-3 bg-white shadow-sm">
                <canvas ref={codeCanvasRef} className="rounded-lg" />
              </div>
              <p className="text-xs text-gray-400 text-center">{t('scanToJoin', { name: businessName })}</p>
              <button
                onClick={() => handleDownload(codeCanvasRef.current, `qr-code-${joinCode}.png`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                {t('downloadQr')}
              </button>
            </div>

            {/* Code display + actions */}
            <div className="flex-1 min-w-0">
              {/* Big code display */}
              <div className="flex justify-center sm:justify-start mb-5">
                <div className="inline-block bg-gray-50 border-2 border-gray-200 rounded-2xl px-8 py-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-medium">
                    {t('joinCodeTitle')}
                  </p>
                  <span className="font-mono text-4xl font-bold tracking-[0.3em] text-gray-900">
                    {joinCode}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => copy(joinCode, 'code')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple/90 transition-colors"
                >
                  {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === 'code' ? t('codeCopied') : t('copyCode')}
                </button>

                <button
                  onClick={() => copy(registerUrl, 'reglink')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {copied === 'reglink' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === 'reglink' ? t('codeCopied') : t('copyLink')}
                </button>
              </div>

              {/* Register URL display */}
              <div className="flex items-center gap-2 mb-5">
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

              {/* Share tip */}
              <div className="p-4 bg-brand-purple/5 border border-brand-purple/10 rounded-xl">
                <p className="text-sm text-gray-600">{t('shareCodeTip')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── JOIN LINK CARD (original slug QR) ────────────────────────────── */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('title')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('subtitle')}</p>

        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="rounded-2xl border-2 border-gray-100 p-3 bg-white shadow-sm">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>
            <button
              onClick={() => handleDownload(canvasRef.current, `qr-${slug}.png`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              {t('downloadPng')}
            </button>
          </div>

          {/* URL + info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 mb-2">{t('accessLink')}</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-700 truncate">
                {joinUrl}
              </div>
              <button
                onClick={() => copy(joinUrl, 'link')}
                title={t('copyTitle')}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple-700 transition-colors"
              >
                {copied === 'link' ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('copyLink')}</span>
                  </>
                )}
              </button>
            </div>

            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-brand-purple hover:text-brand-purple-700 font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('openApp')}
            </a>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-800 mb-3">{t('howToUse')}</p>
              <ol className="space-y-2 text-sm text-gray-600">
                {(['step1', 'step2', 'step3', 'step4'] as const).map((step, i) => (
                  <li key={step} className="flex gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-brand-purple-100 text-brand-purple-700 text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {t(step)}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Print tip */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <QrCode className="h-4 w-4 text-brand-purple" />
          {t('printTip')}
        </h3>
        <p className="text-sm text-gray-600">{t('printTipDesc')}</p>
      </div>

      {/* Referral Program */}
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-brand-purple" />
            <h3 className="text-sm font-semibold text-gray-900">Programa de Referidos</h3>
          </div>
          <button
            onClick={() => setReferralEnabled((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium"
          >
            {referralEnabled ? (
              <><ToggleRight className="h-6 w-6 text-brand-purple" /><span className="text-brand-purple">Activo</span></>
            ) : (
              <><ToggleLeft className="h-6 w-6 text-gray-400" /><span className="text-gray-400">Inactivo</span></>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Los miembros reciben un link único para invitar amigos. Cuando el referido hace su primera visita, ambos reciben puntos bonus.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Puntos para el que refiere
            </label>
            <input
              type="number"
              min={0}
              max={10000}
              value={referralPointsReferrer}
              onChange={(e) => setReferralPointsReferrer(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={!referralEnabled}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Puntos para el referido
            </label>
            <input
              type="number"
              min={0}
              max={10000}
              value={referralPointsReferee}
              onChange={(e) => setReferralPointsReferee(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={!referralEnabled}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
        </div>

        <button
          onClick={saveReferralSettings}
          disabled={referralSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-purple text-white hover:bg-brand-purple-700 disabled:opacity-50 transition-colors"
        >
          {referralSaved ? (
            <><Check className="h-4 w-4" /> Guardado</>
          ) : referralSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
          ) : (
            'Guardar configuración'
          )}
        </button>
      </div>
    </div>
  );
}
