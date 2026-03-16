'use client';

import { useCallback } from 'react';
import { Share2, Calendar } from 'lucide-react';
import type { MonthlyStats } from '@/lib/hooks/useMonthlyStats';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PROTEIN_EMOJI: Record<string, string> = {
  Poulet: '🍗', Boeuf: '🥩', Porc: '🥩', Saumon: '🐟', Thon: '🐟',
  Tofu: '🫘', Oeuf: '🥚', Oeufs: '🥚', Crevettes: '🦐', Dinde: '🍗',
  Agneau: '🥩', Canard: '🦆', Lentilles: '🫘', 'Pois chiches': '🫘',
};

const VEGETABLE_EMOJI: Record<string, string> = {
  Brocoli: '🥦', Carotte: '🥕', Tomate: '🍅', Courgette: '🥒',
  'Haricots verts': '🫛', Épinard: '🥬', Épinards: '🥬', Poivron: '🫑',
  Aubergine: '🍆', Chou: '🥬', Salade: '🥗', Champignons: '🍄',
};

const SCORE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
};

function getProteinEmoji(name: string): string {
  return PROTEIN_EMOJI[name] || '🥩';
}

function getVegetableEmoji(name: string): string {
  return VEGETABLE_EMOJI[name] || '🥦';
}

// ─── Share ───────────────────────────────────────────────────────────────────

function buildShareText(stats: MonthlyStats): string {
  return `Mon bilan assemblEAT de ${stats.month} : ${stats.totalMeals} repas, Indice ${stats.avgScore}, protéine préférée ${stats.topProtein} ${getProteinEmoji(stats.topProtein)} → assembleat.app`;
}

function buildShareUrl(stats: MonthlyStats): string {
  try {
    const payload = {
      m: stats.month,
      t: stats.totalMeals,
      s: stats.avgScore,
      p: stats.topProtein,
      v: stats.topVegetable,
      n: stats.varietyCount,
      d: stats.bestDay,
      c: stats.challengesCompleted,
    };
    const json = JSON.stringify(payload);
    const b64 = btoa(encodeURIComponent(json))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `${window.location.origin}/wrapped/${b64}`;
  } catch {
    return 'https://assembleat.app';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MonthlyWrappedProps {
  stats: MonthlyStats;
  onShare?: () => void;
}

export function MonthlyWrapped({ stats, onShare }: MonthlyWrappedProps) {
  const handleShare = useCallback(async () => {
    const text = buildShareText(stats);
    const url = buildShareUrl(stats);

    if (navigator.share) {
      try {
        await navigator.share({ title: `Mon bilan ${stats.month}`, text, url });
        onShare?.();
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      onShare?.();
    } catch {
      // silently fail
    }
  }, [stats, onShare]);

  const scoreLetter = stats.avgScore.charAt(0);
  const scoreColor = SCORE_COLORS[scoreLetter] || 'bg-gray-500';

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      {/* ─── Card ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-500 to-orange-400 p-6 text-white">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🥗</span>
          <span className="text-sm font-bold tracking-wide opacity-90">assemblEAT</span>
        </div>
        <h3 className="text-lg font-bold mb-5">
          Ton bilan de {stats.month}
        </h3>

        {/* Meals count */}
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="text-3xl font-extrabold">{stats.totalMeals}</div>
          <div className="text-sm opacity-90">repas validés</div>
        </div>

        {/* Score */}
        <div className="mb-4">
          <div className="text-sm font-medium opacity-80 mb-1.5">
            Indice d&apos;équilibre
          </div>
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${scoreColor} text-white text-2xl font-extrabold shadow-md`}>
            {stats.avgScore}
          </div>
        </div>

        {/* Top protein */}
        <div className="mb-3">
          <div className="text-sm opacity-80">Protéine préférée</div>
          <div className="text-lg font-bold">
            {getProteinEmoji(stats.topProtein)} {stats.topProtein}
          </div>
        </div>

        {/* Top vegetable */}
        <div className="mb-4">
          <div className="text-sm opacity-80">Légume star</div>
          <div className="text-lg font-bold">
            {getVegetableEmoji(stats.topVegetable)} {stats.topVegetable}
          </div>
        </div>

        {/* Variety */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🌈</span>
          <span className="text-sm font-semibold">
            {stats.varietyCount} ingrédients uniques
          </span>
        </div>

        {/* Best day */}
        {stats.bestDay !== '—' && (
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="opacity-80" />
            <span className="text-sm">
              Meilleur jour : <span className="font-semibold capitalize">{stats.bestDay}</span>
            </span>
          </div>
        )}

        {/* Challenges */}
        {stats.challengesCompleted > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-semibold">
              {stats.challengesCompleted} défi{stats.challengesCompleted > 1 ? 's' : ''} relevé{stats.challengesCompleted > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Watermark */}
        <div className="mt-5 pt-3 border-t border-white/20 text-center">
          <span className="text-xs opacity-60">assembleat.app</span>
        </div>
      </div>

      {/* ─── Share button ─────────────────────────────────────────────── */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-green-700 font-semibold text-sm hover:bg-green-50 transition-colors"
      >
        <Share2 size={16} />
        Partager mon bilan
      </button>
    </div>
  );
}
