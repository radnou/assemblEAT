import type { Metadata } from 'next';
import Link from 'next/link';
import { getTopCombinations, getPrettyName } from '@/lib/seo/combinations';
import type { NutriGrade } from '@/types';

// ─── Metadata ───────────────────────────────────────

export const metadata: Metadata = {
  title: 'Nutri-Score des combinaisons de repas | assemblEAT',
  description:
    'D\u00E9couvrez le Nutri-Score de 50 combinaisons de repas populaires : poulet, saumon, tofu, lentilles avec l\u00E9gumes et f\u00E9culents. Trouvez les meilleurs assemblages pour manger \u00E9quilibr\u00E9.',
  openGraph: {
    title: 'Nutri-Score des combinaisons de repas | assemblEAT',
    description:
      '50 combinaisons de repas not\u00E9es de A \u00E0 E. Trouvez les meilleurs assemblages prot\u00E9ine + l\u00E9gume + f\u00E9culent.',
  },
};

// ─── Helpers ────────────────────────────────────────

const gradeColors: Record<NutriGrade, { bg: string; text: string; light: string }> = {
  A: { bg: '#037F2D', text: '#FFFFFF', light: '#E6F5EC' },
  B: { bg: '#7DC243', text: '#FFFFFF', light: '#F1F9E8' },
  C: { bg: '#FFCC01', text: '#2E4057', light: '#FFFBE6' },
  D: { bg: '#F5860F', text: '#FFFFFF', light: '#FEF3E6' },
  E: { bg: '#E63312', text: '#FFFFFF', light: '#FDE8E6' },
};

const gradeLabels: Record<NutriGrade, string> = {
  A: 'Excellent',
  B: 'Bon',
  C: 'Correct',
  D: 'Limit\u00E9',
  E: '\u00C0 \u00E9viter',
};

// ─── Page component ─────────────────────────────────

export default function NutriScoreIndexPage() {
  const combinations = getTopCombinations();

  // Group by grade for summary
  const gradeCounts: Record<NutriGrade, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const combo of combinations) {
    gradeCounts[combo.score]++;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[var(--color-text-main)]">
            🥗 AssemblEat
          </Link>
          <a
            href="/app"
            className="px-4 py-1.5 rounded-full bg-[var(--color-cta)] text-white font-semibold text-sm hover:opacity-90 transition"
          >
            Essayer l&apos;app
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600 transition">Accueil</Link>
          {' / '}
          <span className="text-gray-600">Nutri-Score</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-text-main)] mb-4">
            Nutri-Score des combinaisons de repas
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            D&eacute;couvrez le Nutri-Score de {combinations.length} assemblages populaires
            prot&eacute;ine + l&eacute;gume + f&eacute;culent. Chaque score est calcul&eacute; avec
            l&apos;algorithme Nutri-Score v2 officiel, en tenant compte du poids r&eacute;el de
            chaque composant.
          </p>
        </div>

        {/* Grade summary */}
        <div className="flex justify-center gap-4 mb-12">
          {(['A', 'B', 'C', 'D', 'E'] as NutriGrade[]).map((grade) => {
            const c = gradeColors[grade];
            return (
              <div
                key={grade}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl"
                style={{ background: c.light }}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
                  style={{ background: c.bg, color: c.text }}
                >
                  {grade}
                </span>
                <span className="text-sm font-semibold text-gray-600">
                  {gradeCounts[grade]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Combinations grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinations.map((combo) => {
            const c = gradeColors[combo.score];
            return (
              <Link
                key={combo.slug}
                href={`/nutriscore/${combo.slug}`}
                className="group flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:shadow-lg transition bg-white"
              >
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0"
                  style={{ background: c.bg, color: c.text }}
                >
                  {combo.score}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-cta)] transition leading-tight">
                    {getPrettyName(combo.protein)} + {getPrettyName(combo.vegetable)} + {getPrettyName(combo.cereal)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: c.bg }}>
                    Nutri-Score {combo.score} &mdash; {gradeLabels[combo.score]}
                  </p>
                  {combo.proteinGrams && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {combo.proteinGrams}g de prot&eacute;ines
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <section className="mt-16 rounded-2xl p-8 text-center" style={{ background: 'var(--color-text-main)' }}>
          <p className="text-2xl font-bold text-white mb-3">
            G&eacute;n&eacute;rez votre planning repas personnalis&eacute;
          </p>
          <p className="text-gray-400 mb-6">
            AssemblEat cr&eacute;e votre semaine de repas &eacute;quilibr&eacute;s avec le Nutri-Score int&eacute;gr&eacute;.
            Gratuit et sans inscription.
          </p>
          <a
            href="/app"
            className="inline-block px-8 py-3.5 rounded-full font-semibold text-lg text-white hover:opacity-90 transition shadow-lg"
            style={{ background: 'var(--color-cta)' }}
          >
            Essayer assemblEAT gratuitement →
          </a>
          <p className="mt-3 text-sm text-gray-500">
            Gratuit &middot; Aucune carte requise
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-400">
          AssemblEat &copy; 2026 &middot;{' '}
          <Link href="/" className="hover:text-gray-600 transition">Accueil</Link>
        </p>
      </footer>
    </div>
  );
}
