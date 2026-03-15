'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingStep1 } from './OnboardingStep1';
import { OnboardingStep2 } from './OnboardingStep2';
import { OnboardingStep3 } from './OnboardingStep3';
import { OnboardingStep4 } from './OnboardingStep4';
import { OnboardingStep5 } from './OnboardingStep5';
import { OnboardingStepFoodPrefs } from './OnboardingStepFoodPrefs';
import type { FoodPreference } from './OnboardingStepFoodPrefs';
import type { UserProfile, MealType } from '@/types';
import Link from 'next/link';

const TOTAL_STEPS = 6;

const DEFAULT_PROFILE: UserProfile = {
  firstName: '',
  avatarEmoji: '🥗',
  language: 'fr',
  rules: { antiRedundancy: true, starchWarning: true },
  objective: 'balanced',
  diets: [],
  allergies: [],
  householdSize: 1,
  cookingTime: 'moderate',
  mealsToTrack: ['lunch', 'dinner'] as MealType[],
  onboardingCompleted: false,
  foodPreferences: [],
};

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const t = useTranslations('onboarding');
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    onComplete({ ...DEFAULT_PROFILE, onboardingCompleted: true });
  };

  const handleComplete = () => {
    setShowSavePrompt(true);
  };

  const canProceed = (): boolean => {
    if (step === 1) return profile.firstName.trim().length > 0;
    if (step === 2) return Boolean(profile.objective);
    return true;
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] max-w-md mx-auto px-4 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-16">
          {step > 1 && (
            <button
              onClick={goBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {t('back')}
            </button>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          {step}/{TOTAL_STEPS}
        </div>
        <div className="w-16 flex justify-end">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('skip')}
          </button>
        </div>
      </div>

      <OnboardingProgress currentStep={step} totalSteps={TOTAL_STEPS} />

      <div className="flex-1 mt-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 1 && (
              <OnboardingStep1
                firstName={profile.firstName}
                avatarEmoji={profile.avatarEmoji}
                onChange={(data) => setProfile((p) => ({ ...p, ...data }))}
              />
            )}
            {step === 2 && (
              <OnboardingStep2
                value={profile.objective}
                onChange={(objective) =>
                  setProfile((p) => ({ ...p, objective: objective as UserProfile['objective'] }))
                }
              />
            )}
            {step === 3 && (
              <OnboardingStep3
                diets={profile.diets}
                allergies={profile.allergies}
                onChange={(data) => setProfile((p) => ({ ...p, ...data }))}
              />
            )}
            {step === 4 && (
              <OnboardingStepFoodPrefs
                preferences={(profile.foodPreferences ?? []) as FoodPreference[]}
                onChange={(prefs) =>
                  setProfile((p) => ({
                    ...p,
                    foodPreferences: prefs.map((fp) => ({ id: fp.id, rating: fp.rating })),
                  }))
                }
              />
            )}
            {step === 5 && (
              <OnboardingStep4
                householdSize={profile.householdSize}
                cookingTime={profile.cookingTime}
                mealsToTrack={profile.mealsToTrack}
                onChange={(data) =>
                  setProfile((p) => ({
                    ...p,
                    householdSize: data.householdSize,
                    cookingTime: data.cookingTime as UserProfile['cookingTime'],
                    mealsToTrack: data.mealsToTrack,
                  }))
                }
              />
            )}
            {step === 6 && (
              <OnboardingStep5 profile={profile} onComplete={handleComplete} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step < TOTAL_STEPS && (
        <div className="mt-6">
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            size="lg"
            className="w-full h-12 text-base font-semibold"
          >
            {t('next')}
          </Button>
        </div>
      )}

      {/* Save prompt overlay — shown after the last step, before calling onComplete */}
      <AnimatePresence>
        {showSavePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-bold mb-2">Votre profil est prêt !</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Créez un compte gratuit pour sauvegarder vos préférences — sinon elles seront
                perdues si vous fermez l&apos;onglet.
              </p>
              <Link
                href="/app/login"
                className="block w-full py-3 rounded-xl font-semibold text-white mb-3 transition hover:opacity-90"
                style={{ background: 'var(--color-cta)' }}
              >
                Créer un compte →
              </Link>
              <button
                onClick={() => {
                  setShowSavePrompt(false);
                  onComplete({ ...profile, onboardingCompleted: true });
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition underline-offset-2 hover:underline"
              >
                Continuer sans compte
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
