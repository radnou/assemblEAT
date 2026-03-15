'use client';

import { useState } from 'react';
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
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showInputs, setShowInputs] = useState<Record<string, boolean>>({});

  const effectivePrefs: FoodPreference[] =
    preferences.length > 0 ? preferences : DEFAULT_PREFERENCES;

  const getRating = (id: string): Rating => {
    return effectivePrefs.find((p) => p.id === id)?.rating ?? 'neutral';
  };

  const handleRate = (id: string, rating: Rating) => {
    const base = effectivePrefs.length > 0 ? effectivePrefs : DEFAULT_PREFERENCES;
    const updated = base.map((p) => (p.id === id ? { ...p, rating } : p));
    // If the item wasn't in the list yet, find and add it
    if (!updated.find((p) => p.id === id)) {
      const ingredient = INGREDIENTS.find((i) => i.id === id);
      if (ingredient) {
        updated.push({ ...ingredient, rating });
      }
    }
    onChange(updated);
  };

  const addCustomFood = (sectionLabel: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const sectionTag = sectionLabel.toLowerCase();
    const id = `custom-${sectionTag}-${trimmed.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newItem: FoodPreference = { id, name: trimmed, emoji: '🍽️', rating: 'neutral' };
    const base = effectivePrefs.length > 0 ? effectivePrefs : DEFAULT_PREFERENCES;
    onChange([...base, newItem]);
    setCustomInputs((prev) => ({ ...prev, [sectionLabel]: '' }));
  };

  const handleCustomKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    sectionLabel: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomFood(sectionLabel, customInputs[sectionLabel] ?? '');
    }
    if (e.key === 'Escape') {
      setShowInputs((prev) => ({ ...prev, [sectionLabel]: false }));
      setCustomInputs((prev) => ({ ...prev, [sectionLabel]: '' }));
    }
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
          const baseItems = INGREDIENTS.filter((i) => section.ids.includes(i.id));
          const sectionTag = section.label.toLowerCase();
          const customItems = effectivePrefs.filter((p) =>
            p.id.startsWith(`custom-${sectionTag}-`)
          );
          const allItems = [...baseItems.map((i) => ({ ...i, rating: getRating(i.id) })), ...customItems];
          const isShowingInput = showInputs[section.label] ?? false;
          const inputValue = customInputs[section.label] ?? '';

          return (
            <div key={section.label}>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {section.label}
              </div>
              <div className="flex flex-col gap-2">
                {allItems.map((ingredient) => {
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

                {/* Add custom food */}
                <div className="mt-1">
                  {isShowingInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) =>
                          setCustomInputs((prev) => ({ ...prev, [section.label]: e.target.value }))
                        }
                        onKeyDown={(e) => handleCustomKeyDown(e, section.label)}
                        placeholder={`Ajouter un aliment…`}
                        autoFocus
                        className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      />
                      <button
                        type="button"
                        onClick={() => addCustomFood(section.label, inputValue)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-cta)] text-white hover:opacity-90 transition"
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInputs((prev) => ({ ...prev, [section.label]: false }));
                          setCustomInputs((prev) => ({ ...prev, [section.label]: '' }));
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setShowInputs((prev) => ({ ...prev, [section.label]: true }))
                      }
                      className="text-xs text-[var(--color-cta)] hover:underline"
                    >
                      + Ajouter un aliment
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
