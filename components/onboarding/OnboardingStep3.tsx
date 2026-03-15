'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

const DIET_OPTIONS = [
  { value: 'aucun', labelKey: 'step3.diets.none' },
  { value: 'vegetarien', labelKey: 'step3.diets.vegetarian' },
  { value: 'vegetalien', labelKey: 'step3.diets.vegan' },
  { value: 'pescetarien', labelKey: 'step3.diets.pescatarian' },
  { value: 'sans_gluten', labelKey: 'step3.diets.glutenFree' },
  { value: 'sans_lactose', labelKey: 'step3.diets.lactoseFree' },
  { value: 'halal', labelKey: 'step3.diets.halal' },
  { value: 'casher', labelKey: 'step3.diets.kosher' },
] as const;

const ALLERGY_SUGGESTIONS = [
  'gluten', 'lactose', 'noix', 'arachides', 'soja', 'oeufs', 'poisson', 'crustacés', 'sésame', 'céleri'
];

interface OnboardingStep3Props {
  diets: string[];
  allergies: string[];
  onChange: (data: { diets: string[]; allergies: string[] }) => void;
}

export function OnboardingStep3({ diets, allergies, onChange }: OnboardingStep3Props) {
  const t = useTranslations('onboarding');
  const [allergyInput, setAllergyInput] = useState('');

  const toggleDiet = (value: string) => {
    if (value === 'aucun') {
      onChange({ diets: [], allergies });
      return;
    }
    const updated = diets.includes(value)
      ? diets.filter((d) => d !== value)
      : [...diets, value];
    onChange({ diets: updated, allergies });
  };

  const addAllergy = (allergen: string) => {
    const trimmed = allergen.trim().toLowerCase();
    if (!trimmed || allergies.includes(trimmed)) return;
    onChange({ diets, allergies: [...allergies, trimmed] });
    setAllergyInput('');
  };

  const removeAllergy = (allergen: string) => {
    onChange({ diets, allergies: allergies.filter((a) => a !== allergen) });
  };

  const handleNoRestrictions = () => {
    onChange({ diets: [], allergies: [] });
  };

  const handleAllergyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAllergy(allergyInput);
    }
    if (e.key === 'Backspace' && !allergyInput && allergies.length > 0) {
      removeAllergy(allergies[allergies.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t('step3.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('step3.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">{t('step3.dietsLabel')}</label>
        <div className="grid grid-cols-2 gap-2">
          {DIET_OPTIONS.map((diet) => {
            const isSelected = diet.value === 'aucun'
              ? diets.length === 0
              : diets.includes(diet.value);
            return (
              <button
                key={diet.value}
                type="button"
                onClick={() => toggleDiet(diet.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-all ${
                  isSelected
                    ? 'border-[var(--color-meal-breakfast)] bg-[var(--color-meal-breakfast)]/10 font-medium'
                    : 'border-border bg-card hover:border-[var(--color-meal-breakfast)]/40'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected
                      ? 'border-[var(--color-meal-breakfast)] bg-[var(--color-meal-breakfast)]'
                      : 'border-muted-foreground'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {t(diet.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">{t('step3.allergiesLabel')}</label>

        <div className="min-h-[42px] flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 transition-all">
          {allergies.map((allergen) => (
            <span
              key={allergen}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-meal-breakfast)]/15 text-[var(--color-meal-breakfast)] border border-[var(--color-meal-breakfast)]/30"
            >
              {allergen}
              <button
                type="button"
                onClick={() => removeAllergy(allergen)}
                className="hover:text-red-500 transition-colors ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={handleAllergyKeyDown}
            placeholder={allergies.length === 0 ? t('step3.allergiesPlaceholder') : ''}
            className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>

        {ALLERGY_SUGGESTIONS.filter((s) => !allergies.includes(s)).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ALLERGY_SUGGESTIONS.filter((s) =>
              !allergies.includes(s) &&
              (allergyInput.length === 0 || s.includes(allergyInput.toLowerCase()))
            ).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addAllergy(suggestion)}
                className="px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleNoRestrictions}
        className="self-start"
      >
        {t('step3.noRestrictions')}
      </Button>
    </div>
  );
}
