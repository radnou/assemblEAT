'use client';

import { motion } from 'framer-motion';

export interface FoodPreference {
  id: string;
  name: string;
  emoji: string;
  rating: 'like' | 'neutral' | 'dislike';
}

interface OnboardingStepFoodPrefsProps {
  preferences: FoodPreference[];
  onChange: (preferences: FoodPreference[]) => void;
}

const INGREDIENTS: Omit<FoodPreference, 'rating'>[] = [
  // Protéines
  { id: 'poulet', name: 'Poulet', emoji: '🍗' },
  { id: 'thon', name: 'Thon', emoji: '🐟' },
  { id: 'oeufs', name: 'Œufs', emoji: '🥚' },
  { id: 'lentilles', name: 'Lentilles', emoji: '🫘' },
  { id: 'saumon', name: 'Saumon', emoji: '🐠' },
  { id: 'tofu', name: 'Tofu', emoji: '🧈' },
  // Légumes
  { id: 'brocolis', name: 'Brocolis', emoji: '🥦' },
  { id: 'courgettes', name: 'Courgettes', emoji: '🥒' },
  { id: 'carottes', name: 'Carottes', emoji: '🥕' },
  { id: 'haricots', name: 'Haricots verts', emoji: '🫛' },
  { id: 'epinards', name: 'Épinards', emoji: '🥬' },
  { id: 'tomates', name: 'Tomates', emoji: '🍅' },
  // Féculents
  { id: 'riz', name: 'Riz complet', emoji: '🍚' },
  { id: 'quinoa', name: 'Quinoa', emoji: '🌾' },
  { id: 'patate-douce', name: 'Patate douce', emoji: '🍠' },
  { id: 'semoule', name: 'Semoule', emoji: '🫓' },
  { id: 'pates', name: 'Pâtes complètes', emoji: '🍝' },
];

const SECTIONS: { label: string; ids: string[] }[] = [
  {
    label: 'Protéines',
    ids: ['poulet', 'thon', 'oeufs', 'lentilles', 'saumon', 'tofu'],
  },
  {
    label: 'Légumes',
    ids: ['brocolis', 'courgettes', 'carottes', 'haricots', 'epinards', 'tomates'],
  },
  {
    label: 'Féculents',
    ids: ['riz', 'quinoa', 'patate-douce', 'semoule', 'pates'],
  },
];

const DEFAULT_PREFERENCES: FoodPreference[] = INGREDIENTS.map((ing) => ({
  ...ing,
  rating: 'neutral',
}));

type Rating = 'like' | 'neutral' | 'dislike';

const RATING_BUTTONS: { value: Rating; emoji: string; label: string }[] = [
  { value: 'like', emoji: '👍', label: "J'aime" },
  { value: 'neutral', emoji: '😐', label: 'Neutre' },
  { value: 'dislike', emoji: '👎', label: 'Bof' },
];

const RATING_STYLES: Record<Rating, string> = {
  like: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40',
  neutral: 'bg-muted text-muted-foreground border-border',
  dislike: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40',
};

export function OnboardingStepFoodPrefs({ preferences, onChange }: OnboardingStepFoodPrefsProps) {
  const effectivePrefs: FoodPreference[] =
    preferences.length > 0 ? preferences : DEFAULT_PREFERENCES;

  const getRating = (id: string): Rating => {
    return effectivePrefs.find((p) => p.id === id)?.rating ?? 'neutral';
  };

  const handleRate = (id: string, rating: Rating) => {
    const ingredient = INGREDIENTS.find((i) => i.id === id);
    if (!ingredient) return;

    const base = effectivePrefs.length > 0 ? effectivePrefs : DEFAULT_PREFERENCES;
    const updated = base.map((p) => (p.id === id ? { ...p, rating } : p));
    // If the ingredient wasn't in the list yet, add it
    if (!updated.find((p) => p.id === id)) {
      updated.push({ ...ingredient, rating });
    }
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Tes goûts</h2>
        <p className="text-muted-foreground text-sm">
          Dis-nous ce que tu aimes pour personnaliser tes repas
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {SECTIONS.map((section) => {
          const items = INGREDIENTS.filter((i) => section.ids.includes(i.id));
          return (
            <div key={section.label}>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {section.label}
              </div>
              <div className="flex flex-col gap-2">
                {items.map((ingredient) => {
                  const currentRating = getRating(ingredient.id);
                  return (
                    <div
                      key={ingredient.id}
                      className="flex items-center justify-between py-2 px-3 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl flex-shrink-0">{ingredient.emoji}</span>
                        <span className="text-sm font-medium truncate">{ingredient.name}</span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        {RATING_BUTTONS.map((btn) => {
                          const isSelected = currentRating === btn.value;
                          return (
                            <motion.button
                              key={btn.value}
                              onClick={() => handleRate(ingredient.id, btn.value)}
                              whileTap={{ scale: 0.85 }}
                              animate={isSelected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                              transition={{ duration: 0.2 }}
                              aria-label={btn.label}
                              className={`w-8 h-8 rounded-lg border text-base flex items-center justify-center transition-colors duration-150 ${
                                isSelected
                                  ? RATING_STYLES[btn.value]
                                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
                              }`}
                            >
                              {btn.emoji}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
