'use client';

import { useState, useRef, useEffect } from 'react';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Gift, Camera } from 'lucide-react';

export default function RedemptionsPage() {
  const [mode, setMode] = useState<'scan' | 'manual'>('manual');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Mock redemption history
  useEffect(() => {
    setHistory([
      { id: '1', member: 'Maria Garcia', reward: 'Free Massage', status: 'used', time: '2 min ago' },
      { id: '2', member: 'Carlos Rodriguez', reward: '10% Off', status: 'used', time: '15 min ago' },
      { id: '3', member: 'Ana Martinez', reward: 'VIP Treatment', status: 'used', time: '1 hour ago' },
    ]);
  }, []);

  const handleProcess = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      // Mock validation
      if (code.toUpperCase() === 'RDM-TEST123') {
        setResult({
          success: true,
          message: 'Redemption successful!',
          data: {
            member: 'Maria Garcia',
            email: 'maria@email.com',
            reward: 'Free Massage (30 min)',
            pointsSpent: 5000,
            usedAt: new Date().toISOString(),
          },
        });
        setHistory(prev => [{
          id: Date.now().toString(),
          member: 'Maria Garcia',
          reward: 'Free Massage',
          status: 'used',
          time: 'Just now',
        }, ...prev]);
      } else if (code.toUpperCase() === 'EXPIRED') {
        setResult({
          success: false,
          message: 'This redemption has expired',
        });
      } else {
        setResult({
          success: false,
          message: 'Invalid code. Please check and try again.',
        });
      }
      setLoading(false);
      setCode('');
    }, 1500);
  };

  const resetResult = () => {
    setResult(null);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Process Redemptions</h1>
        <p className="text-gray-600 mt-1">Scan or enter a member&apos;s redemption code to complete their reward</p>
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
                  Enter Code
                </span>
              </button>
              <button
                onClick={() => setMode('scan')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'scan'
                    ? 'bg-brand-purple text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Camera className="h-5 w-5" />
                  Scan QR
                </span>
              </button>
            </div>

            {mode === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Redemption Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g., RDM-ABC123)"
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
                      Processing...
                    </span>
                  ) : (
                    'Process Redemption'
                  )}
                </button>
              </div>
            )}

            {mode === 'scan' && (
              <div className="text-center py-12">
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="mt-4 text-sm text-gray-500">Camera scanner</p>
                    <p className="text-xs text-gray-400">Coming soon</p>
                  </div>
                </div>
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
                  <h3 className="mt-4 text-lg font-semibold text-green-800">Redemption Complete!</h3>
                  {result.data && (
                    <div className="mt-4 text-left bg-white rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Member</span>
                        <span className="font-medium">{result.data.member}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="text-sm">{result.data.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reward</span>
                        <span className="font-medium">{result.data.reward}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Points Used</span>
                        <span className="font-medium text-red-600">-{result.data.pointsSpent.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={resetResult}
                    className="mt-4 text-sm text-green-700 hover:text-green-800 underline"
                  >
                    Process another
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-red-800">Redemption Failed</h3>
                  <p className="mt-2 text-red-700">{result.message}</p>
                  <button
                    onClick={resetResult}
                    className="mt-4 text-sm text-red-700 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Redemptions */}
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Redemptions</h2>
          </div>
          <div className="divide-y">
            {history.map((item) => (
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
            ))}
            {history.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Gift className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No redemptions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Tips for Processing Redemptions
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            Members can show their QR code in the app or provide the alphanumeric code
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            Redemptions expire 30 days after creation
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            Once processed, the reward cannot be undone
          </li>
        </ul>
      </div>
    </div>
  );
}
