'use client';

import { useState } from 'react';
import { Share2, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import type { WeekPlan } from '@/types';
import { generateWeekImage } from '@/lib/canvas/weekImageGenerator';

export interface ShareWeekButtonProps {
  weekPlan: WeekPlan;
  streak: number;
  userName: string;
}

type Status = 'idle' | 'generating' | 'done' | 'error';

export function ShareWeekButton({ weekPlan, streak, userName }: ShareWeekButtonProps) {
  const t = useTranslations('share');
  const [status, setStatus] = useState<Status>('idle');

  async function handleShare() {
    if (status === 'generating') return;
    setStatus('generating');

    try {
      const blob = await generateWeekImage(weekPlan, { streak, userName });
      const filename = `assembleat-semaine-${weekPlan.weekKey}.png`;

      if (
        typeof navigator !== 'undefined' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (navigator as any).share === 'function' &&
        // Safari on iOS requires canShare to exist before calling share
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (typeof (navigator as any).canShare !== 'function' ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigator as any).canShare({ files: [new File([blob], filename, { type: 'image/png' })] }))
      ) {
        const file = new File([blob], filename, { type: 'image/png' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (navigator as any).share({
          title: 'Ma semaine AssemblEat',
          text: 'Découvrez mon plan repas de la semaine !',
          files: [file],
        });
      } else {
        // Desktop / unsupported browser: trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setStatus('done');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      console.error('[ShareWeekButton]', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2500);
    }
  }

  const isGenerating = status === 'generating';

  const label =
    status === 'generating'
      ? t('generating')
      : status === 'done'
        ? t('downloaded')
        : status === 'error'
          ? t('error')
          : t('weekButton');

  const icon =
    status === 'generating' ? (
      <Loader2 size={16} className="animate-spin" />
    ) : status === 'done' ? (
      <Download size={16} />
    ) : (
      <Share2 size={16} />
    );

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={isGenerating}
        className="flex items-center gap-2 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
        aria-label={label}
      >
        {icon}
        <span>{label}</span>
      </Button>
    </motion.div>
  );
}
