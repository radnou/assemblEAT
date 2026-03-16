'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { generateRoast } from '@/lib/roast/roastEngine';
import { RoastCard } from '@/components/roast/RoastCard';
import { useTranslations } from 'next-intl';
import { Flame, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { RoastAnalysis } from '@/lib/roast/roastEngine';

const ROAST_MODE_KEY = 'roast-mode';

function getCurrentWeekKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-${String(weekNumber).padStart(2, '0')}`;
}

export default function RoastPage() {
  const t = useTranslations('roast');
  const {
    feedbacks,
    settings,
    weekPlans,
    getWeekPlan,
    todayBreakfast,
    todayLunch,
    todayDinner,
  } = useMealStore();

  const [mode, setMode] = useState<'roast' | 'kind'>('roast');
  const [roast, setRoast] = useState<RoastAnalysis | null>(null);
  const [seed, setSeed] = useState(0);

  // Restore persisted mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ROAST_MODE_KEY);
      if (stored === 'kind' || stored === 'roast') {
        setMode(stored);
      }
    }
  }, []);

  const handleToggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'roast' ? 'kind' : 'roast';
      if (typeof window !== 'undefined') {
        localStorage.setItem(ROAST_MODE_KEY, next);
      }
      return next;
    });
  }, []);

  // Build week plan from store
  const buildWeekPlan = useCallback(() => {
    const weekKey = getCurrentWeekKey();
    const weekPlan = getWeekPlan(weekKey);

    // Include today's meals in the first day that is empty
    const plan = weekPlan.days.map((day) => ({
      breakfast: day.breakfast,
      lunch: day.lunch,
      dinner: day.dinner,
    }));

    // If today's meals are not in weekPlans, use todayBreakfast/Lunch/Dinner
    const hasTodayInPlan = plan.some(
      (d) => d.breakfast || d.lunch || d.dinner
    );
    if (!hasTodayInPlan && (todayBreakfast || todayLunch || todayDinner)) {
      plan[0] = {
        breakfast: todayBreakfast,
        lunch: todayLunch,
        dinner: todayDinner,
      };
    }

    return plan;
  }, [getWeekPlan, todayBreakfast, todayLunch, todayDinner, weekPlans]);

  const objective = (() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('userProfile');
        if (raw) {
          const profile = JSON.parse(raw);
          return profile?.objective ?? 'balanced';
        }
      } catch {
        // ignore
      }
    }
    return 'balanced';
  })();

  // Generate roast whenever mode or seed changes
  useEffect(() => {
    const plan = buildWeekPlan();
    const totalMeals = plan.reduce(
      (sum, d) => sum + (d.breakfast ? 1 : 0) + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0),
      0
    );
    if (totalMeals < 3) {
      setRoast(null);
      return;
    }
    const result = generateRoast(plan, feedbacks, objective, mode);
    setRoast(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, seed, feedbacks]);

  const handleRegenerate = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  const handleExport = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const card = document.getElementById('roast-card-export');
    if (!card) return;

    try {
      // Use native share if available
      if (navigator.share) {
        const text =
          roast?.punchlines.join('\n\n') ??
          'Roast my diet — AssemblEat';
        await navigator.share({
          title: 'Roast my diet',
          text: `🔥 AssemblEat a analysé ma semaine :\n\n${text}\n\nassembleat.app`,
        });
      } else {
        // Fallback: copy to clipboard
        const text =
          roast?.punchlines.join('\n\n') ??
          'Roast my diet — AssemblEat';
        await navigator.clipboard.writeText(
          `🔥 AssemblEat a analysé ma semaine :\n\n${text}\n\nassembleat.app`
        );
        alert('Copié dans le presse-papiers !');
      }
    } catch {
      // user cancelled share
    }
  }, [roast]);

  const plan = buildWeekPlan();
  const totalMeals = plan.reduce(
    (sum, d) =>
      sum + (d.breakfast ? 1 : 0) + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0),
    0
  );

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
            <Flame size={22} className="text-orange-500" />
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      {/* No data state */}
      {totalMeals < 3 ? (
        <div className="bg-gray-900 rounded-2xl p-8 text-center text-white space-y-3">
          <p className="text-4xl">🍽️</p>
          <p className="text-sm text-gray-300 leading-relaxed">{t('noData')}</p>
          <Link
            href="/app"
            className="inline-block mt-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            Valider mes repas
          </Link>
        </div>
      ) : roast ? (
        <div id="roast-card-export">
          <RoastCard
            punchlines={roast.punchlines}
            stats={roast.stats}
            mode={mode}
            onExport={handleExport}
            onToggleMode={handleToggleMode}
            onRegenerate={handleRegenerate}
          />
        </div>
      ) : null}
    </div>
  );
}
