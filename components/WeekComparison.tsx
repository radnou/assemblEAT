'use client';

interface WeekComparisonProps {
  conformity: { rate: number; logged: number; skipped: number };
  weekLabel: string;
}

export function WeekComparison({ conformity, weekLabel }: WeekComparisonProps) {
  const { rate, logged, skipped } = conformity;
  return (
    <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-4 space-y-3">
      <h3 className="font-semibold text-sm text-blue-900">Bilan — {weekLabel}</h3>
      <div className="flex gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700">{rate}%</div>
          <div className="text-xs text-muted-foreground">Conformité</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{logged}</div>
          <div className="text-xs text-muted-foreground">Repas notés</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">{skipped}</div>
          <div className="text-xs text-muted-foreground">Sauts</div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Suggestions suivies</span>
          <span>{rate}%</span>
        </div>
        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${rate}%` }} />
        </div>
      </div>
      {skipped > 3 && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
          Tu as sauté {skipped} repas cette semaine. Essaie de noter plus régulièrement.
        </p>
      )}
    </div>
  );
}
