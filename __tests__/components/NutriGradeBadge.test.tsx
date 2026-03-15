import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NutriGradeBadge } from '@/components/NutriGradeBadge';

// ─── localStorage mock ───────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NutriGradeBadge', () => {
  it('renders grade letter A', () => {
    render(<NutriGradeBadge grade="A" />);
    expect(screen.getByRole('img')).toHaveTextContent('A');
  });

  it('renders grade letter B', () => {
    render(<NutriGradeBadge grade="B" />);
    expect(screen.getByRole('img')).toHaveTextContent('B');
  });

  it('renders grade letter C', () => {
    render(<NutriGradeBadge grade="C" />);
    expect(screen.getByRole('img')).toHaveTextContent('C');
  });

  it('renders grade letter D', () => {
    render(<NutriGradeBadge grade="D" />);
    expect(screen.getByRole('img')).toHaveTextContent('D');
  });

  it('renders grade letter E', () => {
    render(<NutriGradeBadge grade="E" />);
    expect(screen.getByRole('img')).toHaveTextContent('E');
  });

  it('has correct aria-label for grade A', () => {
    render(<NutriGradeBadge grade="A" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Score nutritionnel : A');
  });

  it('has correct aria-label for grade E', () => {
    render(<NutriGradeBadge grade="E" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Score nutritionnel : E');
  });

  it('shows "Score nutritionnel calculé" label when showLabel is true', () => {
    render(<NutriGradeBadge grade="B" showLabel={true} />);
    expect(screen.getByText('Score nutritionnel calculé')).toBeTruthy();
  });

  it('hides label when showLabel is false', () => {
    render(<NutriGradeBadge grade="B" showLabel={false} />);
    expect(screen.queryByText('Score nutritionnel calculé')).toBeNull();
  });

  it('shows label by default (showLabel defaults to true)', () => {
    render(<NutriGradeBadge grade="C" />);
    expect(screen.getByText('Score nutritionnel calculé')).toBeTruthy();
  });
});
