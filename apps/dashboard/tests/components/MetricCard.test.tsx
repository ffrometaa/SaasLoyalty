import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Total Members" value={150} icon={Users} />);

    expect(screen.getByText('Total Members')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('renders string values', () => {
    render(<MetricCard title="Revenue" value="$4,500" icon={Users} />);

    expect(screen.getByText('$4,500')).toBeInTheDocument();
  });

  it('renders positive change with + prefix', () => {
    render(<MetricCard title="Active" value={100} change={12} icon={Users} />);

    expect(screen.getByText(/\+12%/)).toBeInTheDocument();
  });

  it('renders negative change without + prefix', () => {
    render(<MetricCard title="Points" value={500} change={-5} icon={Users} />);

    const changeEl = screen.getByText(/-5%/);
    expect(changeEl).toBeInTheDocument();
    expect(changeEl.textContent).not.toMatch(/^\+/);
  });

  it('does not render change line when change is undefined', () => {
    render(<MetricCard title="Revenue" value={1000} icon={Users} />);

    // The change line includes "fromLastMonth" text — should not appear
    expect(screen.queryByText(/from last month/i)).not.toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<MetricCard title="Visits" value={250} icon={Users} description="This month" />);

    expect(screen.getByText('This month')).toBeInTheDocument();
  });
});
