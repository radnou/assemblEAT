'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PLEASURE_EMOJIS: { value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { value: 1, emoji: '😫', label: 'Très mauvais' },
  { value: 2, emoji: '😕', label: 'Mauvais' },
  { value: 3, emoji: '😐', label: 'Neutre' },
  { value: 4, emoji: '😊', label: 'Bon' },
  { value: 5, emoji: '🤩', label: 'Excellent' },
];

interface PleasureSelectorProps {
  value: number | null;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
}

export function PleasureSelector({ value, onChange }: PleasureSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {PLEASURE_EMOJIS.map(({ value: v, emoji, label }) => (
        <motion.button
          key={v}
          type="button"
          aria-label={label}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(v)}
          className={cn(
            'flex-1 text-2xl py-2 rounded-xl transition-all duration-150 select-none',
            value === v
              ? 'scale-125 ring-2 ring-offset-1 ring-primary bg-primary/10'
              : 'opacity-60 hover:opacity-90 hover:bg-gray-100'
          )}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
