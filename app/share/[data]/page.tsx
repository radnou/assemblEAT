import { decodeShareData } from '@/lib/share/shareEngine';
import Link from 'next/link';

interface Props {
  params: Promise<{ data: string }>;
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const STATUS_ICON: Record<string, string> = {
  confirmed: '✅',
  different: '⚠️',
  skipped: '⏭️',
};

const PLEASURE_EMOJI: Record<number, string> = {
  1: '😕',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🤩',
};

const GRADE_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-[#037F2D]', text: 'text-white', label: 'Excellent' },
  B: { bg: 'bg-[#7DC243]', text: 'text-white', label: 'Bon' },
  C: { bg: 'bg-[#FFCC01]', text: 'text-gray-900', label: 'Correct' },
  D: { bg: 'bg-[#F5860F]', text: 'text-white', label: 'Limité' },
  E: { bg: 'bg-[#E63312]', text: 'text-white', label: 'À améliorer' },
};

export default async function SharePage({ params }: Props) {
  const { data: encoded } = await params;
  const shareData = decodeShareData(encoded);

  if (!shareData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-2xl mb-2">🥲</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Lien invalide ou expiré</h1>
        <p className="text-gray-500 text-sm mb-6">Ce lien ne correspond à aucun semainier.</p>
        <Link
          href="/"
          className="text-sm font-medium text-[#2E4057] underline underline-offset-2"
        >
          Retour à AssemblEat
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f6f2] flex flex-col">
      {/* Header */}
      <header className="bg-[#2E4057] text-white px-6 py-5">
        <p className="text-xs font-medium tracking-widest uppercase opacity-70 mb-1">Semainier partagé</p>
        <h1 className="text-xl font-semibold">
          {shareData.userName}
        </h1>
        <p className="text-sm opacity-75 mt-0.5">Semaine {shareData.weekKey}</p>
      </header>

      {/* Weekly balance score badge */}
      {shareData.grade && GRADE_BADGE_STYLES[shareData.grade] && (
        <div className="px-4 pt-5 pb-0 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
            <span
              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${GRADE_BADGE_STYLES[shareData.grade].bg} ${GRADE_BADGE_STYLES[shareData.grade].text}`}
            >
              {shareData.grade}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Indice d&apos;équilibre : {GRADE_BADGE_STYLES[shareData.grade].label}
              </p>
              <p className="text-xs text-gray-500">Score nutritionnel moyen de la semaine</p>
            </div>
          </div>
        </div>
      )}

      {/* Week grid */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-3">
        {shareData.days.map((day, i) => {
          const dayName = DAY_NAMES[i] ?? `Jour ${i + 1}`;
          const hasAny = day.b || day.l || day.d;

          return (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="bg-[#2E4057]/5 px-4 py-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-[#2E4057]">{dayName}</span>
              </div>

              {!hasAny ? (
                <div className="px-4 py-3 text-sm text-gray-400 italic">Non planifié</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {[
                    { label: 'Petit-déjeuner', items: day.b },
                    { label: 'Déjeuner', items: day.l },
                    { label: 'Dîner', items: day.d },
                  ].map(({ label, items }) =>
                    items ? (
                      <div key={label} className="px-4 py-2.5 flex items-start gap-3">
                        <span className="text-xs font-medium text-gray-400 w-28 shrink-0 pt-0.5">
                          {label}
                        </span>
                        <span className="text-sm text-gray-700 leading-snug">
                          {items.join(' · ')}
                        </span>
                      </div>
                    ) : (
                      <div key={label} className="px-4 py-2.5 flex items-start gap-3">
                        <span className="text-xs font-medium text-gray-400 w-28 shrink-0 pt-0.5">
                          {label}
                        </span>
                        <span className="text-sm text-gray-300 italic">Non planifié</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Feedback summary */}
        {shareData.feedbacks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Retours repas
            </p>
            <div className="flex flex-wrap gap-2">
              {shareData.feedbacks.map((fb, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1"
                >
                  <span>{PLEASURE_EMOJI[fb.p] ?? '—'}</span>
                  <span className="text-gray-500">{fb.d}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prévu vs Réel comparison */}
        {shareData.actuals && shareData.actuals.length > 0 && (() => {
          const actuals = shareData.actuals!;
          const confirmed = actuals.filter((a) => a.s === 'confirmed').length;
          const conformityRate = Math.round((confirmed / actuals.length) * 100);

          // Group actuals by date
          const byDate = new Map<string, typeof actuals>();
          for (const a of actuals) {
            const list = byDate.get(a.d) || [];
            list.push(a);
            byDate.set(a.d, list);
          }

          const MEAL_TYPE_LABEL: Record<string, string> = {
            breakfast: 'Petit-déjeuner',
            lunch: 'Déjeuner',
            dinner: 'Dîner',
          };

          return (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Prévu vs Réel</h3>

              {Array.from(byDate.entries()).map(([date, meals]) => (
                <div
                  key={date}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="bg-[#2E4057]/5 px-4 py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-[#2E4057]">{date}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {meals.map((m, j) => (
                      <div key={j} className="px-4 py-2.5 flex items-start gap-3">
                        <span className="text-base shrink-0">{STATUS_ICON[m.s] ?? '—'}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-gray-400">
                            {MEAL_TYPE_LABEL[m.t] ?? m.t}
                          </span>
                          <p className="text-sm text-gray-700">
                            {m.s === 'confirmed' && 'Comme prévu'}
                            {m.s === 'skipped' && 'Sauté'}
                            {m.s === 'different' && (m.desc || 'Autre chose')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="p-3 bg-blue-50 rounded-xl text-center text-sm">
                <span className="font-medium">Conformité : </span>
                <span>{conformityRate}%</span>
                <span className="text-muted-foreground"> · {actuals.length} repas notés</span>
              </div>
            </div>
          );
        })()}
      </main>

      {/* Viral CTA section */}
      <div className="mx-4 mb-6 max-w-2xl lg:mx-auto">
        <div className="p-6 bg-gradient-to-br from-green-50 to-orange-50 rounded-2xl text-center">
          <h2 className="text-xl font-bold mb-2">
            Envie de manger aussi bien ?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Génère ton propre plan repas avec Nutri-Score en 30 secondes — gratuit.
          </p>
          <a
            href="/app"
            className="inline-block px-6 py-3 bg-[var(--color-cta)] text-white font-semibold rounded-full hover:opacity-90 transition"
          >
            🚀 Essayer assemblEAT gratuitement
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            Déjà un compte ? <a href="/sign-in" className="underline">Se connecter</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 px-4 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-400">Créé avec AssemblEat</p>
      </footer>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { data: encoded } = await params;
  const shareData = decodeShareData(encoded);

  if (!shareData) {
    return { title: 'Lien invalide — AssemblEat' };
  }

  const title = `Plan repas de ${shareData.userName} — assemblEAT`;
  const description = 'Découvre le plan repas de la semaine avec Nutri-Score. Génère le tien gratuitement.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'assemblEAT',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
