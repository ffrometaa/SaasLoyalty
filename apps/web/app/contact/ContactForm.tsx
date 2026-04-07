'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface FieldErrors {
  business_name?: string;
  business_type?: string;
  owner_name?: string;
  email?: string;
}

export function ContactForm() {
  const t = useTranslations('contact');
  const businessTypes = t.raw('businessTypes') as string[];

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateForm(): boolean {
    const errors: FieldErrors = {};

    if (!form.business_name.trim()) {
      errors.business_name = t('businessNameError');
    }
    if (!form.business_type) {
      errors.business_type = t('businessTypeError');
    }
    if (!form.owner_name.trim()) {
      errors.owner_name = t('ownerNameError');
    }
    if (!form.email.trim()) {
      errors.email = t('emailRequiredError');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = t('emailInvalidError');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.business_name.trim(),
          business_type: form.business_type,
          owner_name: form.owner_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          message: form.message.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  const inputBase = "w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-colors";
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)');
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, hasError?: boolean) =>
    (e.currentTarget.style.borderColor = hasError ? 'rgba(225,29,72,0.6)' : 'rgba(255,255,255,0.1)');

  if (success) {
    return (
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
          {t('successHeading')}
        </h2>
        <p className="text-white/50">
          {t('successBody')}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 p-8 rounded-2xl"
      style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">
            {t('businessName')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => update('business_name', e.target.value)}
            placeholder={t('businessNamePlaceholder')}
            className={inputBase}
            style={{
              ...inputStyle,
              borderColor: fieldErrors.business_name ? 'rgba(225,29,72,0.6)' : 'rgba(255,255,255,0.1)',
            }}
            onFocus={inputFocus}
            onBlur={(e) => inputBlur(e, !!fieldErrors.business_name)}
          />
          {fieldErrors.business_name && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.business_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">
            {t('businessType')} <span className="text-red-400">*</span>
          </label>
          <select
            value={form.business_type}
            onChange={(e) => update('business_type', e.target.value)}
            className={`${inputBase} appearance-none`}
            style={{
              ...inputStyle,
              borderColor: fieldErrors.business_type ? 'rgba(225,29,72,0.6)' : 'rgba(255,255,255,0.1)',
              color: form.business_type ? '#fff' : 'rgba(255,255,255,0.3)',
            }}
            onFocus={inputFocus}
            onBlur={(e) => inputBlur(e, !!fieldErrors.business_type)}
          >
            <option value="" disabled style={{ background: '#111118' }}>{t('businessTypePlaceholder')}</option>
            {businessTypes.map((type) => (
              <option key={type} value={type} style={{ background: '#111118' }}>{type}</option>
            ))}
          </select>
          {fieldErrors.business_type && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.business_type}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">
            {t('ownerName')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.owner_name}
            onChange={(e) => update('owner_name', e.target.value)}
            placeholder={t('ownerNamePlaceholder')}
            className={inputBase}
            style={{
              ...inputStyle,
              borderColor: fieldErrors.owner_name ? 'rgba(225,29,72,0.6)' : 'rgba(255,255,255,0.1)',
            }}
            onFocus={inputFocus}
            onBlur={(e) => inputBlur(e, !!fieldErrors.owner_name)}
          />
          {fieldErrors.owner_name && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.owner_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">
            {t('email')} <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder={t('emailPlaceholder')}
            className={inputBase}
            style={{
              ...inputStyle,
              borderColor: fieldErrors.email ? 'rgba(225,29,72,0.6)' : 'rgba(255,255,255,0.1)',
            }}
            onFocus={inputFocus}
            onBlur={(e) => inputBlur(e, !!fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/60 mb-1.5">{t('phone')}</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder={t('phonePlaceholder')}
          className={inputBase}
          style={inputStyle}
          onFocus={inputFocus}
          onBlur={(e) => inputBlur(e)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/60 mb-1.5">{t('message')}</label>
        <textarea
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          placeholder={t('messagePlaceholder')}
          rows={4}
          className={`${inputBase} resize-none`}
          style={inputStyle}
          onFocus={inputFocus}
          onBlur={(e) => inputBlur(e)}
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
        {loading ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
