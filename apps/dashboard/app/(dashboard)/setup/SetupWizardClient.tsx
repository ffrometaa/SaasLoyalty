'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { BusinessProfileStep } from './steps/BusinessProfileStep';
import { BrandingStep } from './steps/BrandingStep';
import { LoyaltyRulesStep } from './steps/LoyaltyRulesStep';
import { FirstRewardStep } from './steps/FirstRewardStep';
import { InviteMemberStep } from './steps/InviteMemberStep';

export interface SetupWizardClientProps {
  prefill: {
    businessName: string;
    primaryColor: string;
    pointsPerDollar: number;
    welcomeBonusPoints: number;
    plan: string;
  };
}

const STEP_KEYS = [
  'businessProfile',
  'branding',
  'loyaltyRules',
  'firstReward',
  'inviteMember',
] as const;

type StepKey = typeof STEP_KEYS[number];

export function SetupWizardClient({ prefill }: SetupWizardClientProps) {
  const t = useTranslations('setupWizard');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleFinishLater() {
    setLoading(true);
    await fetch('/api/setup-wizard', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss' }),
    });
    window.location.href = '/';
  }

  async function handleComplete() {
    setLoading(true);
    await fetch('/api/setup-wizard', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
    window.location.href = '/';
  }

  function handleStepComplete() {
    if (currentStepIndex < STEP_KEYS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }

  function handleStepSkip() {
    if (currentStepIndex < STEP_KEYS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }

  const currentStep: StepKey = STEP_KEYS[currentStepIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEP_KEYS.map((key, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <div key={key} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-purple-700 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" aria-label="step completed" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`text-xs hidden sm:block ${
                  isActive ? 'text-purple-700 font-medium' : 'text-gray-400'
                }`}
              >
                {t(`steps.${key}`)}
              </span>
              {index < STEP_KEYS.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress label */}
      <p className="text-xs text-gray-400 mb-6">
        {currentStepIndex + 1} / {STEP_KEYS.length}
      </p>

      {/* Active step */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        {currentStep === 'businessProfile' && (
          <BusinessProfileStep
            prefill={{ businessName: prefill.businessName }}
            onComplete={handleStepComplete}
            onSkip={handleStepSkip}
          />
        )}
        {currentStep === 'branding' && (
          <BrandingStep
            prefill={{ primaryColor: prefill.primaryColor, plan: prefill.plan }}
            onComplete={handleStepComplete}
            onSkip={handleStepSkip}
          />
        )}
        {currentStep === 'loyaltyRules' && (
          <LoyaltyRulesStep
            prefill={{
              pointsPerDollar: prefill.pointsPerDollar,
              welcomeBonusPoints: prefill.welcomeBonusPoints,
            }}
            onComplete={handleStepComplete}
            onSkip={handleStepSkip}
          />
        )}
        {currentStep === 'firstReward' && (
          <FirstRewardStep
            onComplete={handleStepComplete}
            onSkip={handleStepSkip}
          />
        )}
        {currentStep === 'inviteMember' && (
          <InviteMemberStep
            onComplete={handleComplete}
            onSkip={handleComplete}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleFinishLater}
          disabled={loading}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          {t('nav.finishLater')}
        </button>
      </div>
    </div>
  );
}
