'use client';

import { useTranslations } from 'next-intl';
import type { MealType } from '@/types';

const COOKING_TIMES = [
  { value: 'express', stars: '⭐', labelKey: 'step4.express' },
  { value: 'moderate', stars: '⭐⭐', labelKey: 'step4.moderate' },
  { value: 'batch', stars: '⭐⭐⭐', labelKey: 'step4.batch' },
] as const;

const MEAL_OPTIONS: { value: MealType; labelKey: string }[] = [
  { value: 'breakfast', labelKey: 'step4.breakfast' },
  { value: 'lunch', labelKey: 'step4.lunch' },
  { value: 'dinner', labelKey: 'step4.dinner' },
];

interface OnboardingStep4Props {
  householdSize: number;
  cookingTime: string;
  mealsToTrack: MealType[];
  onChange: (data: { householdSize: number; cookingTime: string; mealsToTrack: MealType[] }) => void;
}

export function OnboardingStep4({ householdSize, cookingTime, mealsToTrack, onChange }: OnboardingStep4Props) {
  const t = useTranslations('onboarding');

  const toggleMeal = (meal: MealType) => {
    const updated = mealsToTrack.includes(meal)
      ? mealsToTrack.filter((m) => m !== meal)
      : [...mealsToTrack, meal];
    onChange({ householdSize, cookingTime, mealsToTrack: updated });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t('step4.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('step4.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">{t('step4.householdLabel')}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ householdSize: n, cookingTime, mealsToTrack })}
              className={`h-10 w-10 rounded-xl font-semibold text-sm border-2 transition-all ${
                householdSize === n
                  ? 'border-[var(--color-meal-breakfast)] bg-[var(--color-meal-breakfast)]/10 text-[var(--color-meal-breakfast)]'
                  : 'border-border bg-card hover:border-[var(--color-meal-breakfast)]/50'
              }`}
            >
              {n === 6 ? '6+' : n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">{t('step4.cookingTimeLabel')}</label>
        <div className="flex flex-col gap-2">
          {COOKING_TIMES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => onChange({ householdSize, cookingTime: ct.value, mealsToTrack })}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                cookingTime === ct.value
                  ? 'border-[var(--color-meal-breakfast)] bg-[var(--color-meal-breakfast)]/10'
                  : 'border-border bg-card hover:border-[var(--color-meal-breakfast)]/40'
              }`}
            >
              <span className="text-base min-w-[50px]">{ct.stars}</span>
              <span className="text-sm font-medium">{t(ct.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">{t('step4.mealsLabel')}</label>
        <div className="flex flex-col gap-2">
          {MEAL_OPTIONS.map((meal) => {
            const isSelected = mealsToTrack.includes(meal.value);
            return (
              <button
                key={meal.value}
                type="button"
                onClick={() => toggleMeal(meal.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left text-sm transition-all ${
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
                {t(meal.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
