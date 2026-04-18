import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'title': 'Get started with LoyaltyOS',
      'subtitle': 'Complete these steps to launch your loyalty program',
      'steps.profile_complete': 'Complete your business profile',
      'steps.reward_created': 'Create your first reward',
      'steps.member_invited': 'Invite your first member',
      'steps.reward_shared': 'Share a reward on social media',
      'stepLinks.profile_complete': '/settings',
      'stepLinks.reward_created': '/rewards',
      'stepLinks.member_invited': '/members',
      'stepLinks.reward_shared': '/rewards',
      'dismiss': 'Dismiss',
      'allDone': "You're all set! Your loyalty program is ready.",
      'copyLink': 'Copy share link',
      'copied': 'Copied!',
      // setupWizard keys
      'launchCta': 'Launch setup wizard',
    };
    return map[key] ?? key;
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { OnboardingChecklist } from '@/components/OnboardingChecklist';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function mockFetch(response: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(response),
  });
}

const ALL_STEPS_PENDING = {
  steps: {
    profile_complete: true,
    reward_created: false,
    member_invited: false,
    reward_shared: false,
  },
  allDone: false,
  isDismissed: false,
  planStatus: 'trialing',
  setupWizardCompleted: false,
};

const ALL_STEPS_DONE = {
  steps: {
    profile_complete: true,
    reward_created: true,
    member_invited: true,
    reward_shared: true,
  },
  allDone: true,
  isDismissed: false,
  planStatus: 'trialing',
  setupWizardCompleted: false,
};

const DISMISSED = {
  ...ALL_STEPS_PENDING,
  isDismissed: true,
};

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('OnboardingChecklist', () => {
  it('shows loading skeleton initially', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {}))); // never resolves

    render(<OnboardingChecklist />);

    // Skeleton has animate-pulse class
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).not.toBeNull();
  });

  it('renders nothing when isDismissed=true', async () => {
    vi.stubGlobal('fetch', mockFetch(DISMISSED));

    const { container } = render(<OnboardingChecklist />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders nothing when allDone=true', async () => {
    vi.stubGlobal('fetch', mockFetch(ALL_STEPS_DONE));

    const { container } = render(<OnboardingChecklist />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders step labels when data is loaded', async () => {
    vi.stubGlobal('fetch', mockFetch(ALL_STEPS_PENDING));

    render(<OnboardingChecklist />);

    await waitFor(() => {
      expect(screen.getByText('Create your first reward')).toBeInTheDocument();
      expect(screen.getByText('Invite your first member')).toBeInTheDocument();
    });
  });

  it('completed step shows CheckCircle2 (green check aria-label)', async () => {
    vi.stubGlobal('fetch', mockFetch(ALL_STEPS_PENDING));

    render(<OnboardingChecklist />);

    await waitFor(() => {
      // profile_complete=true → 1 "completed" icon
      const completed = document.querySelectorAll('[aria-label="completed"]');
      const incomplete = document.querySelectorAll('[aria-label="incomplete"]');
      expect(completed).toHaveLength(1);
      expect(incomplete).toHaveLength(3);
    });
  });

  it('dismiss button calls PATCH and hides checklist', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(ALL_STEPS_PENDING) }) // GET
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ ok: true }) });     // PATCH

    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<OnboardingChecklist />);

    await waitFor(() => screen.getByText('Dismiss'));

    await act(async () => {
      fireEvent.click(screen.getByText('Dismiss'));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/onboarding-checklist',
      expect.objectContaining({ method: 'PATCH' })
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('setup wizard CTA is visible when setupWizardCompleted=false', async () => {
    vi.stubGlobal('fetch', mockFetch(ALL_STEPS_PENDING));

    render(<OnboardingChecklist />);

    await waitFor(() => {
      expect(screen.getAllByText('Launch setup wizard').length).toBeGreaterThan(0);
    });
  });

  it('setup wizard CTA is absent when setupWizardCompleted=true', async () => {
    vi.stubGlobal('fetch', mockFetch({ ...ALL_STEPS_PENDING, setupWizardCompleted: true }));

    render(<OnboardingChecklist />);

    await waitFor(() => {
      expect(screen.queryByText('Launch setup wizard')).not.toBeInTheDocument();
    });
  });

  it('copy share link button calls clipboard API and shows "Copied!" feedback', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText: writeTextMock } });

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(ALL_STEPS_PENDING) }) // GET
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ ok: true }) });     // PATCH mark_shared

    vi.stubGlobal('fetch', fetchMock);

    render(<OnboardingChecklist />);

    await waitFor(() => screen.getByText('Copy share link'));

    await act(async () => {
      fireEvent.click(screen.getByText('Copy share link'));
    });

    expect(writeTextMock).toHaveBeenCalledOnce();

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    // After 2 seconds the label reverts
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    await waitFor(() => {
      expect(screen.getByText('Copy share link')).toBeInTheDocument();
    });
  });
});
