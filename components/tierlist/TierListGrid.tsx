'use client';

import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TierRank, TierItem } from '@/lib/tierlist/tierlistEngine';

interface TierConfig {
  rank: TierRank;
  label: string;
  labelClass: string;
  rowClass: string;
  emoji: string;
}

const TIER_CONFIG: TierConfig[] = [
  {
    rank: 'S',
    label: 'S',
    emoji: '🌟',
    labelClass: 'bg-gradient-to-b from-red-400 to-pink-500 text-white',
    rowClass: 'bg-red-50 border-red-200',
  },
  {
    rank: 'A',
    label: 'A',
    emoji: '🔥',
    labelClass: 'bg-orange-400 text-white',
    rowClass: 'bg-orange-50 border-orange-200',
  },
  {
    rank: 'B',
    label: 'B',
    emoji: '👍',
    labelClass: 'bg-yellow-400 text-white',
    rowClass: 'bg-yellow-50 border-yellow-200',
  },
  {
    rank: 'C',
    label: 'C',
    emoji: '😐',
    labelClass: 'bg-green-500 text-white',
    rowClass: 'bg-green-50 border-green-200',
  },
  {
    rank: 'D',
    label: 'D',
    emoji: '💀',
    labelClass: 'bg-gray-400 text-white',
    rowClass: 'bg-gray-50 border-gray-200',
  },
];

const NUTRI_GRADE_EMOJI: Record<string, string> = {
  A: '🟢',
  B: '🟡',
  C: '🟠',
  D: '🔴',
  E: '⚫',
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

interface TierRowProps {
  config: TierConfig;
  items: TierItem[];
  mealsLabel: string;
}

function TierRow({ config, items, mealsLabel }: TierRowProps) {
  return (
    <motion.div
      variants={rowVariants}
      transition={{ duration: 0.35 }}
      className={`flex items-stretch rounded-xl border overflow-hidden ${config.rowClass}`}
    >
      {/* Label */}
      <div
        className={`flex items-center justify-center w-12 min-h-14 shrink-0 font-black text-xl ${config.labelClass}`}
      >
        {config.label}
      </div>

      {/* Items */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-2 p-3 min-h-14 flex-1"
      >
        {items.length === 0 ? (
          <span className="text-xs text-gray-400 self-center italic">—</span>
        ) : (
          items.map((item) => (
            <motion.div
              key={item.assemblyId}
              variants={cardVariants}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-start bg-white rounded-lg px-3 py-2 shadow-sm border border-white/80 max-w-[160px]"
            >
              <span className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                {item.name}
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-500">
                  {NUTRI_GRADE_EMOJI[item.nutriGrade] ?? '⚪'} {item.nutriGrade}
                </span>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[10px] text-gray-500">
                  ★ {item.avgPleasure.toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[10px] text-gray-500">
                  {item.count} {mealsLabel}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}

interface TierListGridProps {
  tiers: Record<TierRank, TierItem[]>;
  onExport: () => void;
  totalFeedbacks: number;
}

export function TierListGrid({ tiers, onExport, totalFeedbacks }: TierListGridProps) {
  const t = useTranslations('tierlist');

  if (totalFeedbacks < 3) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 text-center space-y-3 border border-yellow-200">
        <p className="text-4xl">🍽️</p>
        <p className="text-sm text-gray-600 leading-relaxed">{t('noData')}</p>
      </div>
    );
  }

  const mealsLabel = t('meals');

  return (
    <div className="space-y-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {TIER_CONFIG.map((config) => (
          <TierRow
            key={config.rank}
            config={config}
            items={tiers[config.rank]}
            mealsLabel={mealsLabel}
          />
        ))}
      </motion.div>

      {/* Export button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Download size={16} />
          {t('export')}
        </button>
      </div>
    </div>
  );
}
