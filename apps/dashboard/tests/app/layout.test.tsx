import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Stub both banner components — we just want to confirm they're rendered in the layout
vi.mock('@/components/SuperAdminBanner', () => ({
  SuperAdminBanner: () => <div data-testid="super-admin-banner" />,
}));

vi.mock('@/components/PlanTrialBanner', () => ({
  PlanTrialBanner: () => <div data-testid="plan-trial-banner" />,
}));

// Stub Sidebar to avoid pulling in nav/auth dependencies
vi.mock('@/components/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar" />,
}));

import DashboardLayout from '@/app/(dashboard)/layout';

describe('DashboardLayout', () => {
  it('renders children inside the layout', () => {
    render(
      <DashboardLayout>
        <span data-testid="child-content">Hello</span>
      </DashboardLayout>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders the SuperAdminBanner stub', () => {
    render(
      <DashboardLayout>
        <span />
      </DashboardLayout>
    );

    expect(screen.getByTestId('super-admin-banner')).toBeInTheDocument();
  });

  it('renders the PlanTrialBanner stub', () => {
    render(
      <DashboardLayout>
        <span />
      </DashboardLayout>
    );

    expect(screen.getByTestId('plan-trial-banner')).toBeInTheDocument();
  });
});
