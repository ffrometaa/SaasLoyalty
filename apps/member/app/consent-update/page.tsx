'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface PendingDocument {
  document_id: string;
  type: string;
  version: string;
  effective_at: string;
}

export default function ConsentUpdatePage() {
  const t = useTranslations('consent');

  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetch('/api/consent')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setFetchError(data.error);
          return;
        }
        setPending(data.pending ?? []);
        const initial: Record<string, boolean> = {};
        (data.pending ?? []).forEach((d: PendingDocument) => {
          initial[d.document_id] = false;
        });
        setAccepted(initial);
      })
      .catch(() => setFetchError('Failed to load documents.'))
      .finally(() => setLoading(false));
  }, []);

  const allAccepted = pending.length > 0 && pending.every((d) => accepted[d.document_id]);

  async function handleSubmit() {
    if (!allAccepted) return;
    setSubmitting(true);
    setSubmitError('');

    const documentIds = pending.map((d) => d.document_id);
    const res = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: documentIds }),
    }).catch(() => null);

    if (!res?.ok) {
      const err = await res?.json().catch(() => ({}));
      setSubmitError(err?.error ?? 'Failed to save consent.');
      setSubmitting(false);
      return;
    }

    // Hard navigation — forces a fresh server render so ConsentGuard
    // picks up pendingCount = 0 and doesn't redirect back here
    window.location.href = '/';
  }

  const btnStyle = { background: 'linear-gradient(135deg, #e11d48, #7c3aed)' };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <p className="text-white/50 text-sm">{t('loading')}</p>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a0f' }}>
        <p className="text-red-400 text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
          {fetchError}
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0a0a0f' }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">{t('update_title')}</h1>
          <p className="text-sm text-white/50">{t('update_description')}</p>
        </div>

        <div className="space-y-3">
          {pending.map((doc) => (
            <label
              key={doc.document_id}
              className="flex items-start gap-3 cursor-pointer select-none p-4 rounded-[14px] bg-white/5 border border-white/10"
            >
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={accepted[doc.document_id] ?? false}
                  onChange={(e) =>
                    setAccepted((prev) => ({ ...prev, [doc.document_id]: e.target.checked }))
                  }
                  className="sr-only"
                />
                <div
                  className={[
                    'w-4 h-4 rounded border transition-all',
                    accepted[doc.document_id]
                      ? 'border-[#7c3aed] bg-[#7c3aed]'
                      : 'border-white/20 bg-white/5',
                  ].join(' ')}
                  style={
                    accepted[doc.document_id]
                      ? { boxShadow: '0 0 0 2px rgba(124,58,237,0.25)' }
                      : undefined
                  }
                >
                  {accepted[doc.document_id] && (
                    <svg className="w-3 h-3 text-white m-auto mt-0.5" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {/* Document names are hardcoded — legal docs must not be translated */}
                  {doc.type === 'terms_of_service' ? 'Terms of Service' : 'Privacy Policy'}
                  <span className="ml-2 text-xs text-white/30">v{doc.version}</span>
                </p>
                <a
                  href={doc.type === 'terms_of_service' ? '/legal/member-terms' : '/legal/privacy-policy'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#a78bfa] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Read document
                </a>
              </div>
            </label>
          ))}
        </div>

        {submitError && (
          <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            {submitError}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!allAccepted || submitting}
          className="w-full py-4 rounded-[14px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all"
          style={{ ...btnStyle, opacity: !allAccepted || submitting ? 0.6 : 1 }}
        >
          {submitting ? t('loading') : t('accept_button')}
        </button>
      </div>
    </main>
  );
}
