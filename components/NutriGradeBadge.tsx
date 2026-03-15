'use client';

import type { NutriGrade } from '@/types';
import { cn } from '@/lib/utils';

const gradeColors: Record<NutriGrade, string> = {
  A: 'bg-[var(--color-nutri-a)]',
  B: 'bg-[var(--color-nutri-b)]',
  C: 'bg-[var(--color-nutri-c)]',
  D: 'bg-[var(--color-nutri-d)]',
  E: 'bg-[var(--color-nutri-e)]',
};

const gradeTextColors: Record<NutriGrade, string> = {
  A: 'text-white',
  B: 'text-white',
  C: 'text-gray-900',
  D: 'text-white',
  E: 'text-white',
};

interface NutriGradeBadgeProps {
  grade: NutriGrade;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function NutriGradeBadge({ grade, size = 'md', showLabel = true }: NutriGradeBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-md font-bold leading-none',
          gradeColors[grade],
          gradeTextColors[grade],
          sizeClasses[size]
        )}
        role="img"
        aria-label={`Score nutritionnel : ${grade}`}
      >
        {grade}
      </span>
      {showLabel && (
        <span className="text-[10px] text-gray-400">Score nutritionnel calculé</span>
      )}
    </div>
  );
}
