import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/Sidebar';

// Mock usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/members',
}));

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
    expect(screen.getByText('Redemptions')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders user info section', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Starter Plan')).toBeInTheDocument();
  });

  it('has correct links for navigation', () => {
    render(<Sidebar />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('shows mobile menu toggle button', () => {
    render(<Sidebar />);
    
    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });

  it('opens mobile menu when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    
    const menuButton = screen.getByRole('button');
    await user.click(menuButton);
    
    // Menu should be open now (sidebar gets translate-x-0 class)
    const sidebar = document.querySelector('aside');
    expect(sidebar?.className).toContain('translate-x-0');
  });

  it('highlights active navigation item', () => {
    render(<Sidebar />);
    
    const activeItem = screen.getByRole('link', { name: /members/i });
    expect(activeItem.className).toContain('bg-brand-purple-50');
  });
});
