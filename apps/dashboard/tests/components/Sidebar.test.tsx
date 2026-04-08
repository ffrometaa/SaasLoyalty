import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Control pathname per-file — overrides the global setup.ts mock for next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/members',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client (only needed for handleLogout — not triggered in render tests)
vi.mock('@loyalty-os/lib', () => ({
  getSupabaseClient: vi.fn().mockReturnValue({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}));

import { Sidebar } from '@/components/Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    // Provide /api/tenant/me so the component doesn't log MSW warnings
    server.use(
      http.get('/api/tenant/me', () =>
        HttpResponse.json({ email: 'owner@biz.com', businessName: 'My Business', plan: 'pro' })
      )
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('renders LoyaltyOS brand', () => {
    render(<Sidebar />);

    expect(screen.getByText('LoyaltyOS')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
    expect(screen.getByText('Redemptions')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Gamification')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders mobile toggle button', () => {
    render(<Sidebar />);

    const button = screen.getByRole('button', { name: '' });
    expect(button).toBeInTheDocument();
  });

  it('shows mobile overlay when toggle is clicked', () => {
    render(<Sidebar />);

    const button = screen.getByRole('button', { name: '' });
    fireEvent.click(button);

    // Overlay div appears when mobileMenuOpen is true
    const overlay = document.querySelector('.bg-black\\/50');
    expect(overlay).toBeInTheDocument();
  });

  it('marks /members nav link as active when pathname is /members', () => {
    render(<Sidebar />);

    const membersLink = screen.getByRole('link', { name: /members/i });
    expect(membersLink.className).toContain('bg-brand-purple-50');
  });
});
