import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'heading': 'Make it yours',
      'primaryColorLabel': 'Primary color',
      'accentColorLabel': 'Accent color',
      'upsell': 'Branding customization is available on the Pro plan.',
      'upgrade': 'Upgrade to Pro',
      'nav.next': 'Next',
      'nav.skip': 'Skip for now',
    };
    return map[key] ?? key;
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { BrandingStep } from '@/app/(dashboard)/setup/steps/BrandingStep';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BrandingStep', () => {
  it('shows upsell banner when plan is starter', () => {
    render(
      <BrandingStep
        prefill={{ primaryColor: '#7c3aed', plan: 'starter' }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.getByText('Branding customization is available on the Pro plan.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Primary color')).not.toBeInTheDocument();
  });

  it('shows color form when plan is pro', () => {
    render(
      <BrandingStep
        prefill={{ primaryColor: '#7c3aed', plan: 'pro' }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.queryByText('Branding customization is available on the Pro plan.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Primary color')).toBeInTheDocument();
  });

  it('skip calls onSkip without fetch on starter plan', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const onSkip = vi.fn();

    render(
      <BrandingStep
        prefill={{ primaryColor: '#7c3aed', plan: 'starter' }}
        onComplete={vi.fn()}
        onSkip={onSkip}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Skip for now'));
    });

    expect(onSkip).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submit calls POST /api/settings on pro plan', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(
      <BrandingStep
        prefill={{ primaryColor: '#7c3aed', plan: 'pro' }}
        onComplete={onComplete}
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

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });
});
