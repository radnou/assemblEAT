'use client';

import { useEffect, useCallback } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { AssemblyCard } from '@/components/AssemblyCard';
import { StreakBadge } from '@/components/streak/StreakBadge';
import { generateRandomAssembly, detectDayConflicts } from '@/lib/engine/assemblyEngine';
import { useTranslations, useLocale } from 'next-intl';
import type { MealFeedback, MealType } from '@/types';
import { AppTour } from '@/components/tour/AppTour';
import Link from 'next/link';
import { Flame, Trophy, PartyPopper, UserCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Dashboard() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Show success toast after Pro upgrade
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast.success('Bienvenue dans AssemblEat Pro ! 🎉', {
        description: 'Votre essai gratuit de 7 jours a commencé.',
        duration: 8000,
      });
      // Clean URL
      window.history.replaceState({}, '', '/app');
    }
  }, [searchParams]);
  const {
    todayBreakfast,
    todayLunch,
    todayDinner,
    setTodayMeal,
    recentProteins,
    addRecentProtein,
    settings,
    feedbacks,
    addFeedback,
    streakCount,
    checkAndUpdateStreak,
    onboardingCompleted,
    tourCompleted,
    completeTour,
  } = useMealStore();

  // Générer les repas au premier chargement si vides
  useEffect(() => {
    if (!todayBreakfast) {
      const breakfast = generateRandomAssembly('breakfast');
      if (breakfast) setTodayMeal('breakfast', breakfast);
    }
    if (!todayLunch) {
      const lunch = generateRandomAssembly('lunch', {
        breakfastAssembly: todayBreakfast,
        recentProteins,
        enableAntiRedundancy: settings.rules.antiRedundancy,
      });
      if (lunch) setTodayMeal('lunch', lunch);
    }
    if (!todayDinner) {
      const dinner = generateRandomAssembly('dinner', {
        breakfastAssembly: todayBreakfast,
        recentProteins,
        enableAntiRedundancy: settings.rules.antiRedundancy,
      });
      if (dinner) setTodayMeal('dinner', dinner);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = useCallback((mealType: MealType) => {
    const assembly = generateRandomAssembly(mealType, {
      breakfastAssembly: todayBreakfast,
      recentProteins,
      enableAntiRedundancy: settings.rules.antiRedundancy,
    });
    if (assembly) setTodayMeal(mealType, assembly);
  }, [todayBreakfast, recentProteins, settings.rules.antiRedundancy, setTodayMeal]);

  const handleValidate = useCallback((mealType: MealType) => {
    const meals = { breakfast: todayBreakfast, lunch: todayLunch, dinner: todayDinner };
    const current = meals[mealType];
    if (!current) return;
    const validated = { ...current, validated: true };
    setTodayMeal(mealType, validated);
    if (current.protein) {
      addRecentProtein(current.protein.id);
    }
    checkAndUpdateStreak();
  }, [todayBreakfast, todayLunch, todayDinner, setTodayMeal, addRecentProtein, checkAndUpdateStreak]);

  const handleFeedbackSubmit = useCallback((feedback: MealFeedback) => {
    addFeedback(feedback);
  }, [addFeedback]);

  const warnings = detectDayConflicts(todayBreakfast, todayLunch, todayDinner);

  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const dateStr = today.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const getFeedbackForAssembly = (assemblyId: string | undefined) => {
    if (!assemblyId) return null;
    return feedbacks.find((f) => f.assemblyId === assemblyId && f.date === todayISO) ?? null;
  };

  const showTour = onboardingCompleted && !tourCompleted;

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {t('greeting')}{settings.firstName ? ` ${settings.firstName}` : ''} !
          </h1>
          <p className="text-sm text-gray-500 capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <Link href="/app/login" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <UserCircle size={20} />
              <span className="hidden sm:inline">Connexion</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1 text-sm text-gray-500" title={user?.email ?? ''}>
              <div className="w-7 h-7 rounded-full bg-[var(--color-cta)] text-white flex items-center justify-center text-xs font-bold">
                {settings.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </div>
            </div>
          )}
          {streakCount > 0 && <StreakBadge count={streakCount} size="md" />}
        </div>
      </div>

      {/* Meal cards */}
      <div className="space-y-4 lg:flex lg:gap-4 lg:space-y-0">
        <div className="flex-1">
          <AssemblyCard
            assembly={todayBreakfast}
            mealType="breakfast"
            onRegenerate={() => handleRegenerate('breakfast')}
            onValidate={() => handleValidate('breakfast')}
            existingFeedback={getFeedbackForAssembly(todayBreakfast?.id)}
            onFeedbackSubmit={handleFeedbackSubmit}
            today={todayISO}
          />
        </div>
        <div className="flex-1">
          <AssemblyCard
            assembly={todayLunch}
            mealType="lunch"
            onRegenerate={() => handleRegenerate('lunch')}
            onValidate={() => handleValidate('lunch')}
            existingFeedback={getFeedbackForAssembly(todayLunch?.id)}
            onFeedbackSubmit={handleFeedbackSubmit}
            today={todayISO}
          />
        </div>
        <div className="flex-1">
          <AssemblyCard
            assembly={todayDinner}
            mealType="dinner"
            onRegenerate={() => handleRegenerate('dinner')}
            onValidate={() => handleValidate('dinner')}
            existingFeedback={getFeedbackForAssembly(todayDinner?.id)}
            onFeedbackSubmit={handleFeedbackSubmit}
            today={todayISO}
          />
        </div>
      </div>

      {/* Global warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Roast my diet + Tier List CTAs */}
      <div className="flex gap-3 justify-center pt-2 flex-wrap">
        <Link
          href="/app/roast"
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Flame size={18} className="text-orange-400" />
          🔥 Roast my diet
        </Link>
        <Link
          href="/app/tierlist"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Trophy size={18} />
          🏆 Ma Tier List
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-meal-breakfast)]">
            {feedbacks.filter(f => f.pleasure >= 4).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t('goodMeals')}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-cta)]">
            {streakCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t('streakDays')}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-meal-dinner)]">
            {feedbacks.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t('totalFeedbacks')}</p>
        </div>
      </div>

      {/* Feature tour overlay */}
      {showTour && <AppTour onComplete={completeTour} />}
    </div>
  );
}
