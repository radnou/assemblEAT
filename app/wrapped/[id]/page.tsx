import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────

interface WrappedPayload {
  m: string;  // month label
  t: number;  // totalMeals
  s: string;  // avgScore
  p: string;  // topProtein
  v: string;  // topVegetable
  n: number;  // varietyCount
  d: string;  // bestDay
  c: number;  // challengesCompleted
}

function decodePayload(id: string): WrappedPayload | null {
  try {
    const json = decodeURIComponent(
      atob(id.replace(/-/g, '+').replace(/_/g, '/'))
    );
    const data = JSON.parse(json) as WrappedPayload;
    if (!data.m || !data.t) return null;
    return data;
  } catch {
    return null;
  }
}

const SCORE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
};

const PROTEIN_EMOJI: Record<string, string> = {
  Poulet: '🍗', Boeuf: '🥩', Porc: '🥩', Saumon: '🐟', Thon: '🐟',
  Tofu: '🫘', Oeuf: '🥚', Oeufs: '🥚', Crevettes: '🦐', Dinde: '🍗',
};

const VEGETABLE_EMOJI: Record<string, string> = {
  Brocoli: '🥦', Carotte: '🥕', Tomate: '🍅', Courgette: '🥒',
  Épinards: '🥬', Épinard: '🥬', Poivron: '🫑', Aubergine: '🍆',
};

function getProteinEmoji(name: string): string {
  return PROTEIN_EMOJI[name] || '🥩';
}

function getVegetableEmoji(name: string): string {
  return VEGETABLE_EMOJI[name] || '🥦';
}

// ─── Metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const payload = decodePayload(id);

  const title = payload
    ? `📊 Bilan ${payload.m} — assemblEAT`
    : 'assemblEAT — Bilan mensuel';

  const description = payload
    ? `${payload.t} repas validés, Indice ${payload.s}, protéine préférée ${payload.p}`
    : 'Découvre ton bilan nutritionnel mensuel avec assemblEAT';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://assembleat.app/wrapped/${id}`,
      siteName: 'assemblEAT',
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function PublicWrappedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = decodePayload(id);

  if (!payload) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-4">
          <p className="text-4xl">🤷</p>
          <p className="text-lg font-medium">Ce bilan n&apos;existe pas</p>
          <Link
            href="/"
            className="inline-block bg-green-500 hover:bg-green-400 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Découvrir assemblEAT
          </Link>
        </div>
      </div>
    );
  }

  const { m: month, t: totalMeals, s: avgScore, p: topProtein, v: topVegetable, n: varietyCount, d: bestDay, c: challengesCompleted } = payload;
  const scoreLetter = avgScore.charAt(0);
  const scoreColor = SCORE_COLORS[scoreLetter] || 'bg-gray-600';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Header logo */}
      <div className="mb-6 flex items-center gap-2 text-white">
        <span className="text-2xl">🥗</span>
        <span className="text-lg font-bold tracking-tight">assemblEAT</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-green-600 via-emerald-500 to-orange-400 p-6 text-white">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🥗</span>
            <span className="text-sm font-bold tracking-wide opacity-90">assemblEAT</span>
          </div>
          <h1 className="text-lg font-bold mb-5">
            Bilan de {month}
          </h1>

          {/* Meals count */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="text-3xl font-extrabold">{totalMeals}</div>
            <div className="text-sm opacity-90">repas validés</div>
          </div>

          {/* Score */}
          <div className="mb-4">
            <div className="text-sm font-medium opacity-80 mb-1.5">
              Indice d&apos;équilibre
            </div>
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${scoreColor} text-white text-2xl font-extrabold shadow-md`}>
              {avgScore}
            </div>
          </div>

          {/* Top protein */}
          <div className="mb-3">
            <div className="text-sm opacity-80">Protéine préférée</div>
            <div className="text-lg font-bold">
              {getProteinEmoji(topProtein)} {topProtein}
            </div>
          </div>

          {/* Top vegetable */}
          <div className="mb-4">
            <div className="text-sm opacity-80">Légume star</div>
            <div className="text-lg font-bold">
              {getVegetableEmoji(topVegetable)} {topVegetable}
            </div>
          </div>

          {/* Variety */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🌈</span>
            <span className="text-sm font-semibold">
              {varietyCount} ingrédients uniques
            </span>
          </div>

          {/* Best day */}
          {bestDay && bestDay !== '—' && (
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="opacity-80" />
              <span className="text-sm">
                Meilleur jour : <span className="font-semibold capitalize">{bestDay}</span>
              </span>
            </div>
          )}

          {/* Challenges */}
          {challengesCompleted > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-semibold">
                {challengesCompleted} défi{challengesCompleted > 1 ? 's' : ''} relevé{challengesCompleted > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Watermark */}
          <div className="mt-5 pt-3 border-t border-white/20 text-center">
            <span className="text-xs opacity-60">assembleat.app</span>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white p-4">
          <Link
            href="/app"
            className="block w-full text-center py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
          >
            Crée ton propre bilan →
          </Link>
        </div>
      </div>

      {/* Bottom branding */}
      <p className="mt-6 text-xs text-gray-600">
        Généré par{' '}
        <Link href="/" className="text-green-400 hover:underline">
          assemblEAT
        </Link>
      </p>
    </div>
  );
}
