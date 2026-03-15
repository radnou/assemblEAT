'use client';

import { motion } from 'framer-motion';
import type { WeeklyScore } from '@/lib/engine/weeklyScore';

interface WeeklyScoreCardProps {
  score: WeeklyScore;
  weekKey: string;
  userName: string;
}

const gradeGradients: Record<WeeklyScore['grade'], string> = {
  A: 'from-emerald-400 to-green-500',
  B: 'from-lime-400 to-green-400',
  C: 'from-yellow-300 to-amber-400',
  D: 'from-orange-400 to-amber-500',
  E: 'from-red-400 to-rose-500',
};

const gradeTextColor: Record<WeeklyScore['grade'], string> = {
  A: 'text-emerald-700',
  B: 'text-lime-700',
  C: 'text-amber-700',
  D: 'text-orange-700',
  E: 'text-rose-700',
};

const gradeBgLight: Record<WeeklyScore['grade'], string> = {
  A: 'bg-emerald-50',
  B: 'bg-lime-50',
  C: 'bg-amber-50',
  D: 'bg-orange-50',
  E: 'bg-rose-50',
};

const gradeBorderLight: Record<WeeklyScore['grade'], string> = {
  A: 'border-emerald-200',
  B: 'border-lime-200',
  C: 'border-amber-200',
  D: 'border-orange-200',
  E: 'border-rose-200',
};

export function WeeklyScoreCard({ score, weekKey, userName }: WeeklyScoreCardProps) {
  const { grade, mealsValidated, totalMeals, avgPleasure, insight, strengths, weaknesses } = score;

  const pleasureDisplay = avgPleasure > 0 ? avgPleasure.toFixed(1) : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`relative rounded-2xl overflow-hidden border ${gradeBorderLight[grade]} ${gradeBgLight[grade]}`}
    >
      {/* Gradient accent bar at top */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradeGradients[grade]}`} />

      <div className="px-5 py-4 space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Score de la semaine
            </p>
            {userName && (
              <p className="text-sm font-medium text-gray-700 mt-0.5">{userName}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 font-mono">{weekKey}</span>
        </div>

        {/* Grade + stats row */}
        <div className="flex items-center gap-5">
          {/* Big grade letter */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 200 }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradeGradients[grade]} flex items-center justify-center shadow-md shrink-0`}
          >
            <span className="text-3xl font-extrabold text-white tracking-tight">{grade}</span>
          </motion.div>

          {/* Stats */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">
              <span className={`text-lg font-bold ${gradeTextColor[grade]}`}>{mealsValidated}</span>
              <span className="text-gray-500">/{totalMeals} repas validés</span>
            </p>
            <p className="text-sm text-gray-600">
              Plaisir{' '}
              <span className={`font-bold ${gradeTextColor[grade]}`}>{pleasureDisplay}</span>
              <span className="text-gray-400">/5</span>
            </p>
          </div>
        </div>

        {/* Insight */}
        <p className="text-sm text-gray-700 leading-snug">{insight}</p>

        {/* Strengths & weaknesses */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {strengths.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 font-medium px-2.5 py-1 rounded-full"
              >
                <span>✓</span> {s}
              </span>
            ))}
            {weaknesses.map((w) => (
              <span
                key={w}
                className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 font-medium px-2.5 py-1 rounded-full"
              >
                <span>↑</span> {w}
              </span>
            ))}
          </div>
        )}

        {/* Watermark */}
        <p className="text-[10px] text-gray-300 text-right select-none">assembleat.app</p>
      </div>
    </motion.div>
  );
}
