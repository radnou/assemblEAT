'use client';

import { useState } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMealStore } from '@/lib/store/useMealStore';
import { encodeShareData, buildShareUrl } from '@/lib/share/shareEngine';
import { computeWeeklyScore } from '@/lib/engine/weeklyScore';
import { useWeekNavigation } from '@/lib/hooks/useWeekNavigation';
import { toast } from 'sonner';

interface ShareLinkButtonProps {
  /** Optional size override */
  size?: 'sm' | 'default';
  className?: string;
}

export function ShareLinkButton({ size = 'sm', className }: ShareLinkButtonProps) {
  const { weekKey } = useWeekNavigation();
  const { getWeekPlan, settings, feedbacks, actualMeals } = useMealStore();
  const [copied, setCopied] = useState(false);

  const weekPlan = getWeekPlan(weekKey);

  async function handleShare() {
    // Collect dates in this week from the day plans
    const weekDates = new Set(
      weekPlan.days.map(d => d.date).filter(Boolean)
    );
    const weekFeedbacks = feedbacks.filter(f => weekDates.has(f.date));
    const weekActuals = actualMeals.filter(m => weekDates.has(m.date));

    const weeklyScore = computeWeeklyScore(weekPlan, weekFeedbacks);

    const encoded = encodeShareData({
      weekPlan,
      feedbacks: weekFeedbacks,
      userName: settings.firstName || 'Utilisateur',
      weekKey,
      grade: weeklyScore.grade,
      actuals: weekActuals,
    });

    const url = buildShareUrl(encoded);

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard fallback for older browsers / mobile
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopied(true);
    toast.success('Lien praticien copié !', { duration: 2500 });
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size={size}
      className={className}
    >
      {copied ? (
        <Check size={16} className="mr-2 text-green-600" />
      ) : (
        <LinkIcon size={16} className="mr-2" />
      )}
      {copied ? 'Copié !' : 'Lien praticien'}
    </Button>
  );
}
