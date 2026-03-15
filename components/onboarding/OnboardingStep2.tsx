'use client';

import { useTranslations } from 'next-intl';

const OBJECTIVES = [
  { value: 'balanced', emoji: '🎯', labelKey: 'step2.balanced' },
  { value: 'time_saving', emoji: '⏱️', labelKey: 'step2.timeSaving' },
  { value: 'weight_loss', emoji: '📉', labelKey: 'step2.weightLoss' },
  { value: 'more_protein', emoji: '💪', labelKey: 'step2.moreProtein' },
  { value: 'less_meat', emoji: '🌱', labelKey: 'step2.lessMeat' },
] as const;

interface OnboardingStep2Props {
  value: string;
  onChange: (objective: string) => void;
}

export function OnboardingStep2({ value, onChange }: OnboardingStep2Props) {
  const t = useTranslations('onboarding');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t('step2.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('step2.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3">
        {OBJECTIVES.map((obj) => (
          <button
            key={obj.value}
            type="button"
            onClick={() => onChange(obj.value)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              value === obj.value
                ? 'border-[var(--color-meal-breakfast)] bg-[var(--color-meal-breakfast)]/10'
                : 'border-border bg-card hover:border-[var(--color-meal-breakfast)]/50'
            }`}
          >
            <span className="text-2xl">{obj.emoji}</span>
            <span className="font-medium text-sm">{t(obj.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
