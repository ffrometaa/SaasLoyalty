import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('next-intl', () => ({
  useTranslations: (ns?: string) => (key: string, params?: Record<string, unknown>) => {
    // Return key with param substitution for testability
    if (params) {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, String(v)),
        key,
      );
    }
    return key;
  },
}));

// Mock getSupabaseClient
const mockVerifyOtp = vi.fn();

vi.mock('@loyalty-os/lib', () => ({
  getSupabaseClient: () => ({
    auth: { verifyOtp: mockVerifyOtp },
  }),
}));

import RegistrationCompletePage from '@/app/(auth)/registration-complete/page';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function setEmail(email: string | null) {
  if (email) {
    mockSearchParams.set('email', email);
  } else {
    mockSearchParams.delete('email');
  }
}

function mockFetchSuccess(body: unknown = { sent: true, method: 'magiclink' }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: vi.fn().mockResolvedValue(body),
    }),
  );
}

function mockFetchRateLimited(retryAfterSeconds = 300) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': String(retryAfterSeconds) }),
      json: vi.fn().mockResolvedValue({ error: 'Too many requests' }),
    }),
  );
}

function mockFetchError(status = 500) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      headers: new Headers(),
      json: vi.fn().mockResolvedValue({ error: 'Server error' }),
    }),
  );
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams.delete('email');
  mockVerifyOtp.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('RegistrationCompletePage', () => {
  it('renders email hint when email param is present', () => {
    setEmail('user@example.com');
    render(<RegistrationCompletePage />);
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('renders resend button when email param is present', () => {
    setEmail('user@example.com');
    render(<RegistrationCompletePage />);
    const resendBtn = screen.getByRole('button', { name: /resend/i });
    expect(resendBtn).toBeInTheDocument();
    expect(resendBtn).not.toBeDisabled();
  });

  it('does not render resend button when no email param', () => {
    setEmail(null);
    render(<RegistrationCompletePage />);
    // Should not find a clickable resend button
    expect(screen.queryByRole('button', { name: /resend/i })).not.toBeInTheDocument();
  });

  it('shows loading state while resend is in progress', async () => {
    setEmail('user@example.com');
    // Fetch never resolves during this test — we observe the loading state
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));

    render(<RegistrationCompletePage />);
    const resendBtn = screen.getByRole('button', { name: /resend/i });

    await userEvent.click(resendBtn);

    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
  });

  it('shows sent confirmation after successful resend', async () => {
    setEmail('user@example.com');
    mockFetchSuccess();

    render(<RegistrationCompletePage />);
    const resendBtn = screen.getByRole('button', { name: /resend/i });

    await userEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText(/sent/i)).toBeInTheDocument();
    });
  });

  it('shows rate-limited message on 429 response', async () => {
    setEmail('user@example.com');
    mockFetchRateLimited(300);

    render(<RegistrationCompletePage />);
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() => {
      // The message contains the key "rateLimited" with minutes substituted
      expect(screen.getByText(/rateLimited|minutes/i)).toBeInTheDocument();
    });
  });

  it('shows error message on 500 response', async () => {
    setEmail('user@example.com');
    mockFetchError(500);

    render(<RegistrationCompletePage />);
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('shows "Enter verification code" link after sent state', async () => {
    setEmail('user@example.com');
    mockFetchSuccess();

    render(<RegistrationCompletePage />);
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /useCode|verification code/i })).toBeInTheDocument();
    });
  });

  it('reveals OTP input after clicking "Enter verification code"', async () => {
    setEmail('user@example.com');
    mockFetchSuccess();

    render(<RegistrationCompletePage />);
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() => screen.getByRole('button', { name: /useCode|verification code/i }));
    await userEvent.click(screen.getByRole('button', { name: /useCode|verification code/i }));

    expect(screen.getByRole('textbox', { name: /otpLabel|verification code/i })).toBeInTheDocument();
  });

  it('OTP input rejects non-numeric characters', async () => {
    setEmail('user@example.com');
    mockFetchSuccess();

    render(<RegistrationCompletePage />);
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));
    await waitFor(() => screen.getByRole('button', { name: /useCode|verification code/i }));
    await userEvent.click(screen.getByRole('button', { name: /useCode|verification code/i }));

    const otpInput = screen.getByRole('textbox', { name: /otpLabel|verification code/i });
    fireEvent.change(otpInput, { target: { value: 'abc123def' } });

    expect((otpInput as HTMLInputElement).value).toBe('123');
  });

  it('verify button stays disabled when OTP has fewer than 6 digits', async () => {
    setEmail('user@example.com');
    mockFetchSuccess();

    render(<RegistrationCompletePage />);
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));
    await waitFor(() => screen.getByRole('button', { name: /useCode|verification code/i }));
    await userEvent.click(screen.getByRole('button', { name: /useCode|verification code/i }));

    const otpInput = screen.getByRole('textbox', { name: /otpLabel|verification code/i });
    fireEvent.change(otpInput, { target: { value: '123' } });

    const verifyBtn = screen.getByRole('button', { name: /verify/i });
    expect(verifyBtn).toBeDisabled();
  });

  it('verify button becomes enabled when OTP has exactly 6 digits', async () => {
    setEmail('user@example.com');
    mockFetchSuccess();

    render(<RegistrationCompletePage />);
    await userEvent.click(screen.getByRole('button', { name: /resend/i }));
    await waitFor(() => screen.getByRole('button', { name: /useCode|verification code/i }));
    await userEvent.click(screen.getByRole('button', { name: /useCode|verification code/i }));

    const otpInput = screen.getByRole('textbox', { name: /otpLabel|verification code/i });
    fireEvent.change(otpInput, { target: { value: '123456' } });

    const verifyBtn = screen.getByRole('button', { name: /^verify/i });
    expect(verifyBtn).not.toBeDisabled();
  });

  it('renders go to sign in link', () => {
    render(<RegistrationCompletePage />);
    expect(screen.getByRole('link', { name: /goToSignIn|sign in/i })).toBeInTheDocument();
  });
});
