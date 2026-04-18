import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'title': 'Set up your loyalty program',
      'subtitle': 'Complete these 5 steps to launch your program',
      'steps.businessProfile': 'Business Profile',
      'steps.branding': 'Branding',
      'steps.loyaltyRules': 'Loyalty Rules',
      'steps.firstReward': 'Create a Reward',
      'steps.inviteMember': 'Add a Member',
      'nav.finishLater': 'Finish later',
      'nav.next': 'Next',
      'nav.skip': 'Skip for now',
      'nav.finish': 'Finish setup',
    };
    return map[key] ?? key;
  },
}));

vi.mock('lucide-react', () => ({
  CheckCircle2: ({ 'aria-label': ariaLabel }: { 'aria-label'?: string }) => (
    <span aria-label={ariaLabel}>✓</span>
  ),
}));

// Mock all step components
vi.mock('@/app/(dashboard)/setup/steps/BusinessProfileStep', () => ({
  BusinessProfileStep: ({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="step-businessProfile">
      <button onClick={onComplete}>complete-step</button>
      <button onClick={onSkip}>skip-step</button>
    </div>
  ),
}));

vi.mock('@/app/(dashboard)/setup/steps/BrandingStep', () => ({
  BrandingStep: ({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="step-branding">
      <button onClick={onComplete}>complete-step</button>
      <button onClick={onSkip}>skip-step</button>
    </div>
  ),
}));

vi.mock('@/app/(dashboard)/setup/steps/LoyaltyRulesStep', () => ({
  LoyaltyRulesStep: ({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="step-loyaltyRules">
      <button onClick={onComplete}>complete-step</button>
      <button onClick={onSkip}>skip-step</button>
    </div>
  ),
}));

vi.mock('@/app/(dashboard)/setup/steps/FirstRewardStep', () => ({
  FirstRewardStep: ({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="step-firstReward">
      <button onClick={onComplete}>complete-step</button>
      <button onClick={onSkip}>skip-step</button>
    </div>
  ),
}));

vi.mock('@/app/(dashboard)/setup/steps/InviteMemberStep', () => ({
  InviteMemberStep: ({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="step-inviteMember">
      <button onClick={onComplete}>complete-step</button>
      <button onClick={onSkip}>skip-step</button>
    </div>
  ),
}));

import { SetupWizardClient } from '@/app/(dashboard)/setup/SetupWizardClient';

const DEFAULT_PREFILL = {
  businessName: 'Test Biz',
  primaryColor: '#7c3aed',
  pointsPerDollar: 1,
  welcomeBonusPoints: 100,
  plan: 'starter',
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SetupWizardClient', () => {
  it('renders step 1 (businessProfile) by default', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ ok: true }) }));

    render(<SetupWizardClient prefill={DEFAULT_PREFILL} />);

    expect(screen.getByTestId('step-businessProfile')).toBeInTheDocument();
  });

  it('renders step indicator with 5 steps', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ ok: true }) }));

    render(<SetupWizardClient prefill={DEFAULT_PREFILL} />);

    // Each step shows its number (1–5) or a check icon
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('"Finish later" calls PATCH dismiss and redirects', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const locationMock = { href: '' };
    vi.stubGlobal('window', { location: locationMock });

    render(<SetupWizardClient prefill={DEFAULT_PREFILL} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Finish later'));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/setup-wizard',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ action: 'dismiss' }),
      })
    );

    await waitFor(() => {
      expect(locationMock.href).toBe('/');
    });
  });

  it('after step 1 onComplete, advances to step 2', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ ok: true }) }));

    render(<SetupWizardClient prefill={DEFAULT_PREFILL} />);

    expect(screen.getByTestId('step-businessProfile')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('complete-step'));
    });

    expect(screen.getByTestId('step-branding')).toBeInTheDocument();
  });
});
