import { decodeShareData } from '@/lib/share/shareEngine';
import Link from 'next/link';

interface Props {
  params: Promise<{ data: string }>;
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const PLEASURE_EMOJI: Record<number, string> = {
  1: '😕',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🤩',
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
      </main>

      {/* Footer */}
      <footer className="text-center py-6 px-4 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-400 mb-2">Créé avec AssemblEat</p>
        <Link
          href="/"
          className="text-sm font-semibold text-[#2E4057] hover:underline"
        >
          Essayer gratuitement →
        </Link>
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

  return {
    title: `Semainier de ${shareData.userName} — AssemblEat`,
    description: `Découvrez le plan repas de ${shareData.userName} pour la semaine ${shareData.weekKey}.`,
  };
}
