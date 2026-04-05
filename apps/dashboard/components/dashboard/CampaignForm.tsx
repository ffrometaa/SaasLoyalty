'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SEGMENTS } from '../../lib/campaigns/segment-constants';
import { createCampaign, updateCampaign, scheduleCampaign, sendCampaignNow } from '../../lib/campaigns/actions';
import type { Campaign } from '../../lib/campaigns/queries';

// ─── TYPE CARD ────────────────────────────────────────────────────────────────

const CAMPAIGN_TYPES = [
  {
    id: 'push',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: 'email',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'inapp',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'sms',
    comingSoon: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
];

const MULTIPLIERS = [1, 1.5, 2, 3];

// ─── PUSH PREVIEW ─────────────────────────────────────────────────────────────

function PushPreview({ subject, body, imageUrl }: { subject: string; body: string; imageUrl: string }) {
  return (
    <div className="bg-gray-100 rounded-2xl p-4 flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-brand-purple flex items-center justify-center flex-shrink-0">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{subject || 'Notification Title'}</p>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{body || 'Your message will appear here...'}</p>
        {imageUrl && (
          <img src={imageUrl} alt="" className="mt-2 rounded-lg max-h-24 object-cover w-full" />
        )}
      </div>
    </div>
  );
}

// ─── EMAIL BILINGUAL PREVIEW ───────────────────────────────────────────────────

function EmailPreview({
  subject,
  bodyEn,
  bodyEs,
}: {
  subject: string;
  bodyEn: string;
  bodyEs: string;
}) {
  const [tab, setTab] = useState<'en' | 'es'>('en');
  const activeBody = tab === 'en' ? bodyEn : bodyEs;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden text-[10px]">
      {/* Subject bar */}
      <div className="bg-gray-50 px-3 py-2 border-b">
        <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: '8px' }}>Subject</p>
        <p className="font-medium text-gray-800 truncate" style={{ fontSize: '10px' }}>
          {subject || 'Email Subject'} / {subject || 'Asunto'}
        </p>
      </div>

      {/* Language tabs */}
      <div className="flex border-b">
        {(['en', 'es'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setTab(lang)}
            className={`flex-1 py-1.5 text-center font-bold uppercase tracking-widest transition-colors ${
              tab === lang
                ? 'bg-brand-purple text-white'
                : 'bg-white text-gray-400 hover:bg-gray-50'
            }`}
            style={{ fontSize: '8px' }}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="text-gray-600 whitespace-pre-wrap leading-relaxed max-h-32 overflow-hidden" style={{ fontSize: '9px' }}>
          {activeBody || (tab === 'en' ? 'English body will appear here...' : 'El cuerpo en español aparecerá aquí...')}
        </div>
      </div>

      {/* Bilingual indicator */}
      <div className="px-3 pb-2">
        <div className="h-px bg-gray-100 mb-2" />
        <p className="text-gray-300 text-center" style={{ fontSize: '8px' }}>
          EN + ES · Bilingual email
        </p>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseEmailBodies(campaign?: Campaign) {
  if (!campaign?.description) return { bodyEn: '', bodyEs: '' };
  try {
    const parsed = JSON.parse(campaign.description) as { body_en?: string; body_es?: string };
    return { bodyEn: parsed.body_en || '', bodyEs: parsed.body_es || '' };
  } catch {
    return { bodyEn: campaign.body || '', bodyEs: '' };
  }
}

function parsePushBilingual(campaign?: Campaign) {
  if (!campaign?.description) return { subjectEs: '', pushBodyEs: '' };
  try {
    const parsed = JSON.parse(campaign.description) as { subject_es?: string; body_es?: string };
    return { subjectEs: parsed.subject_es || '', pushBodyEs: parsed.body_es || '' };
  } catch {
    return { subjectEs: '', pushBodyEs: '' };
  }
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────

export default function CampaignForm({
  campaign,
  tenantId,
}: {
  campaign?: Campaign;
  tenantId: string;
}) {
  const t = useTranslations('campaigns');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isEdit = !!campaign;
  const defaultType = campaign?.type ?? 'push';
  const defaultSchedule = searchParams.get('schedule') === '1' ? 'later' : 'now';
  const { bodyEn: initialBodyEn, bodyEs: initialBodyEs } = parseEmailBodies(campaign);
  const { subjectEs: initialSubjectEs, pushBodyEs: initialPushBodyEs } = parsePushBilingual(campaign);

  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState(campaign?.subject ?? '');
  const [subjectEs, setSubjectEs] = useState(initialSubjectEs);
  const [body, setBody] = useState(campaign?.body ?? '');
  const [bodyEn, setBodyEn] = useState(initialBodyEn);
  const [bodyEs, setBodyEs] = useState(initialBodyEs);
  const [pushBodyEs, setPushBodyEs] = useState(initialPushBodyEs);
  const [imageUrl, setImageUrl] = useState(campaign?.image_url ?? '');
  const [ctaText, setCtaText] = useState(campaign?.cta_text ?? '');
  const [ctaUrl, setCtaUrl] = useState(campaign?.cta_url ?? '');
  const [segment, setSegment] = useState(campaign?.segment ?? '');
  const [bonusEnabled, setBonusEnabled] = useState((campaign?.bonus_points ?? 0) > 0);
  const [bonusPoints, setBonusPoints] = useState(campaign?.bonus_points ?? 100);
  const [bonusMultiplier, setBonusMultiplier] = useState(campaign?.bonus_multiplier ?? 1);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>(defaultSchedule as 'now' | 'later');
  const [scheduledAt, setScheduledAt] = useState(campaign?.scheduled_at?.slice(0, 16) ?? '');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showSubject = type === 'push' || type === 'email';
  const isEmailType = type === 'email';
  const isPushType = type === 'push';
  const maxBody = type === 'push' ? 200 : undefined;

  const buildFormData = (name: string) => {
    const fd = new FormData();
    fd.set('name', name);
    fd.set('type', type);
    fd.set('subject', subject);
    if (isEmailType) {
      fd.set('body', bodyEn || bodyEs || '');
      fd.set('body_en', bodyEn);
      fd.set('body_es', bodyEs);
    } else if (isPushType) {
      fd.set('body', body);
      fd.set('body_en', '');
      fd.set('body_es', pushBodyEs);
      fd.set('subject_es', subjectEs);
    } else {
      fd.set('body', body);
      fd.set('body_en', '');
      fd.set('body_es', '');
    }
    fd.set('image_url', imageUrl);
    fd.set('cta_text', ctaText);
    fd.set('cta_url', ctaUrl);
    fd.set('segment', segment);
    fd.set('bonus_points', bonusEnabled ? String(bonusPoints) : '0');
    fd.set('bonus_multiplier', bonusEnabled ? String(bonusMultiplier) : '1');
    return fd;
  };

  const handleSaveDraft = (nameValue: string) => {
    setError(null);
    startTransition(async () => {
      const fd = buildFormData(nameValue);
      const result = isEdit
        ? await updateCampaign(campaign!.id, fd)
        : await createCampaign(fd);

      if (result.error) {
        setError(result.error);
        return;
      }

      setToast(t('successCreated'));
      setTimeout(() => router.push('/campaigns'), 1500);
    });
  };

  const handleSend = (nameValue: string, campaignId?: string) => {
    setError(null);
    startTransition(async () => {
      let id = campaignId;

      if (!id) {
        const fd = buildFormData(nameValue);
        const result = await createCampaign(fd);
        if (result.error) { setError(result.error); return; }
        id = result.data?.id;
      } else {
        const fd = buildFormData(nameValue);
        const result = await updateCampaign(id, fd);
        if (result.error) { setError(result.error); return; }
      }

      if (!id) return;

      if (scheduleMode === 'later') {
        if (!scheduledAt) { setError(t('errorScheduleFuture')); return; }
        const result = await scheduleCampaign(id, new Date(scheduledAt).toISOString());
        if (result.error) { setError(result.error); return; }
        setToast(t('successScheduled'));
      } else {
        const result = await sendCampaignNow(id);
        if (result.error) { setError(result.error); return; }
        setToast(t('successSent', { count: result.sent ?? 0 }));
      }

      setTimeout(() => router.push('/campaigns'), 1500);
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm text-white bg-green-600">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToCampaigns')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? t('editTitle') : t('newTitle')}</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = fd.get('campaign_name') as string;
          handleSaveDraft(name);
        }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: Form Sections */}
          <div className="xl:col-span-2 space-y-8">
            {/* Section 1: Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-semibold text-gray-900 border-b pb-3">{t('sectionContent')}</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fieldName')} *</label>
                <input
                  name="campaign_name"
                  type="text"
                  defaultValue={campaign?.name ?? ''}
                  required
                  placeholder={t('fieldNamePlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('fieldType')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CAMPAIGN_TYPES.map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      disabled={ct.comingSoon}
                      onClick={() => !ct.comingSoon && setType(ct.id as Campaign['type'])}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        type === ct.id && !ct.comingSoon
                          ? 'border-brand-purple bg-brand-purple-50 text-brand-purple'
                          : ct.comingSoon
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {ct.icon}
                      <span className="text-xs">{t(`type${ct.id.charAt(0).toUpperCase() + ct.id.slice(1)}` as Parameters<typeof t>[0])}</span>
                      {ct.comingSoon && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-gray-200 text-gray-500 text-[9px] rounded-full whitespace-nowrap">
                          {t('typeSmsComingSoon')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              {showSubject && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {isPushType && <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 uppercase tracking-wider">EN</span>}
                      <label className="text-sm font-medium text-gray-700">{t('fieldSubject')} *</label>
                    </div>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t('fieldSubjectPlaceholder')}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                    />
                  </div>
                  {isPushType && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 uppercase tracking-wider">ES</span>
                        <label className="text-sm font-medium text-gray-700">{t('fieldSubject')} (Español)</label>
                      </div>
                      <input
                        type="text"
                        value={subjectEs}
                        onChange={(e) => setSubjectEs(e.target.value)}
                        placeholder="Título en español..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Body — bilingual for email, single for others */}
              {isEmailType ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">{t('fieldBody')}</label>
                    <span className="text-xs text-gray-400">{t('emailBodyNote')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* English body */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 uppercase tracking-wider">EN</span>
                        <label className="text-sm font-medium text-gray-700">{t('emailBodyEn')}</label>
                      </div>
                      <textarea
                        value={bodyEn}
                        onChange={(e) => setBodyEn(e.target.value)}
                        placeholder="Write the English version of your email..."
                        rows={6}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
                      />
                    </div>
                    {/* Spanish body */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 uppercase tracking-wider">ES</span>
                        <label className="text-sm font-medium text-gray-700">{t('emailBodyEs')}</label>
                      </div>
                      <textarea
                        value={bodyEs}
                        onChange={(e) => setBodyEs(e.target.value)}
                        placeholder="Escribí la versión en español de tu email..."
                        rows={6}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
                      />
                    </div>
                  </div>
                  {!bodyEn && !bodyEs && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      {t('emailBodyNote')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {isPushType && <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 uppercase tracking-wider">EN</span>}
                        <label className="text-sm font-medium text-gray-700">{t('fieldBody')} *</label>
                      </div>
                      {maxBody && (
                        <span className={`text-xs ${body.length > maxBody ? 'text-red-500' : 'text-gray-400'}`}>
                          {t('charCount', { count: body.length, max: maxBody })}
                        </span>
                      )}
                    </div>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={t('fieldBodyPlaceholder')}
                      rows={4}
                      maxLength={maxBody}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
                    />
                  </div>
                  {isPushType && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 uppercase tracking-wider">ES</span>
                          <label className="text-sm font-medium text-gray-700">{t('fieldBody')} (Español)</label>
                        </div>
                        {maxBody && (
                          <span className={`text-xs ${pushBodyEs.length > maxBody ? 'text-red-500' : 'text-gray-400'}`}>
                            {t('charCount', { count: pushBodyEs.length, max: maxBody })}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={pushBodyEs}
                        onChange={(e) => setPushBodyEs(e.target.value)}
                        placeholder="Cuerpo del mensaje en español..."
                        rows={4}
                        maxLength={maxBody}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fieldImageUrl')}</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t('fieldImageUrlPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fieldCtaText')}</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder={t('fieldCtaTextPlaceholder')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fieldCtaUrl')}</label>
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder={t('fieldCtaUrlPlaceholder')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Audience */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 border-b pb-3">{t('sectionAudience')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SEGMENTS.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setSegment(seg.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      segment === seg.id
                        ? 'border-brand-purple bg-brand-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${segment === seg.id ? 'border-brand-purple bg-brand-purple' : 'border-gray-300'}`} />
                    <div>
                      <p className={`text-sm font-medium ${segment === seg.id ? 'text-brand-purple' : 'text-gray-700'}`}>
                        {t(seg.labelKey as Parameters<typeof t>[0])}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t(seg.descKey as Parameters<typeof t>[0])}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Bonus Points */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-base font-semibold text-gray-900">{t('sectionBonusPoints')}</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setBonusEnabled(!bonusEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${bonusEnabled ? 'bg-brand-purple' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${bonusEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>

              {bonusEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fieldBonusPoints')}</label>
                      <input
                        type="number"
                        value={bonusPoints}
                        onChange={(e) => setBonusPoints(Number(e.target.value))}
                        min={1}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fieldBonusMultiplier')}</label>
                      <div className="flex gap-2">
                        {MULTIPLIERS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setBonusMultiplier(m)}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium ${bonusMultiplier === m ? 'bg-brand-purple text-white border-brand-purple' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          >
                            {m}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 bg-brand-purple-50 rounded-lg px-3 py-2">
                    {t('bonusPreview', {
                      points: bonusPoints,
                      multiplier: bonusMultiplier,
                      total: Math.round(bonusPoints * bonusMultiplier),
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Section 4: Schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 border-b pb-3">{t('sectionSchedule')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['now', 'later'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setScheduleMode(mode)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      scheduleMode === mode ? 'border-brand-purple bg-brand-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${scheduleMode === mode ? 'border-brand-purple bg-brand-purple' : 'border-gray-300'}`} />
                    <div>
                      <p className={`text-sm font-medium ${scheduleMode === mode ? 'text-brand-purple' : 'text-gray-700'}`}>
                        {mode === 'now' ? t('fieldScheduleImmediately') : t('fieldScheduleLater')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {scheduleMode === 'later' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fieldScheduleDate')}</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  />
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isPending ? '...' : t('saveDraft')}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  const form = document.querySelector('form');
                  const fd = new FormData(form!);
                  const name = fd.get('campaign_name') as string;
                  if (!name.trim()) { setError(t('errorNameRequired')); return; }
                  handleSend(name, campaign?.id);
                }}
                className="flex-1 px-5 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-medium hover:bg-brand-purple/90 disabled:opacity-50"
              >
                {isPending ? '...' : scheduleMode === 'later' ? t('scheduleBtn') : t('sendNow')}
              </button>
            </div>
          </div>

          {/* Right: Preview Panel */}
          <div className="hidden xl:block">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('previewTitle')}</h3>

                {/* Phone frame */}
                <div className="bg-gray-900 rounded-[2rem] p-3 mx-auto max-w-[220px]">
                  <div className="bg-gray-100 rounded-[1.5rem] overflow-hidden min-h-[300px] p-3 flex flex-col justify-start">
                    {/* Notch */}
                    <div className="flex justify-center mb-3">
                      <div className="h-1.5 w-16 bg-gray-800 rounded-full opacity-20" />
                    </div>

                    <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                      {isEmailType ? t('previewEmail') : t('previewPhone')}
                    </p>

                    {isEmailType ? (
                      <EmailPreview subject={subject} bodyEn={bodyEn} bodyEs={bodyEs} />
                    ) : (
                      <PushPreview subject={subject} body={body} imageUrl={imageUrl} />
                    )}
                  </div>
                </div>

                {segment && (
                  <div className="mt-4 p-3 bg-brand-purple-50 rounded-xl">
                    <p className="text-xs text-brand-purple font-medium">
                      {t('estimatedReach', { count: '...' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
