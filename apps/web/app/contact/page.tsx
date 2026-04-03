'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { getSupabaseClient } from '@loyalty-os/lib';

const BUSINESS_TYPES = [
  'Spa/Salon',
  'Restaurant/Café',
  'Gym/Studio',
  'Retail Shop',
  'Hotel',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({
    business_name: '',
    business_type: '',
    owner_name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.business_name || !form.business_type || !form.owner_name || !form.email) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: dbError } = await supabase.from('demo_requests').insert({
        business_name: form.business_name,
        business_type: form.business_type,
        owner_name: form.owner_name,
        email: form.email,
        phone: form.phone || null,
        message: form.message || null,
      });

      if (dbError) throw dbError;
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again or email us at support@loyaltyos.com');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen" style={{ background: '#0a0a0f' }}>
        <div className="max-w-2xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase block mb-4">
              Contact
            </span>
            <h1 className="font-display font-black text-white mb-4" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
              Book a Demo
            </h1>
            <p className="text-white/50 text-lg">
              Tell us about your business and we&apos;ll set up a personalized demo within 24 hours.
            </p>
          </div>

          {success ? (
            <div
              className="text-center py-16 px-8 rounded-2xl"
              style={{ background: '#111118', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-white text-2xl mb-3">
                We&apos;ll be in touch soon!
              </h2>
              <p className="text-white/50">
                Thanks for reaching out. We&apos;ve received your request and will contact you within 24 hours to schedule your demo.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-8 rounded-2xl"
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Business Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={(e) => update('business_name', e.target.value)}
                    placeholder="Serenity Spa"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Business Type <span className="text-brand-red">*</span>
                  </label>
                  <select
                    value={form.business_type}
                    onChange={(e) => update('business_type', e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-colors appearance-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: form.business_type ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  >
                    <option value="" disabled style={{ background: '#111118' }}>Select type...</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t} style={{ background: '#111118' }}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Your Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.owner_name}
                    onChange={(e) => update('owner_name', e.target.value)}
                    placeholder="Maria Lopez"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Email <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@yourbusiness.com"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Message (optional)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder="Tell us about your business and what you are looking for..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-colors resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.3)',
                }}
              >
                {loading ? 'Sending...' : 'Request a Demo'}
              </button>
            </form>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
