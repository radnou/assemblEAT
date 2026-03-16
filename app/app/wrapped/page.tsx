'use client';

import { useMonthlyStats } from '@/lib/hooks/useMonthlyStats';
import { MonthlyWrapped } from '@/components/MonthlyWrapped';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WrappedPage() {
  const { stats, isAvailable } = useMonthlyStats();

  return (
    <div className="max-w-lg mx-auto py-6 px-4 space-y-4">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        Retour
      </Link>

      <h1 className="text-xl font-semibold">Mon bilan du mois</h1>

      {isAvailable && stats ? (
        <MonthlyWrapped stats={stats} />
      ) : (
        <div className="rounded-xl border bg-gray-50 p-8 text-center space-y-3">
          <span className="text-4xl">📊</span>
          <p className="text-sm text-gray-600 font-medium">
            Pas encore assez de données
          </p>
          <p className="text-xs text-gray-500">
            Valide au moins 10 repas ce mois-ci pour débloquer ton bilan mensuel.
          </p>
        </div>
      )}
    </div>
  );
}
