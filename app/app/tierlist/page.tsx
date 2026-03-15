'use client';

import { useMemo, useCallback } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { computeTierList } from '@/lib/tierlist/tierlistEngine';
import { TierListGrid } from '@/components/tierlist/TierListGrid';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function TierListPage() {
  const t = useTranslations('tierlist');
  const { feedbacks, weekPlans } = useMealStore();

  const tiers = useMemo(
    () => computeTierList(feedbacks, weekPlans),
    [feedbacks, weekPlans]
  );

  const handleExport = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const lines: string[] = ['🏆 Ma Tier List — AssemblEat', ''];
    const ranks = ['S', 'A', 'B', 'C', 'D'] as const;
    for (const rank of ranks) {
      const items = tiers[rank];
      if (items.length === 0) continue;
      lines.push(`[${rank}] ${items.map((i) => i.name).join(', ')}`);
    }
    lines.push('', 'assembleat.app');

    const text = lines.join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ma Tier List', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Copié dans le presse-papiers !');
      }
    } catch {
      // user cancelled
    }
  }, [tiers]);

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app"
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
          aria-label="Retour"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Trophy size={22} className="text-yellow-500" />
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      {/* Tier List */}
      <TierListGrid
        tiers={tiers}
        onExport={handleExport}
        totalFeedbacks={feedbacks.length}
      />
    </div>
  );
}
