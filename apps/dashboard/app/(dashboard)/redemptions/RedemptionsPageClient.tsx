'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Gift, Camera, Eye, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QrScanner } from '../../../components/QrScanner';
import { SectionErrorBoundary } from '../../../components/SectionErrorBoundary';

export interface HistoryItem {
  id: string;
  member: string;
  reward: string;
  status: string;
  time: string;
}

interface VerifyPreview {
  id: string;
  member: { id: string; name: string; email: string; tier: string; points_balance: number };
  reward: { id: string; name: string };
  points_spent: number;
  expires_at: string;
}

interface RedemptionResult {
  success: boolean;
  message: string;
  data?: {
    member?: string;
    email?: string;
    reward?: string;
    pointsSpent?: number;
    usedAt?: string;
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'text-amber-700 bg-amber-100',
  silver: 'text-gray-700 bg-gray-100',
  gold: 'text-yellow-700 bg-yellow-100',
  platinum: 'text-purple-700 bg-purple-100',
};

interface Props {
  initialHistory: HistoryItem[];
  initialTodayCount: number;
}

export function RedemptionsPageClient({ initialHistory, initialTodayCount }: Props): JSX.Element {
  const t = useTranslations('redemptions');

  // Input mode: manual entry | camera scan | verify-only camera
  const [mode, setMode] = useState<'manual' | 'scan' | 'verify'>('manual');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RedemptionResult | null>(null);

  // Verify preview (mode=verify)
  const [verifyPreview, setVerifyPreview] = useState<VerifyPreview | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // History + today count
  const [history, setHistory] = useState<HistoryItem[] | null>(initialHistory);
  const [todayCount, setTodayCount] = useState(initialTodayCount);

  const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  interface RecentRedemptionItem {
    id: string;
    members?: { name?: string };
    rewards?: { name?: string };
    status: string;
    used_at?: string;
    created_at: string;
  }
  interface RecentResponse { redemptions?: RecentRedemptionItem[] }
  interface TodayResponse { total?: number }

  const fetchHistory = useCallback((): void => {
    const todayStart = `${todayISO}T00:00:00.000Z`;
    Promise.all([
      fetch('/api/redemptions?status=used&limit=10').then(r => r.ok ? r.json() as Promise<RecentResponse> : null),
      fetch(`/api/redemptions?status=used&since=${encodeURIComponent(todayStart)}&limit=100`).then(r => r.ok ? r.json() as Promise<TodayResponse> : null),
    ]).then(([recent, today]: [RecentResponse | null, TodayResponse | null]): void => {
      if (recent?.redemptions) {
        setHistory(recent.redemptions.map((r: { id: string; members?: { name?: string }; rewards?: { name?: string }; status: string; used_at?: string; created_at: string }) => ({
          id: r.id,
          member: r.members?.name ?? 'Unknown',
          reward: r.rewards?.name ?? 'Unknown reward',
          status: r.status,
          time: timeAgo(r.used_at || r.created_at),
        })));
      } else {
        setHistory([]);
      }
      if (today?.total != null) {
        setTodayCount(today.total);
      }
    });
  }, [todayISO]);

  // ── Process (mark as used) ──────────────────────────────────────────────────
  const processCode = useCallback(async (target: string): Promise<void> => {
    if (!target.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: target.trim() }),
      });
      const data = await response.json() as { success?: boolean; error?: string; redemption?: { member?: { name?: string; email?: string }; reward?: { name?: string }; points_spent?: number; used_at?: string } };
      if (response.ok && data.success) {
        const r = data.redemption;
        setResult({
          success: true,
          message: 'Redemption successful!',
          data: {
            member: r.member?.name ?? r.member?.email,
            email: r.member?.email,
            reward: r.reward?.name,
            pointsSpent: r.points_spent,
            usedAt: r.used_at,
          },
        });
        fetchHistory();
      } else {
        setResult({ success: false, message: data.error || 'Invalid code. Please check and try again.' });
      }
    } catch {
      setResult({ success: false, message: 'Connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  // ── Verify (preview only) ───────────────────────────────────────────────────
  const verifyCode = useCallback(async (target: string): Promise<void> => {
    if (!target.trim()) return;
    setVerifyLoading(true);
    setVerifyPreview(null);
    setVerifyError(null);
    try {
      const res = await fetch(`/api/redemptions/verify?code=${encodeURIComponent(target.trim())}`);
      const data = await res.json() as { valid?: boolean; error?: string; redemption?: VerifyPreview };
      if (res.ok && data.valid) {
        setVerifyPreview(data.redemption ?? null);
      } else {
        setVerifyError(data.error || 'C\u00f3digo inv\u00e1lido o expirado');
      }
    } catch {
      setVerifyError('Error de conexi\u00f3n. Intent\u00e1 de nuevo.');
    } finally {
      setVerifyLoading(false);
    }
  }, []);

  const handleProcess = (): Promise<void> => processCode(code).then(() => setCode(''));
  const handleVerify = (): Promise<void> => verifyCode(code).then(() => setCode(''));

  const handleScan = useCallback((scannedCode: string) => {
    setMode('manual');
    setCode(scannedCode);
    processCode(scannedCode);
  }, [processCode]);

  const handleVerifyScan = useCallback((scannedCode: string) => {
    // Stay in scan view but show preview
    verifyCode(scannedCode);
  }, [verifyCode]);

  const confirmVerified = async (): Promise<void> => {
    if (!verifyPreview) return;
    setVerifyPreview(null);
    setVerifyError(null);
    setMode('manual');
    await processCode(verifyPreview.id); // pass ID since we already know the redemption
  };

  const resetResult = (): void => setResult(null);
  const resetVerify = (): void => { setVerifyPreview(null); setVerifyError(null); };

  return (
    <SectionErrorBoundary section="Redemptions">
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        {todayCount > 0 && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">{todayCount} canjes hoy</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner/Input Section */}
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setMode('manual'); resetResult(); resetVerify(); }}
                className={clsx('flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors', mode === 'manual' ? 'bg-brand-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <QrCode className="h-4 w-4" />
                  {t('enterCode')}
                </span>
              </button>
              <button
                onClick={() => { setMode('scan'); resetResult(); resetVerify(); }}
                className={clsx('flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors', mode === 'scan' ? 'bg-brand-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Camera className="h-4 w-4" />
                  {t('scanQr')}
                </span>
              </button>
              <button
                onClick={() => { setMode('verify'); resetResult(); resetVerify(); }}
                className={clsx('flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors', mode === 'verify' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                title="Verific\u00e1 la validez del c\u00f3digo sin consumirlo"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  Verificar
                </span>
              </button>
            </div>

            {/* ── Manual entry (process or verify) ── */}
            {(mode === 'manual' || mode === 'verify') && (
              <div className="space-y-4">
                {mode === 'verify' && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Modo verificaci\u00f3n: el c\u00f3digo <strong>no se consume</strong>. Solo muestra la info del miembro.
                  </p>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('redemptionCode')}
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={t('codePlaceholder')}
                    className="w-full px-4 py-3 text-lg border rounded-lg font-mono text-center tracking-wider focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      mode === 'verify' ? handleVerify() : handleProcess();
                    }}
                  />
                </div>
                <button
                  onClick={mode === 'verify' ? handleVerify : handleProcess}
                  disabled={!code.trim() || loading || verifyLoading}
                  className={clsx('w-full py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed', mode === 'verify' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-purple hover:bg-brand-purple-700')}
                >
                  {(loading || verifyLoading) ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('processing')}
                    </span>
                  ) : mode === 'verify' ? 'Verificar c\u00f3digo' : t('processRedemption')}
                </button>
              </div>
            )}

            {/* ── Camera scan (process) ── */}
            {mode === 'scan' && (
              <div className="space-y-3">
                <QrScanner isActive={mode === 'scan'} onScan={handleScan} />
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
                    <svg className="animate-spin h-4 w-4 text-brand-purple" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('processing')}
                  </div>
                )}
              </div>
            )}

            {/* ── Verify mode scan ── */}
            {mode === 'verify' && !verifyPreview && !verifyError && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-center text-gray-500 font-medium">\u2014 o escane\u00e1 con c\u00e1mara \u2014</p>
                <QrScanner isActive={true} onScan={handleVerifyScan} />
                {verifyLoading && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
                    <svg className="animate-spin h-4 w-4 text-amber-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Verify preview ── */}
          {mode === 'verify' && verifyPreview && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-amber-800">C\u00f3digo v\u00e1lido</span>
              </div>
              <div className="bg-white rounded-lg p-4 space-y-2.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Miembro</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{verifyPreview.member.name}</span>
                    <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium capitalize', TIER_COLORS[verifyPreview.member.tier] ?? 'bg-gray-100 text-gray-700')}>
                      {verifyPreview.member.tier}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm">{verifyPreview.member.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Premio</span>
                  <span className="font-medium">{verifyPreview.reward.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Puntos</span>
                  <span className="font-medium text-red-600">-{verifyPreview.points_spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Vence</span>
                  <span className="text-sm">{new Date(verifyPreview.expires_at).toLocaleDateString('es-AR')}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={resetVerify}
                  className="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Escanear otro
                </button>
                <button
                  onClick={confirmVerified}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Confirmar canje'}
                </button>
              </div>
            </div>
          )}

          {mode === 'verify' && verifyError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-red-800">C\u00f3digo inv\u00e1lido</p>
              <p className="text-sm text-red-600 mt-1">{verifyError}</p>
              <button onClick={resetVerify} className="mt-3 text-sm text-red-700 underline">
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* ── Process result ── */}
          {result && (
            <div className={clsx('rounded-xl border p-6', result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
              {result.success ? (
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-green-800">{t('redemptionComplete')}</h3>
                  {result.data && (
                    <div className="mt-4 text-left bg-white rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('member')}</span>
                        <span className="font-medium">{result.data.member}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('email')}</span>
                        <span className="text-sm">{result.data.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('reward')}</span>
                        <span className="font-medium">{result.data.reward}</span>
                      </div>
                      {result.data.pointsSpent && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('pointsUsed')}</span>
                          <span className="font-medium text-red-600">-{result.data.pointsSpent.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={resetResult} className="mt-4 text-sm text-green-700 hover:text-green-800 underline">
                    {t('processAnother')}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-red-800">{t('redemptionFailed')}</h3>
                  <p className="mt-2 text-red-700">{result.message}</p>
                  <button onClick={resetResult} className="mt-4 text-sm text-red-700 hover:text-red-800 underline">
                    {t('tryAgain')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Redemptions */}
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('recentRedemptions')}</h2>
            {todayCount > 0 && (
              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                {todayCount} hoy
              </span>
            )}
          </div>
          <div className="divide-y">
            {history === null ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">Cargando...</div>
            ) : history.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Gift className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">{t('noRedemptions')}</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Gift className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.member}</p>
                      <p className="text-sm text-gray-500">{item.reward}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {item.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {t('tipsTitle')}
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2"><span className="text-blue-400">&bull;</span>{t('tip1')}</li>
          <li className="flex items-start gap-2"><span className="text-blue-400">&bull;</span>{t('tip2')}</li>
          <li className="flex items-start gap-2"><span className="text-blue-400">&bull;</span>{t('tip3')}</li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">&bull;</span>
            El modo <strong>Verificar</strong> te permite confirmar la identidad y el premio antes de consumir el c\u00f3digo.
          </li>
        </ul>
      </div>
    </div>
    </SectionErrorBoundary>
  );
}
