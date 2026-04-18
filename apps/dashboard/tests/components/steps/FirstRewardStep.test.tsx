import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'heading': 'Create your first reward',
      'nameLabel': 'Reward name',
      'descriptionLabel': 'Description',
      'pointsLabel': 'Points required',
      'nameRequired': 'Reward name is required',
      'pointsRequired': 'Points required must be a positive number',
      'nav.next': 'Next',
      'nav.skip': 'Skip for now',
    };
    return map[key] ?? key;
  },
}));

import { FirstRewardStep } from '@/app/(dashboard)/setup/steps/FirstRewardStep';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FirstRewardStep', () => {
  it('skip calls onSkip without fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const onSkip = vi.fn();

    render(<FirstRewardStep onComplete={vi.fn()} onSkip={onSkip} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Skip for now'));
    });

    expect(onSkip).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows error when name is empty on submit', async () => {
    vi.stubGlobal('fetch', vi.fn());

    render(<FirstRewardStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });

    expect(screen.getByText('Reward name is required')).toBeInTheDocument();
  });

  it('calls POST /api/rewards on valid submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ id: 'r-1' }) });
    vi.stubGlobal('fetch', fetchMock);

    render(<FirstRewardStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Reward name/), { target: { value: 'Free Coffee' } });
    fireEvent.change(screen.getByLabelText(/Points required/), { target: { value: '500' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/rewards',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('calls onComplete after successful submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ id: 'r-1' }) });
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(<FirstRewardStep onComplete={onComplete} onSkip={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Reward name/), { target: { value: 'Free Coffee' } });
    fireEvent.change(screen.getByLabelText(/Points required/), { target: { value: '500' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });
});
