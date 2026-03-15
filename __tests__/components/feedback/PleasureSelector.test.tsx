import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PleasureSelector } from '@/components/feedback/PleasureSelector';

// ─── Mock framer-motion to avoid animation issues in jsdom ───────────────────

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...props }: React.ComponentProps<'button'>) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PleasureSelector', () => {
  it('renders 5 emoji buttons', () => {
    render(<PleasureSelector value={null} onChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('each button has the correct aria-label', () => {
    render(<PleasureSelector value={null} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Très mauvais' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mauvais' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Neutre' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bon' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Excellent' })).toBeTruthy();
  });

  it('calls onChange with 1 when "Très mauvais" is clicked', () => {
    const onChange = vi.fn();
    render(<PleasureSelector value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Très mauvais' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with 2 when "Mauvais" is clicked', () => {
    const onChange = vi.fn();
    render(<PleasureSelector value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mauvais' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onChange with 3 when "Neutre" is clicked', () => {
    const onChange = vi.fn();
    render(<PleasureSelector value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Neutre' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('calls onChange with 4 when "Bon" is clicked', () => {
    const onChange = vi.fn();
    render(<PleasureSelector value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bon' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('calls onChange with 5 when "Excellent" is clicked', () => {
    const onChange = vi.fn();
    render(<PleasureSelector value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Excellent' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('calls onChange exactly once per click', () => {
    const onChange = vi.fn();
    render(<PleasureSelector value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bon' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
