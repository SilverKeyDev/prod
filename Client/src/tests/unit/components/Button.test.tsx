import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Button from '@/components/ui/button/Button';

// Mock the KeyTurnLoader component
vi.mock('@/components/ui/loading/KeyTurnLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="loader">{message}</div>,
}));

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-brand-accent', 'text-white');
  });

  it('should render different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-brand-tertiary');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-brand-accent', 'text-brand-accent');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-brand-accent');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('should render different sizes', () => {
    const { rerender } = render(<Button size="xs">Extra Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-responsive-sm');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-responsive-sm');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-responsive-md');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-responsive-lg');

    rerender(<Button size="xl">Extra Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-responsive-lg');
  });

  it('should render with different rounded styles', () => {
    const { rerender } = render(<Button rounded="none">No Round</Button>);
    expect(screen.getByRole('button')).toHaveClass('rounded-none');

    rerender(<Button rounded="sm">Small Round</Button>);
    expect(screen.getByRole('button')).toHaveClass('rounded-sm');

    rerender(<Button rounded="full">Full Round</Button>);
    expect(screen.getByRole('button')).toHaveClass('rounded-full');
  });

  it('should render with full width', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('should render with loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should render with icon on left', () => {
    const icon = <span data-testid="icon">📧</span>;
    render(<Button icon={icon} iconPosition="left">With Icon</Button>);
    
    const button = screen.getByRole('button');
    const iconElement = screen.getByTestId('icon');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement.parentElement).toHaveClass('mr-1', 'sm:mr-2');
  });

  it('should render with icon on right', () => {
    const icon = <span data-testid="icon">📧</span>;
    render(<Button icon={icon} iconPosition="right">With Icon</Button>);
    
    const button = screen.getByRole('button');
    const iconElement = screen.getByTestId('icon');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement.parentElement).toHaveClass('ml-1', 'sm:ml-2');
  });

  it('should render icon only button', () => {
    const icon = <span data-testid="icon">📧</span>;
    render(<Button icon={icon} />);
    
    const button = screen.getByRole('button');
    const iconElement = screen.getByTestId('icon');
    expect(iconElement).toBeInTheDocument();
    expect(button).not.toHaveTextContent();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it('should pass through other props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom button">Button</Button>);
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom button')).toBeInTheDocument();
  });

  it('should apply responsive icon sizing', () => {
    const icon = <span className="original-class">📧</span>;
    render(<Button icon={icon} size="lg">With Icon</Button>);
    
    const iconElement = screen.getByText('📧');
    expect(iconElement).toHaveClass('original-class', 'w-4', 'h-4', 'sm:w-5', 'sm:h-5', 'flex-shrink-0');
  });
});

