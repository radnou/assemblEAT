'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Share2, ToggleLeft, ToggleRight, Heart, Flame } from 'lucide-react';
import type { RoastAnalysis } from '@/lib/roast/roastEngine';
import { useTranslations } from 'next-intl';

interface RoastCardProps {
  punchlines: string[];
  stats: RoastAnalysis['stats'];
  mode: 'roast' | 'kind';
  onExport: () => void;
  onToggleMode: () => void;
  onRegenerate: () => void;
}

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span>
      {words.map((word, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay + i * 0.06,
            duration: 0.15,
            ease: 'easeOut',
          }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function RoastCard({
  punchlines,
  stats,
  mode,
  onExport,
  onToggleMode,
  onRegenerate,
}: RoastCardProps) {
  const t = useTranslations('roast');
  const [animKey, setAnimKey] = useState(0);
  const prevPunchlinesRef = useRef<string[]>([]);

  useEffect(() => {
    const changed = punchlines.some((p, i) => p !== prevPunchlinesRef.current[i]);
    if (changed) {
      setAnimKey((k) => k + 1);
      prevPunchlinesRef.current = punchlines;
    }
  }, [punchlines]);

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          {mode === 'roast' ? (
            <Flame size={20} className="text-orange-400" />
          ) : (
            <Heart size={20} className="text-pink-400" />
          )}
          <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            {t('title')}
          </span>
        </div>

        {/* Mode toggle */}
        <button
          onClick={onToggleMode}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          aria-label={t('kindMode')}
        >
          <span>{t('kindMode')}</span>
          {mode === 'kind' ? (
            <ToggleRight size={20} className="text-pink-400" />
          ) : (
            <ToggleLeft size={20} className="text-gray-500" />
          )}
        </button>
      </div>

      {/* Punchlines */}
      <div className="px-5 pb-4 space-y-5" key={animKey}>
        {punchlines.map((line, index) => (
          <AnimatePresence key={`${animKey}-${index}`} mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <div
                className={`text-sm leading-tight font-medium before:content-['"'] after:content-['"'] ${
                  mode === 'roast'
                    ? 'before:text-orange-400 after:text-orange-400 text-gray-100'
                    : 'before:text-pink-400 after:text-pink-400 text-gray-100'
                }`}
              >
                <TypewriterText text={line} delay={index * 0.4} />
              </div>
              <div
                className={`absolute -left-2 top-0 bottom-0 w-0.5 rounded-full ${
                  mode === 'roast' ? 'bg-orange-500' : 'bg-pink-500'
                }`}
              />
            </motion.div>
          </AnimatePresence>
        ))}
      </div>

      {/* Stats badges */}
      <div className="px-5 pb-4">
        <div className="flex flex-wrap gap-2">
          <StatBadge
            label={t('stats.meals')}
            value={String(stats.totalMeals)}
            color="bg-gray-700"
          />
          {stats.avgScore !== '-' && (
            <StatBadge
              label={t('stats.avgScore')}
              value={stats.avgScore}
              color={
                stats.avgScore === 'A' || stats.avgScore === 'B'
                  ? 'bg-emerald-800'
                  : stats.avgScore === 'C'
                  ? 'bg-yellow-800'
                  : 'bg-red-900'
              }
            />
          )}
          <StatBadge
            label={t('stats.ingredients')}
            value={String(stats.uniqueIngredients)}
            color="bg-gray-700"
          />
          {stats.lightDinners > 0 && (
            <StatBadge
              label={t('stats.lightDinners')}
              value={String(stats.lightDinners)}
              color="bg-blue-900"
            />
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-5 pb-5">
        <button
          onClick={onRegenerate}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          <RefreshCw size={15} />
          {t('regenerate')}
        </button>
        <button
          onClick={onExport}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
            mode === 'roast'
              ? 'bg-orange-500 hover:bg-orange-400 text-white'
              : 'bg-pink-500 hover:bg-pink-400 text-white'
          }`}
        >
          <Share2 size={15} />
          {t('share')}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-gray-800 px-5 py-3 text-center">
        <p className="text-xs text-gray-500 leading-snug">
          {t('disclaimer')}{' '}
          <a
            href="tel:0800000067"
            className="text-gray-400 hover:text-white underline transition-colors"
          >
            {t('helpline')}
          </a>
        </p>
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-lg px-3 py-1.5 flex items-center gap-1.5`}>
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="text-xs text-gray-300">{label}</span>
    </div>
  );
}
