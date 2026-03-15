'use client';

import { useTranslations } from 'next-intl';

const AVATAR_EMOJIS = ['🥑', '🍳', '🥗', '🍜', '🥩', '🐟', '🧀', '🥕', '🍎', '🥜', '🌮', '🍕'];

interface OnboardingStep1Props {
  firstName: string;
  avatarEmoji: string;
  onChange: (data: { firstName: string; avatarEmoji: string }) => void;
}

export function OnboardingStep1({ firstName, avatarEmoji, onChange }: OnboardingStep1Props) {
  const t = useTranslations('onboarding');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t('step1.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('step1.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{t('step1.firstNameLabel')}</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => onChange({ firstName: e.target.value, avatarEmoji })}
          placeholder={t('step1.firstNamePlaceholder')}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">{t('step1.avatarLabel')}</label>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange({ firstName, avatarEmoji: emoji })}
              className={`h-12 w-full rounded-xl text-2xl flex items-center justify-center transition-all border-2 ${
                avatarEmoji === emoji
                  ? 'border-[var(--color-meal-breakfast)] bg-[var(--color-meal-breakfast)]/10 ring-2 ring-[var(--color-meal-breakfast)]/30'
                  : 'border-border bg-card hover:border-[var(--color-meal-breakfast)]/50'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
