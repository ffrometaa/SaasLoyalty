import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'heading': 'Add your first member',
      'nameLabel': 'Full name',
      'emailLabel': 'Email',
      'phoneLabel': 'Phone',
      'nameRequired': 'Name is required',
      'nav.finish': 'Finish setup',
      'nav.skip': 'Skip for now',
    };
    return map[key] ?? key;
  },
}));

import { InviteMemberStep } from '@/app/(dashboard)/setup/steps/InviteMemberStep';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InviteMemberStep', () => {
  it('skip calls onComplete without fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(<InviteMemberStep onComplete={onComplete} onSkip={onComplete} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Skip for now'));
    });

    expect(onComplete).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls POST /api/members then onComplete on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'm-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(<InviteMemberStep onComplete={onComplete} onSkip={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Finish setup'));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/members',
      expect.objectContaining({ method: 'POST' })
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  it('shows error and does NOT call onComplete when member creation fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Invalid email address' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(<InviteMemberStep onComplete={onComplete} onSkip={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Finish setup'));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
