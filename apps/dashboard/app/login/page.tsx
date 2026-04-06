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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-brand-purple flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">LoyaltyOS</span>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-purple/10 border border-brand-purple/20 rounded-full mb-4">
                <svg className="h-7 w-7 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Verificá tu identidad</h1>
              <p className="text-gray-400 mt-2 text-sm">
                Enviamos un código de 6 dígitos a<br />
                <span className="font-medium text-gray-200">{otpEmail}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-1.5">
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
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpCode.length !== 6}
                className="w-full py-2.5 px-4 bg-brand-purple hover:bg-brand-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {otpLoading ? 'Verificando...' : 'Verificar'}
              </button>
            </form>

            <div className="mt-5 text-center space-x-4">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors underline underline-offset-2"
              >
                Reenviar código
              </button>
              <span className="text-gray-700">·</span>
              <button
                type="button"
                onClick={() => { setStep('credentials'); setError(null); setOtpCode(''); }}
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors underline underline-offset-2"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-brand-purple flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">LoyaltyOS</span>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
            <p className="text-gray-400 mt-1 text-sm">Ingresá a tu panel de fidelización</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                placeholder="vos@empresa.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-purple hover:bg-brand-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <a href="/forgot-password" className="text-sm text-gray-400 hover:text-gray-200 transition-colors underline underline-offset-2">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
