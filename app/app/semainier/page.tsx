'use client';

import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWeekNavigation } from '@/lib/hooks/useWeekNavigation';
import { useMealStore } from '@/lib/store/useMealStore';
import { generateRandomAssembly } from '@/lib/engine/assemblyEngine';
import { DayColumn } from '@/components/DayColumn';
import { ShareWeekButton } from '@/components/share/ShareWeekButton';
import { useTranslations } from 'next-intl';

export default function SemainierPage() {
  const t = useTranslations('weekPlanner');
  const { weekKey, weekDates, dayNames, goToPreviousWeek, goToNextWeek, goToCurrentWeek, isCurrentWeek } = useWeekNavigation();
  const { getWeekPlan, setDayPlan, recentProteins, settings, streakCount } = useMealStore();

  const weekPlan = getWeekPlan(weekKey);

  const handleGenerateDay = useCallback((dayIndex: number) => {
    const breakfast = generateRandomAssembly('breakfast') ?? null;
    const lunch = generateRandomAssembly('lunch', {
      breakfastAssembly: breakfast,
      recentProteins,
      enableAntiRedundancy: settings.rules.antiRedundancy,
    }) ?? null;
    const dinner = generateRandomAssembly('dinner', {
      breakfastAssembly: breakfast,
      recentProteins,
      enableAntiRedundancy: settings.rules.antiRedundancy,
    }) ?? null;

    setDayPlan(weekKey, dayIndex, {
      date: weekDates[dayIndex].toISOString().split('T')[0],
      breakfast,
      lunch,
      dinner,
    });
  }, [weekKey, weekDates, setDayPlan, recentProteins, settings.rules.antiRedundancy]);

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek} aria-label={t('previousWeek')}>
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant={isCurrentWeek ? 'default' : 'outline'}
            size="sm"
            onClick={goToCurrentWeek}
            className="text-xs"
          >
            {weekKey}
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextWeek} aria-label={t('nextWeek')}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Share button */}
      <div className="flex justify-end">
        <ShareWeekButton
          weekPlan={weekPlan}
          streak={streakCount}
          userName={settings.firstName}
        />
      </div>

      {/* Week grid */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 min-w-[700px] lg:min-w-0">
          {weekDates.map((date, i) => (
            <DayColumn
              key={i}
              dayName={dayNames[i]}
              date={date}
              dayPlan={weekPlan.days[i]}
              onGenerate={() => handleGenerateDay(i)}
              onUpdatePlan={(plan) => setDayPlan(weekKey, i, plan)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
