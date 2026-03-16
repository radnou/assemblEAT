import type { Metadata } from 'next';
import Link from 'next/link';
import { Flame, Heart } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────

interface RoastPayload {
  firstName: string;
  roastText: string;
  score: string;
  mode: 'roast' | 'kind';
  date: string;
}

function decodePayload(id: string): RoastPayload | null {
  try {
    const json = decodeURIComponent(
      atob(id.replace(/-/g, '+').replace(/_/g, '/'))
    );
    const data = JSON.parse(json) as RoastPayload;
    if (!data.roastText || !data.mode) return null;
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

function formatDateFr(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
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
    ? `${payload.mode === 'roast' ? '🔥' : '💚'} Le roast de ${payload.firstName} — assemblEAT`
    : 'assemblEAT — Roast';

  const description = payload
    ? payload.roastText.slice(0, 160)
    : 'Découvre ton bilan alimentaire avec assemblEAT';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://assembleat.app/roast/${id}`,
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

export default async function PublicRoastPage({
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
          <p className="text-lg font-medium">Ce roast n&apos;existe pas</p>
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Découvrir assemblEAT
          </Link>
        </div>
      </div>
    );
  }

  const { firstName, roastText, score, mode, date } = payload;
  const isRoast = mode === 'roast';
  const accentColor = isRoast ? 'orange' : 'pink';
  const punchlines = roastText.split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Header logo */}
      <div className="mb-6 flex items-center gap-2 text-white">
        <span className="text-2xl">🥗</span>
        <span className="text-lg font-bold tracking-tight">assemblEAT</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden shadow-2xl text-white">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            {isRoast ? (
              <Flame size={20} className="text-orange-400" />
            ) : (
              <Heart size={20} className="text-pink-400" />
            )}
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isRoast
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-pink-500/20 text-pink-400'
              }`}
            >
              {isRoast ? '🔥 Roast' : '💚 Kind'}
            </span>
          </div>
          {date && (
            <span className="text-xs text-gray-500">{formatDateFr(date)}</span>
          )}
        </div>

        {/* Name */}
        <div className="px-5 pb-3">
          <p className="text-sm text-gray-400">
            Le bilan de{' '}
            <span className="font-semibold text-white">{firstName}</span>
          </p>
        </div>

        {/* Punchlines */}
        <div className="px-5 pb-4 space-y-4">
          {punchlines.map((line, index) => (
            <div key={index} className="relative pl-3">
              <div
                className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full ${
                  isRoast ? 'bg-orange-500' : 'bg-pink-500'
                }`}
              />
              <p
                className={`text-sm leading-relaxed font-medium ${
                  isRoast
                    ? 'before:text-orange-400 after:text-orange-400'
                    : 'before:text-pink-400 after:text-pink-400'
                } before:content-['"'] after:content-['"'] text-gray-100`}
              >
                {line}
              </p>
            </div>
          ))}
        </div>

        {/* Score badge */}
        {score && score !== '-' && (
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2">
              <div
                className={`${SCORE_COLORS[score] ?? 'bg-gray-600'} rounded-lg px-3 py-1.5 flex items-center gap-1.5`}
              >
                <span className="text-sm font-bold text-white">{score}</span>
                <span className="text-xs text-white/80">
                  Indice d&apos;équilibre
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-5 pb-5">
          <Link
            href="/app"
            className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
              isRoast
                ? 'bg-orange-500 hover:bg-orange-400 text-white'
                : 'bg-pink-500 hover:bg-pink-400 text-white'
            }`}
          >
            Fais-toi roast toi aussi →
          </Link>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 px-5 py-3 text-center">
          <p className="text-xs text-gray-500">
            assembleat.app — Planifie tes repas avec le Nutri-Score
          </p>
        </div>
      </div>

      {/* Bottom branding */}
      <p className="mt-6 text-xs text-gray-600">
        Généré par{' '}
        <Link href="/" className={`text-${accentColor}-400 hover:underline`}>
          assemblEAT
        </Link>
      </p>
    </div>
  );
}
