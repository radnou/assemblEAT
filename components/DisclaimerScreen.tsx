'use client';

import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

export function DisclaimerScreen() {
  const [, setAccepted] = useLocalStorage('assembleat-disclaimer-accepted', false);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-5">
        <div className="text-center">
          <span className="text-4xl">&#x2695;&#xFE0F;</span>
          <h2 className="text-xl font-bold mt-3">Information importante</h2>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          assemblEAT est un outil d&apos;aide à la planification de repas. Il ne remplace pas un
          suivi médical ou diététique professionnel.
        </p>

        <ul className="text-sm text-gray-600 leading-relaxed space-y-2">
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>
              Si vous avez un objectif de perte de poids supérieur à 5 kg, consultez un
              professionnel de santé.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>
              Non adapté sans avis médical aux femmes enceintes, personnes diabétiques ou sous
              traitement.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">•</span>
            <span>
              Les scores nutritionnels sont indicatifs et basés sur une adaptation du Nutri-Score v2.
            </span>
          </li>
        </ul>

        <p className="text-xs text-gray-400 leading-relaxed">
          En utilisant cette application, vous reconnaissez avoir pris connaissance de ces
          informations.
        </p>

        <button
          onClick={() => setAccepted(true)}
          className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--color-cta)' }}
        >
          J&apos;ai compris, continuer
        </button>
      </div>
    </div>
  );
}
