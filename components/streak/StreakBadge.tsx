'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StreakBadgeProps {
  count: number;
  size?: 'sm' | 'md';
}

function getMilestoneBadge(count: number): string | null {
  if (count >= 365) return '🏆';
  if (count >= 90) return '🌳';
  if (count >= 30) return '🌿';
  if (count >= 7) return '🌱';
  return null;
}

export function StreakBadge({ count, size = 'md' }: StreakBadgeProps) {
  const prevCountRef = useRef(count);
  const isNewMilestone = useRef(false);

  const milestones = [7, 30, 90, 365];
  const prevMilestone = milestones.find((m) => prevCountRef.current < m && count >= m);
  isNewMilestone.current = prevMilestone !== undefined;

  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  const badge = getMilestoneBadge(count);

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const emojiSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <motion.div
      className={`inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 ${padding}`}
      animate={isNewMilestone.current ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <span className={emojiSize}>🔥</span>
      <span className={`font-semibold text-orange-700 ${textSize}`}>{count}</span>
      {badge && <span className={emojiSize}>{badge}</span>}
    </motion.div>
  );
}
