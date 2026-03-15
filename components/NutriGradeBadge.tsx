'use client';

import { useEffect, useState } from 'react';
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

const gradeTooltips: Record<NutriGrade, string> = {
  A: 'Excellent ! Ce repas est très équilibré.',
  B: 'Bon score — un repas de qualité.',
  C: 'Score correct — peut être amélioré.',
  D: 'Score limité — essayez de varier les ingrédients.',
  E: 'Score faible — ce repas pourrait être plus équilibré.',
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

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('nutriscore-tooltip-seen')) {
      setShowTooltip(true);
      localStorage.setItem('nutriscore-tooltip-seen', 'true');
      const timer = setTimeout(() => setShowTooltip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-0.5">
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-md font-bold leading-none cursor-pointer',
          gradeColors[grade],
          gradeTextColors[grade],
          sizeClasses[size]
        )}
        role="img"
        aria-label={`Score nutritionnel : ${grade}`}
        onClick={() => setShowTooltip((prev) => !prev)}
      >
        {grade}
      </span>
      {showLabel && (
        <span className="text-[10px] text-gray-400">Score nutritionnel calculé</span>
      )}
      {showTooltip && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-10 w-48 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg text-center pointer-events-none">
          {gradeTooltips[grade]}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  );
}
