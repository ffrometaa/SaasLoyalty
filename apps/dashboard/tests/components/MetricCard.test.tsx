import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricCard } from '@/components/MetricCard';

describe('MetricCard', () => {
  it('renders metric value and label', () => {
    render(<MetricCard label="Total Members" value={150} />);
    
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Total Members')).toBeInTheDocument();
  });

  it('renders with change indicator when provided', () => {
    render(<MetricCard label="Active Members" value={100} change={12} />);
    
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders negative change correctly', () => {
    render(<MetricCard label="Points" value={500} change={-5} />);
    
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <MetricCard 
        label="Visits" 
        value={250} 
        description="This month" 
      />
    );
    
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<MetricCard label="Revenue" value={1000} icon={<span data-testid="icon">$</span>} />);
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<MetricCard label="Loading" value={0} loading />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
