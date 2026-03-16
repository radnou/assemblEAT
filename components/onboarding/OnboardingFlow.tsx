'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OnboardingProgress } from './OnboardingProgress';
import { AvatarGenerator } from './AvatarGenerator';
import { NutriGradeBadge } from '@/components/NutriGradeBadge';
import { generateRandomAssembly } from '@/lib/engine/assemblyEngine';
import type { UserProfile, MealType } from '@/types';
import Link from 'next/link';

const TOTAL_STEPS = 4;

const OBJECTIVES = [
  { value: 'balanced', label: 'Équilibré', emoji: '⚖️' },
  { value: 'weight_loss', label: 'Perte de poids', emoji: '🏃' },
  { value: 'more_protein', label: 'Prise de muscle', emoji: '💪' },
  { value: 'less_meat', label: 'Custom', emoji: '🎯' },
] as const;

const DIETS = [
  { value: 'aucun', label: 'Aucun' },
  { value: 'vegetarien', label: 'Végétarien' },
  { value: 'vegetalien', label: 'Végan' },
  { value: 'sans_gluten', label: 'Sans gluten' },
  { value: 'pescetarien', label: 'Pescétarien' },
];

const ALLERGIES = [
  { value: 'aucune', label: 'Aucune' },
  { value: 'arachides', label: 'Arachides' },
  { value: 'laitage', label: 'Lactose' },
  { value: 'oeufs', label: 'Œufs' },
  { value: 'fruits_de_mer', label: 'Crustacés' },
];

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
};

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [avatarColor, setAvatarColor] = useState(0);
  const [avatarEmoji, setAvatarEmoji] = useState(0);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  // Generate a sample lunch meal for the "Moment Aha" step
  const sampleMeal = useMemo(() => {
    return generateRandomAssembly('lunch', {
      diets: selectedDiets.filter((d) => d !== 'aucun'),
      allergies: selectedAllergies.filter((a) => a !== 'aucune'),
      objective: profile.objective,
    });
  }, [selectedDiets, selectedAllergies, profile.objective]);

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
    // Save avatar data to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'assembleat-avatar',
          JSON.stringify({ colorIndex: avatarColor, emojiIndex: avatarEmoji })
        );
      } catch {
        // localStorage full
      }
    }
    onComplete({
      ...profile,
      diets: selectedDiets.filter((d) => d !== 'aucun'),
      allergies: selectedAllergies.filter((a) => a !== 'aucune'),
      onboardingCompleted: true,
    });
  };

  const handleDietToggle = (value: string) => {
    if (value === 'aucun') {
      setSelectedDiets((prev) => (prev.includes('aucun') ? [] : ['aucun']));
    } else {
      setSelectedDiets((prev) => {
        const without = prev.filter((d) => d !== 'aucun');
        return without.includes(value)
          ? without.filter((d) => d !== value)
          : [...without, value];
      });
    }
  };

  const handleAllergyToggle = (value: string) => {
    if (value === 'aucune') {
      setSelectedAllergies((prev) => (prev.includes('aucune') ? [] : ['aucune']));
    } else {
      setSelectedAllergies((prev) => {
        const without = prev.filter((a) => a !== 'aucune');
        return without.includes(value)
          ? without.filter((a) => a !== value)
          : [...without, value];
      });
    }
  };

  const canProceed = (): boolean => {
    if (step === 1) return profile.firstName.trim().length > 0;
    if (step === 2) return Boolean(profile.objective);
    if (step === 3) return selectedAllergies.length > 0;
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
              ← Retour
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
            Passer
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
            {/* ─── Step 1: Identity ─── */}
            {step === 1 && (
              <div className="flex flex-col items-center gap-6">
                <h2 className="text-xl font-bold text-center">Comment tu t&apos;appelles ?</h2>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Ton prénom"
                  className="w-full max-w-xs px-4 py-3 rounded-xl border border-border bg-background text-center text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
                <AvatarGenerator
                  firstName={profile.firstName}
                  selectedColor={avatarColor}
                  selectedEmoji={avatarEmoji}
                  onColorChange={setAvatarColor}
                  onEmojiChange={setAvatarEmoji}
                />
              </div>
            )}

            {/* ─── Step 2: Objective ─── */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold text-center">Ton objectif principal</h2>
                <p className="text-sm text-muted-foreground text-center">
                  On adapte tes repas selon ton objectif.
                </p>
                <div className="flex flex-col gap-3">
                  {OBJECTIVES.map((obj) => (
                    <button
                      key={obj.value}
                      onClick={() =>
                        setProfile((p) => ({ ...p, objective: obj.value as UserProfile['objective'] }))
                      }
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        profile.objective === obj.value
                          ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                          : 'border-border bg-background hover:border-green-300'
                      }`}
                    >
                      <span className="text-2xl">{obj.emoji}</span>
                      <span className="font-medium">{obj.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Step 3: Diet & Allergies ─── */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold text-center">Régimes & allergies</h2>

                {/* Diets */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Régime alimentaire</h3>
                  <div className="flex flex-wrap gap-2">
                    {DIETS.map((diet) => (
                      <button
                        key={diet.value}
                        onClick={() => handleDietToggle(diet.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedDiets.includes(diet.value)
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-foreground hover:bg-green-100'
                        }`}
                      >
                        {diet.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Allergies <span className="text-red-500">*</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGIES.map((allergy) => (
                      <button
                        key={allergy.value}
                        onClick={() => handleAllergyToggle(allergy.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedAllergies.includes(allergy.value)
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-foreground hover:bg-green-100'
                        }`}
                      >
                        {allergy.label}
                      </button>
                    ))}
                  </div>
                  {selectedAllergies.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Sélectionne au moins une option</p>
                  )}
                </div>
              </div>
            )}

            {/* ─── Step 4: Moment Aha ─── */}
            {step === 4 && (
              <div className="flex flex-col items-center gap-6">
                <h2 className="text-xl font-bold text-center">
                  Voici ton premier repas, {profile.firstName} !
                </h2>
                <p className="text-sm text-muted-foreground text-center">
                  Généré selon tes préférences. Chaque semaine, on te propose un planning complet.
                </p>

                {sampleMeal ? (
                  <div className="w-full bg-white rounded-2xl p-5 shadow-md border border-border">
                    <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Déjeuner</div>
                    <div className="flex flex-col gap-2">
                      {sampleMeal.protein && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🥩</span>
                          <span className="font-medium">{sampleMeal.protein.name}</span>
                          {sampleMeal.protein.weightG && (
                            <span className="text-xs text-muted-foreground">{sampleMeal.protein.weightG}g</span>
                          )}
                        </div>
                      )}
                      {sampleMeal.vegetable && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🥬</span>
                          <span className="font-medium">{sampleMeal.vegetable.name}</span>
                          {sampleMeal.vegetable.weightG && (
                            <span className="text-xs text-muted-foreground">{sampleMeal.vegetable.weightG}g</span>
                          )}
                        </div>
                      )}
                      {sampleMeal.cereal && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌾</span>
                          <span className="font-medium">{sampleMeal.cereal.name}</span>
                          {sampleMeal.cereal.weightG && (
                            <span className="text-xs text-muted-foreground">{sampleMeal.cereal.weightG}g</span>
                          )}
                        </div>
                      )}
                      {sampleMeal.sauce && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🫙</span>
                          <span className="font-medium">{sampleMeal.sauce.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-center">
                      <NutriGradeBadge grade="B" size="md" showLabel />
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-white rounded-2xl p-5 shadow-md border border-border text-center text-muted-foreground">
                    Aucun repas disponible avec ces filtres. Essaie d&apos;ajuster tes préférences.
                  </div>
                )}

                <Button
                  onClick={() => {
                    handleComplete();
                    window.location.href = '/sign-up';
                  }}
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                >
                  🚀 Créer mon compte pour continuer
                </Button>

                <Link
                  href="/sign-in"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                  Déjà un compte ? Se connecter
                </Link>
              </div>
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
            Continuer
          </Button>
        </div>
      )}
    </div>
  );
}
