'use client';

import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

interface GuideState {
  currentStep: number;
  dismissed: boolean;
}

const GUIDE_STEPS = [
  { id: 1, content: 'Bienvenue ! Voici tes repas du jour. Découvre ton Nutri-Score sur chaque carte.' },
  { id: 2, content: 'Clique sur 🔄 pour régénérer un repas qui ne te plaît pas.' },
  { id: 3, content: 'Valide tes repas avec ✅ pour alimenter ton bilan hebdomadaire.' },
  { id: 4, content: 'Découvre ton Roast dans la section Bilan 🔥' },
  { id: 5, content: 'Ton premier score hebdo est prêt !' },
  { id: 6, content: 'Planifie ta semaine dans le Semainier 📅' },
  { id: 7, content: 'Tu maîtrises ! Le guide se retire. Bon appétit 🎉' },
];

export function useProgressiveGuide() {
  const [state, setState] = useLocalStorage<GuideState>('assembleat-guide', {
    currentStep: 0,
    dismissed: false,
  });

  const advance = (toStep: number) => {
    if (toStep > state.currentStep && !state.dismissed) {
      setState({ ...state, currentStep: toStep });
    }
  };

  const dismiss = () => setState({ ...state, dismissed: true });

  const currentGuide = !state.dismissed && state.currentStep >= 1 && state.currentStep <= 7
    ? GUIDE_STEPS[state.currentStep - 1]
    : null;

  return {
    currentGuide,
    step: state.currentStep,
    totalSteps: 7,
    advance,
    dismiss,
    isComplete: state.currentStep >= 8 || state.dismissed,
  };
}
