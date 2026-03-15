'use client';

import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import type { BatchItem } from '@/types';
import { cn } from '@/lib/utils';

const methodEmojis: Record<string, string> = {
  four: '🔥',
  vapeur: '💨',
  poêle: '🍳',
  cru: '🥗',
  mixeur: '🫙',
};

interface BatchChecklistItemProps {
  item: BatchItem;
  onToggle: (id: string) => void;
}

export function BatchChecklistItem({ item, onToggle }: BatchChecklistItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        item.checked ? 'bg-green-50 border-green-200' : 'bg-white'
      )}
    >
      <Checkbox
        id={item.id}
        checked={item.checked}
        onCheckedChange={() => onToggle(item.id)}
        aria-label={item.name}
      />
      <label
        htmlFor={item.id}
        className={cn(
          'flex-1 text-sm cursor-pointer',
          item.checked && 'line-through text-gray-400'
        )}
      >
        {item.name}
      </label>
      <span className="text-xs text-gray-400 shrink-0">
        {methodEmojis[item.cookingMethod]} {item.estimatedMinutes} min
      </span>
    </motion.div>
  );
}
