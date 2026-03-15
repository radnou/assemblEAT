'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UserProfile, AssemblyRow } from '@/types';
import { generateRandomAssembly } from '@/lib/engine/assemblyEngine';

interface OnboardingStep5Props {
  profile: UserProfile;
  onComplete: () => void;
}

const OBJECTIVE_LABELS: Record<string, string> = {
  balanced: '🎯 Équilibré',
  time_saving: '⏱️ Gain de temps',
  weight_loss: '📉 Perte de poids',
  more_protein: '💪 Plus de protéines',
  less_meat: '🌱 Moins de viande',
};

const COOKING_TIME_LABELS: Record<string, string> = {
  express: '⭐ Express',
  moderate: '⭐⭐ Rapide',
  batch: '⭐⭐⭐ Batch cook',
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
};

function AssemblyPreview({ assembly }: { assembly: AssemblyRow }) {
  const parts = [
    assembly.protein?.name,
    assembly.vegetable?.name,
    assembly.cereal?.name,
    assembly.sauce?.name,
  ].filter(Boolean);

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="text-xs text-muted-foreground mb-2 font-medium">Premier assemblage suggéré</div>
      <div className="flex flex-wrap gap-1.5">
        {parts.map((part, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-meal-breakfast)]/15 text-[var(--color-meal-breakfast)] border border-[var(--color-meal-breakfast)]/30 font-medium"
          >
            {part}
          </span>
        ))}
      </div>
    </div>
  );
}

export function OnboardingStep5({ profile, onComplete }: OnboardingStep5Props) {
  const t = useTranslations('onboarding');

  const firstAssembly = useMemo(() => {
    return generateRandomAssembly('lunch', {
      diets: profile.diets,
      allergies: profile.allergies,
      objective: profile.objective,
    });
  }, [profile.diets, profile.allergies, profile.objective]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-4xl mb-3">{profile.avatarEmoji || '🥗'}</div>
        <h2 className="text-2xl font-bold mb-1">
          {t('step5.title', { name: profile.firstName || '' })}
        </h2>
        <p className="text-muted-foreground text-sm">{t('step5.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-sm font-medium">{t('step5.summaryLabel')}</div>
        <div className="flex flex-wrap gap-2">
          {profile.objective && (
            <Badge variant="secondary">{OBJECTIVE_LABELS[profile.objective] ?? profile.objective}</Badge>
          )}
          {profile.cookingTime && (
            <Badge variant="outline">{COOKING_TIME_LABELS[profile.cookingTime] ?? profile.cookingTime}</Badge>
          )}
          <Badge variant="outline">
            {'👥 '}
            {profile.householdSize} {profile.householdSize > 1 ? 'personnes' : 'personne'}
          </Badge>
          {profile.mealsToTrack.map((m) => (
            <Badge key={m} variant="outline">{MEAL_LABELS[m] ?? m}</Badge>
          ))}
          {profile.diets.map((d) => (
            <Badge key={d} variant="secondary">{d}</Badge>
          ))}
          {profile.allergies.map((a) => (
            <Badge key={a} variant="destructive">{a}</Badge>
          ))}
        </div>
      </div>

      {firstAssembly && <AssemblyPreview assembly={firstAssembly} />}

      <Button
        onClick={onComplete}
        size="lg"
        className="w-full mt-2 h-12 text-base font-semibold"
      >
        {t('step5.cta')}
      </Button>
    </div>
  );
}
