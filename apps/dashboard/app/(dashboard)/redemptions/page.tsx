'use client';

import { useState, useCallback, useEffect } from 'react';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Gift, Camera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QrScanner } from '../../../components/QrScanner';

type HistoryItem = {
  id: string;
  member: string;
  reward: string;
  status: string;
  time: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RedemptionsPage() {
  const t = useTranslations('redemptions');
  const [mode, setMode] = useState<'scan' | 'manual'>('manual');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);

  const fetchHistory = useCallback(() => {
    fetch('/api/redemptions?status=used&limit=10')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.redemptions) {
          setHistory(data.redemptions.map((r: any) => ({
            id: r.id,
            member: r.members?.name ?? 'Unknown',
            reward: r.rewards?.name ?? 'Unknown reward',
            status: r.status,
            time: timeAgo(r.used_at || r.created_at),
          })));
        } else {
          setHistory([]);
        }
      });
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const processCode = useCallback(async (target: string) => {
    if (!target.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: target.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const r = data.redemption;
        setResult({
          success: true,
          message: 'Redemption successful!',
          data: {
            member: r.member?.name,
            email: r.member?.email,
            reward: r.reward?.name,
            pointsSpent: r.points_spent,
            usedAt: r.used_at,
          },
        });
        fetchHistory();
      } else {
        setResult({
          success: false,
          message: data.error || 'Invalid code. Please check and try again.',
        });
      }
    } catch {
      setResult({ success: false, message: 'Connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  const handleProcess = () => processCode(code).then(() => setCode(''));

  const handleScan = useCallback((scannedCode: string) => {
    // QR detected: stop scanner, switch to manual view, process automatically
    setMode('manual');
    setCode(scannedCode);
    processCode(scannedCode);
  }, [processCode]);

  const resetResult = () => {
    setResult(null);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner/Input Section */}
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'manual'
                    ? 'bg-brand-purple text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5" />
                  {t('enterCode')}
                </span>
              </button>
              <button
                onClick={() => { setMode('scan'); setResult(null); }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'scan'
                    ? 'bg-brand-purple text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Camera className="h-5 w-5" />
                  {t('scanQr')}
                </span>
              </button>
            </div>

            {mode === 'manual' && (
              <div className="space-y-4">
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
                    onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                  />
                </div>
                <button
                  onClick={handleProcess}
                  disabled={!code.trim() || loading}
                  className="w-full py-3 bg-brand-purple text-white rounded-lg font-medium hover:bg-brand-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('processing')}
                    </span>
                  ) : (
                    t('processRedemption')
                  )}
                </button>
              </div>
            )}

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
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-6 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
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
                  <button
                    onClick={resetResult}
                    className="mt-4 text-sm text-green-700 hover:text-green-800 underline"
                  >
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
                  <button
                    onClick={resetResult}
                    className="mt-4 text-sm text-red-700 hover:text-red-800 underline"
                  >
                    {t('tryAgain')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Redemptions */}
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{t('recentRedemptions')}</h2>
          </div>
          <div className="divide-y">
            {history === null ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading...</div>
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

      {/* Tips Section */}
      <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {t('tipsTitle')}
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            {t('tip1')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            {t('tip2')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            {t('tip3')}
          </li>
        </ul>
      </div>
    </div>
  );
}
