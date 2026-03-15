'use client';

import type { NutriGrade } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const segments: { grade: NutriGrade; color: string; label: string }[] = [
  { grade: 'A', color: 'bg-[var(--color-nutri-a)]', label: 'Excellent' },
  { grade: 'B', color: 'bg-[var(--color-nutri-b)]', label: 'Bon' },
  { grade: 'C', color: 'bg-[var(--color-nutri-c)]', label: 'Moyen' },
  { grade: 'D', color: 'bg-[var(--color-nutri-d)]', label: 'Médiocre' },
  { grade: 'E', color: 'bg-[var(--color-nutri-e)]', label: 'Mauvais' },
];

interface NutriScoreBarProps {
  grade: NutriGrade;
}

export function NutriScoreBar({ grade }: NutriScoreBarProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <div className="relative">
      <div className="flex gap-0.5 h-4 rounded-full overflow-hidden" role="img" aria-label={`Nutri-Score ${grade}`}>
        {segments.map((seg) => (
          <button
            key={seg.grade}
            className={cn(
              'flex-1 transition-all relative',
              seg.color,
              seg.grade === grade ? 'scale-y-125 ring-2 ring-white shadow-md z-10' : 'opacity-40'
            )}
            onMouseEnter={() => setTooltip(seg.label)}
            onMouseLeave={() => setTooltip(null)}
            onFocus={() => setTooltip(seg.label)}
            onBlur={() => setTooltip(null)}
            aria-label={`${seg.grade} — ${seg.label}`}
          >
            <span className={cn(
              'absolute inset-0 flex items-center justify-center text-[10px] font-bold',
              seg.grade === grade ? 'text-white' : 'text-transparent'
            )}>
              {seg.grade}
            </span>
          </button>
        ))}
      </div>
      {tooltip && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  );
}
