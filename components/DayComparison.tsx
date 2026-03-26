'use client';

import type { MealType, AssemblyRow, ActualMeal } from '@/types';

interface DayComparisonProps {
  date: string;
  comparison: Array<{
    mealType: MealType;
    planned: AssemblyRow | null;
    actual: ActualMeal | null;
  }>;
}

const MEAL_LABELS: Record<MealType, { label: string; emoji: string }> = {
  breakfast: { label: 'Petit-déj', emoji: '☀️' },
  lunch: { label: 'Déjeuner', emoji: '🍽️' },
  dinner: { label: 'Dîner', emoji: '🌙' },
};

function getPlannedSummary(planned: AssemblyRow | null): string {
  if (!planned) return '—';
  const parts = [planned.protein?.name, planned.vegetable?.name, planned.cereal?.name].filter(Boolean);
  return parts.join(' + ') || '—';
}

function getActualSummary(actual: ActualMeal | null): string {
  if (!actual) return 'Non noté';
  if (actual.status === 'skipped') return 'Sauté';
  if (actual.status === 'confirmed') return 'Identique';
  return actual.description ?? actual.pills?.join(', ') ?? 'Autre';
}

function getStatusIcon(actual: ActualMeal | null): string {
  if (!actual) return '';
  if (actual.status === 'confirmed') return '✅';
  if (actual.status === 'skipped') return '⏭️';
  return '⚠️';
}

export function DayComparison({ date, comparison }: DayComparisonProps) {
  const dayName = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' });
  const logged = comparison.filter((c) => c.actual !== null).length;
  if (logged === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm capitalize">Prévu vs Réel — {dayName}</h3>
        <span className="text-xs text-muted-foreground">{logged}/3 notés</span>
      </div>
      {comparison.map(({ mealType, planned, actual }) => {
        const { label, emoji } = MEAL_LABELS[mealType];
        return (
          <div key={mealType} className="text-sm space-y-0.5">
            <div className="font-medium text-xs text-muted-foreground">{emoji} {label}</div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-muted-foreground text-xs">Prévu: </span>
                <span className="text-xs">{getPlannedSummary(planned)}</span>
              </div>
              <div className="flex-1 text-right">
                <span className="text-muted-foreground text-xs">Réel: </span>
                <span className="text-xs">{getActualSummary(actual)} {getStatusIcon(actual)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
