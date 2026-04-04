'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@loyalty-os/lib';

type LoginStep = 'credentials' | 'otp';

function getOrCreateDeviceId(): string {
  const key = 'loyaltyos_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<LoginStep>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Check if this device is already trusted
    const deviceId = getOrCreateDeviceId();
    const res = await fetch('/api/auth/check-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    });
    const { trusted } = await res.json();

    if (trusted) {
      window.location.href = '/';
      return;
    }

    // New device — send OTP and show verification screen
    const otpRes = await fetch('/api/auth/send-otp', { method: 'POST' });
    const otpData = await otpRes.json();

    if (!otpRes.ok) {
      setError('No se pudo enviar el código. Intentá de nuevo.');
      setLoading(false);
      return;
    }

    setOtpEmail(otpData.email || email);
    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setError(null);

    const deviceId = getOrCreateDeviceId();
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp_code: otpCode,
        device_id: deviceId,
        device_name: navigator.userAgent.slice(0, 100),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      const messages: Record<string, string> = {
        'Invalid OTP code': 'Código incorrecto. Verificá e intentá de nuevo.',
        'OTP has expired': 'El código venció. Volvé a iniciar sesión.',
        'No pending OTP found': 'No hay código pendiente. Volvé a iniciar sesión.',
      };
      setError(messages[data.error] || 'Error al verificar el código.');
      setOtpLoading(false);
      return;
    }

    if (data.verified) {
      window.location.href = '/';
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    const res = await fetch('/api/auth/send-otp', { method: 'POST' });
    if (!res.ok) {
      setError('No se pudo reenviar el código.');
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-4">
              <svg className="h-7 w-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verificá tu identidad</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Enviamos un código de 6 dígitos a<br />
              <span className="font-medium text-gray-700">{otpEmail}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Código de verificación
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpCode.length !== 6}
              className="w-full py-2 px-4 bg-brand-purple hover:bg-brand-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {otpLoading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Reenviar código
            </button>
            <span className="mx-2 text-gray-300">·</span>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(null); setOtpCode(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">LoyaltyOS Dashboard</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your loyalty program</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              placeholder="you@business.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-brand-purple hover:bg-brand-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
