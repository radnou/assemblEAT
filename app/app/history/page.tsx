'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { useMealStore } from '@/lib/store/useMealStore';
import { ProUpsellDialog } from '@/components/ProUpsellDialog';
import { computeWeeklyHistory } from '@/lib/history/historyEngine';
import { ChevronDown, ChevronUp, TrendingUp, Calendar, Star, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function pleasureEmoji(avg: number): string {
  if (avg >= 4) return '😄';
  if (avg >= 3) return '🙂';
  if (avg > 0) return '😕';
  return '—';
}

function barColor(avg: number): string {
  if (avg >= 4) return 'bg-green-500';
  if (avg >= 3) return 'bg-orange-400';
  if (avg > 0) return 'bg-red-400';
  return 'bg-gray-200';
}

function weekLabel(weekKey: string): string {
  // weekKey is "YYYY-WXX", display as "SXX"
  const parts = weekKey.split('-W');
  if (parts.length === 2) return `S${parts[1]}`;
  return weekKey;
}

function currentStreak(history: ReturnType<typeof computeWeeklyHistory>): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].totalMeals > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function HistoryPage() {
  const t = useTranslations('history');
  const { plan } = useSubscriptionStore();
  const hasAccess = useFeatureFlag('WEEKLY_STATS');
  const { feedbacks } = useMealStore();
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  if (plan === 'free' || !hasAccess) {
    return (
      <div className="py-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
        <div className="text-5xl">📊</div>
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 max-w-xs">{t('subtitle')}</p>
        <p className="text-sm text-gray-400 max-w-xs">
          Suivez votre évolution nutritionnelle sur 12 semaines avec AssemblEat Pro.
        </p>
        <button
          onClick={() => setUpsellOpen(true)}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          ✨ Passer à Pro
        </button>
        <ProUpsellDialog
          open={upsellOpen}
          onOpenChange={setUpsellOpen}
          feature="WEEKLY_STATS"
        />
      </div>
    );
  }

  const history = computeWeeklyHistory(feedbacks, 12);
  const totalFeedbacks = feedbacks.length;
  const avgPleasureAll =
    feedbacks.length > 0
      ? Math.round((feedbacks.reduce((s, f) => s + f.pleasure, 0) / feedbacks.length) * 10) / 10
      : 0;
  const bestWeek = history.reduce(
    (best, w) => (w.totalMeals > (best?.totalMeals ?? 0) ? w : best),
    history[0]
  );
  const streak = currentStreak(history);

  const maxMeals = 21; // 3 meals/day × 7 days

  const summaryCards = [
    {
      icon: <Star size={20} className="text-yellow-500" />,
      value: totalFeedbacks,
      label: t('totalFeedbacks'),
    },
    {
      icon: <TrendingUp size={20} className="text-blue-500" />,
      value: avgPleasureAll > 0 ? `${avgPleasureAll}/5` : '—',
      label: t('avgPleasure'),
    },
    {
      icon: <Calendar size={20} className="text-green-500" />,
      value: bestWeek?.totalMeals ?? 0,
      label: t('bestWeek'),
    },
    {
      icon: <Flame size={20} className="text-orange-500" />,
      value: streak,
      label: t('currentStreak'),
    },
  ];

  const hasAnyData = history.some((w) => w.totalMeals > 0);

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {summaryCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="bg-white rounded-xl border p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{card.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {!hasAnyData ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm text-gray-500">{t('noData')}</p>
        </div>
      ) : (
        <>
          {/* Weekly bar chart */}
          <div className="bg-white rounded-xl border p-4 space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('week')}s</h2>
            {history.map((week) => {
              const pct = Math.round((week.totalMeals / maxMeals) * 100);
              const color = barColor(week.avgPleasure);
              const emoji = pleasureEmoji(week.avgPleasure);
              return (
                <div key={week.weekKey} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-xs text-gray-400 font-mono flex-shrink-0">
                    {weekLabel(week.weekKey)}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-5 text-center flex-shrink-0 text-base leading-none">
                    {week.totalMeals > 0 ? emoji : ''}
                  </span>
                  <span className="w-8 text-xs text-gray-400 text-right flex-shrink-0">
                    {week.totalMeals > 0 ? `${week.totalMeals}` : ''}
                  </span>
                </div>
              );
            })}
            {/* Legend */}
            <div className="flex gap-4 pt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> ≥4
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400" /> ≥3
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400" /> &lt;3
              </span>
            </div>
          </div>

          {/* Weekly details accordion */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">{t('expand')}</h2>
            {history
              .filter((w) => w.totalMeals > 0)
              .map((week) => {
                const isOpen = expandedWeek === week.weekKey;
                return (
                  <div key={week.weekKey} className="bg-white rounded-xl border overflow-hidden">
                    <button
                      onClick={() => setExpandedWeek(isOpen ? null : week.weekKey)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {t('week')} {weekLabel(week.weekKey)}
                        </span>
                        <span className="text-xs text-gray-400">{week.startDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {week.totalMeals} {t('meals')}
                        </span>
                        {isOpen ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t bg-gray-50 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Repas validés</span>
                              <span className="font-semibold text-gray-800">
                                {week.totalMeals} / {maxMeals}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Plaisir moyen</span>
                              <span className="font-semibold text-gray-800">
                                {week.avgPleasure > 0
                                  ? `${week.avgPleasure}/5 ${pleasureEmoji(week.avgPleasure)}`
                                  : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Top protéine</span>
                              <span className="font-semibold text-gray-800 truncate max-w-[160px]">
                                {week.topProtein ? week.topProtein : '—'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
