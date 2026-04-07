'use client';

import { useTranslations } from 'next-intl';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ConsentCheckbox({ checked, onChange }: ConsentCheckboxProps) {
  const t = useTranslations('consent');

  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={[
            'w-4 h-4 rounded border transition-all',
            checked
              ? 'border-[#7c3aed] bg-[#7c3aed]'
              : 'border-white/20 bg-white/5',
          ].join(' ')}
          style={checked ? { boxShadow: '0 0 0 2px rgba(124,58,237,0.25)' } : undefined}
        >
          {checked && (
            <svg className="w-3 h-3 text-white m-auto mt-0.5" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-xs text-white/60 leading-relaxed">
        {t('agree_prefix')}{' '}
        <a
          href="/legal/member-terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#a78bfa] hover:underline"
        >
          {t('terms_link')}
        </a>
        {' '}{t('and')}{' '}
        <a
          href="/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#a78bfa] hover:underline"
        >
          {t('privacy_link')}
        </a>
      </span>
    </label>
  );
}
