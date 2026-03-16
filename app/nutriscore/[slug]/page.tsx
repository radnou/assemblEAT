import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getTopCombinations,
  getCombinationBySlug,
  getRelatedCombinations,
  getPrettyName,
} from '@/lib/seo/combinations';
import type { NutriGrade } from '@/types';

// ─── Static generation ─────────────────────────────

export function generateStaticParams() {
  return getTopCombinations().map((c) => ({ slug: c.slug }));
}

// ─── Metadata ───────────────────────────────────────

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const combo = getCombinationBySlug(slug);
  if (!combo) return {};

  const protein = getPrettyName(combo.protein);
  const vegetable = getPrettyName(combo.vegetable);
  const cereal = getPrettyName(combo.cereal);

  const title = `Nutri-Score ${protein} + ${vegetable} + ${cereal} | assemblEAT`;
  const description = `D\u00E9couvrez le Nutri-Score de l\u2019assemblage ${protein} + ${vegetable} + ${cereal}. Score ${combo.score}. Planifiez vos repas avec assemblEAT.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

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

function ScoreBadge({ grade, size = 'lg' }: { grade: NutriGrade; size?: 'sm' | 'lg' }) {
  const colors = gradeColors[grade];
  const sizeClasses = size === 'lg'
    ? 'w-20 h-20 text-4xl'
    : 'w-10 h-10 text-lg';

  return (
    <span
      className={`${sizeClasses} rounded-2xl flex items-center justify-center font-black`}
      style={{ background: colors.bg, color: colors.text }}
    >
      {grade}
    </span>
  );
}

function getScoreExplanation(combo: ReturnType<typeof getCombinationBySlug>): string {
  if (!combo) return '';
  const grade = combo.score;

  if (grade === 'A' || grade === 'B') {
    return `Cet assemblage obtient un excellent Nutri-Score ${grade} gr\u00E2ce \u00E0 un bon \u00E9quilibre entre prot\u00E9ines, fibres et faible teneur en graisses satur\u00E9es et en sel. Les l\u00E9gumes apportent des fibres et des micronutriments qui am\u00E9liorent le score global.`;
  }
  if (grade === 'C') {
    return `Cet assemblage obtient un Nutri-Score ${grade}, ce qui est correct. Le score pourrait \u00EAtre am\u00E9lior\u00E9 en augmentant la part de l\u00E9gumes ou en choisissant des f\u00E9culents complets.`;
  }
  return `Cet assemblage obtient un Nutri-Score ${grade}. Il est possible d\u2019am\u00E9liorer ce score en choisissant des ingr\u00E9dients moins gras, moins sal\u00E9s et plus riches en fibres.`;
}

function getImprovementTip(combo: ReturnType<typeof getCombinationBySlug>): string | null {
  if (!combo) return null;

  const { protein, vegetable, cereal } = combo.components;
  const worstComponent = [protein, vegetable, cereal].sort((a, b) => b.score - a.score)[0];

  if (worstComponent.ciqualId === protein.ciqualId && protein.grade !== 'A') {
    return 'Remplacer la prot\u00E9ine par des lentilles ou du tofu pour un meilleur Nutri-Score.';
  }
  if (worstComponent.ciqualId === cereal.ciqualId && cereal.grade !== 'A') {
    return 'Essayer la patate douce ou le quinoa pour am\u00E9liorer le Nutri-Score du f\u00E9culent.';
  }
  if (combo.score === 'A') {
    return null; // Already optimal
  }
  return 'Augmenter la portion de l\u00E9gumes pour un meilleur \u00E9quilibre nutritionnel.';
}

// ─── Page component ─────────────────────────────────

export default async function NutriScoreDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const combo = getCombinationBySlug(slug);
  if (!combo) notFound();

  const protein = getPrettyName(combo.protein);
  const vegetable = getPrettyName(combo.vegetable);
  const cereal = getPrettyName(combo.cereal);
  const related = getRelatedCombinations(slug, 4);
  const tip = getImprovementTip(combo);
  const colors = gradeColors[combo.score];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[var(--color-text-main)]">
            🥗 AssemblEat
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/nutriscore"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Toutes les combinaisons
            </Link>
            <a
              href="/app"
              className="px-4 py-1.5 rounded-full bg-[var(--color-cta)] text-white font-semibold text-sm hover:opacity-90 transition"
            >
              Essayer l&apos;app
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600 transition">Accueil</Link>
          {' / '}
          <Link href="/nutriscore" className="hover:text-gray-600 transition">Nutri-Score</Link>
          {' / '}
          <span className="text-gray-600">{protein} + {vegetable} + {cereal}</span>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-main)] mb-6">
            Nutri-Score de {protein} + {vegetable} + {cereal}
          </h1>

          <div className="flex flex-col items-center gap-3">
            <ScoreBadge grade={combo.score} size="lg" />
            <div className="text-lg font-semibold" style={{ color: colors.bg }}>
              {gradeLabels[combo.score]}
            </div>
            {combo.proteinGrams && (
              <p className="text-sm text-gray-500">
                {combo.proteinGrams}g de proteines par portion
              </p>
            )}
          </div>
        </div>

        {/* Component breakdown */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-4">
            Score par composant
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Proteine', data: combo.components.protein, slug: combo.protein },
              { label: 'Legume', data: combo.components.vegetable, slug: combo.vegetable },
              { label: 'Feculent', data: combo.components.cereal, slug: combo.cereal },
            ].map(({ label, data }) => {
              const c = gradeColors[data.grade];
              return (
                <div
                  key={label}
                  className="rounded-xl p-5 border border-gray-100"
                  style={{ background: c.light }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    {label}
                  </p>
                  <div className="flex items-center gap-3">
                    <ScoreBadge grade={data.grade} size="sm" />
                    <div>
                      <p className="font-semibold text-[var(--color-text-main)]">
                        {getPrettyName(
                          label === 'Proteine'
                            ? combo.protein
                            : label === 'Legume'
                              ? combo.vegetable
                              : combo.cereal,
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Nutri-Score {data.grade}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Explanation */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-3">
            Pourquoi ce score ?
          </h2>
          <div
            className="rounded-xl p-6 border border-gray-100"
            style={{ background: colors.light }}
          >
            <p className="text-gray-600 leading-relaxed">
              {getScoreExplanation(combo)}
            </p>
          </div>
        </section>

        {/* Improvement tip */}
        {tip && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-3">
              Pour ameliorer ce score
            </h2>
            <div className="rounded-xl p-6 border border-gray-100 bg-[#F8F9FA]">
              <p className="text-gray-600 leading-relaxed">
                💡 {tip}
              </p>
            </div>
          </section>
        )}

        {/* Related combinations */}
        {related.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-4">
              Voir aussi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map((r) => {
                const rc = gradeColors[r.score];
                return (
                  <Link
                    key={r.slug}
                    href={`/nutriscore/${r.slug}`}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:shadow-md transition bg-white"
                  >
                    <ScoreBadge grade={r.score} size="sm" />
                    <div>
                      <p className="font-semibold text-sm text-[var(--color-text-main)]">
                        {getPrettyName(r.protein)} + {getPrettyName(r.vegetable)} + {getPrettyName(r.cereal)}
                      </p>
                      <p className="text-xs" style={{ color: rc.bg }}>
                        Score {r.score} - {gradeLabels[r.score]}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-2xl p-8 text-center" style={{ background: 'var(--color-text-main)' }}>
          <p className="text-2xl font-bold text-white mb-3">
            Generez un plan repas complet avec des combinaisons Nutri-Score A
          </p>
          <p className="text-gray-400 mb-6">
            Planning personnalise, batch cook, liste de courses - tout en automatique.
          </p>
          <a
            href="/app"
            className="inline-block px-8 py-3.5 rounded-full font-semibold text-lg text-white hover:opacity-90 transition shadow-lg"
            style={{ background: 'var(--color-cta)' }}
          >
            Essayer assemblEAT gratuitement →
          </a>
          <p className="mt-3 text-sm text-gray-500">
            Gratuit · Aucune carte requise
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-400">
          AssemblEat &copy; 2026 &middot;{' '}
          <Link href="/" className="hover:text-gray-600 transition">Accueil</Link>
          {' '}&middot;{' '}
          <Link href="/nutriscore" className="hover:text-gray-600 transition">Nutri-Score</Link>
        </p>
      </footer>
    </div>
  );
}
