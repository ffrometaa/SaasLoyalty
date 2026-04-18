import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'heading': 'Tell us about your business',
      'nameLabel': 'Business name',
      'phoneLabel': 'Phone number',
      'addressLabel': 'Address',
      'nameRequired': 'Business name is required',
      'nav.next': 'Next',
      'nav.skip': 'Skip for now',
    };
    return map[key] ?? key;
  },
}));

import { BusinessProfileStep } from '@/app/(dashboard)/setup/steps/BusinessProfileStep';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BusinessProfileStep', () => {
  it('renders with prefill businessName', () => {
    vi.stubGlobal('fetch', vi.fn());

    render(
      <BusinessProfileStep
        prefill={{ businessName: 'My Shop' }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('My Shop')).toBeInTheDocument();
  });

  it('shows inline error when business name is empty on submit', async () => {
    vi.stubGlobal('fetch', vi.fn());

    render(
      <BusinessProfileStep
        prefill={{ businessName: '' }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Next'));
    });

    expect(screen.getByText('Business name is required')).toBeInTheDocument();
  });

  it('calls POST /api/settings on submit with valid data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(
      <BusinessProfileStep
        prefill={{ businessName: 'My Shop' }}
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
  });

  it('calls onComplete after successful submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const onComplete = vi.fn();

    render(
      <BusinessProfileStep
        prefill={{ businessName: 'My Shop' }}
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
