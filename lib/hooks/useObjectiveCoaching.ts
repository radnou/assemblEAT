'use client';

import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

interface Objective {
  label: string;
  startDate: string;
  durationDays: number;
}

export function useObjectiveCoaching() {
  const [objective, setObjective] = useLocalStorage<Objective | null>('assembleat-objective', null);

  if (!objective) {
    return {
      hasObjective: false as const,
      setObjective: (obj: Objective) => setObjective(obj),
    };
  }

  const start = new Date(objective.startDate);
  const today = new Date();
  const daysPassed = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  const progress = Math.min(Math.max(daysPassed / objective.durationDays, 0), 1);
  const percentage = Math.round(progress * 100);

  let message: string;
  if (percentage >= 100) message = 'Objectif atteint ! Fixe un nouveau défi ?';
  else if (percentage >= 80) message = 'Dernière ligne droite !';
  else if (percentage >= 50) message = 'Plus de la moitié ! Continue';
  else if (percentage >= 20) message = 'Tu prends le rythme';
  else message = 'Tu démarres bien !';

  return {
    hasObjective: true as const,
    objective,
    daysPassed,
    daysTotal: objective.durationDays,
    progress,
    percentage,
    message,
    setObjective: (obj: Objective) => setObjective(obj),
    clearObjective: () => setObjective(null),
  };
}
