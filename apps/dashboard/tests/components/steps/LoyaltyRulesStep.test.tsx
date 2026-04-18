import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'heading': 'Set your loyalty rules',
      'pointsPerDollarLabel': 'Points per dollar spent',
      'welcomeBonusLabel': 'Welcome bonus points',
      'invalidNumber': 'Must be a positive number',
      'nav.next': 'Next',
      'nav.skip': 'Skip for now',
    };
    return map[key] ?? key;
  },
}));

import { LoyaltyRulesStep } from '@/app/(dashboard)/setup/steps/LoyaltyRulesStep';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LoyaltyRulesStep', () => {
  it('renders with default prefill values', () => {
    render(
      <LoyaltyRulesStep
        prefill={{ pointsPerDollar: 1, welcomeBonusPoints: 100 }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('shows validation error for negative pointsPerDollar', async () => {
    vi.stubGlobal('fetch', vi.fn());

    render(
      <LoyaltyRulesStep
        prefill={{ pointsPerDollar: 1, welcomeBonusPoints: 100 }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    const ppdInput = screen.getByDisplayValue('1');
    fireEvent.change(ppdInput, { target: { value: '-5' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });

    expect(screen.getByText('Must be a positive number')).toBeInTheDocument();
  });

  it('calls POST /api/settings on valid submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <LoyaltyRulesStep
        prefill={{ pointsPerDollar: 2, welcomeBonusPoints: 50 }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/settings',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('calls onComplete after successful submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(
      <LoyaltyRulesStep
        prefill={{ pointsPerDollar: 2, welcomeBonusPoints: 50 }}
        onComplete={onComplete}
        onSkip={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });
});
