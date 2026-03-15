'use client';

import { useEffect, useCallback } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { AssemblyCard } from '@/components/AssemblyCard';
import { generateRandomAssembly, detectDayConflicts } from '@/lib/engine/assemblyEngine';
import { fr } from '@/lib/i18n/fr';
import type { MealType } from '@/types';

export default function Dashboard() {
  const {
    todayBreakfast,
    todayLunch,
    todayDinner,
    setTodayMeal,
    recentProteins,
    addRecentProtein,
    settings,
  } = useMealStore();

  // Générer les repas au premier chargement si vides
  useEffect(() => {
    if (!todayBreakfast) {
      setTodayMeal('breakfast', generateRandomAssembly('breakfast'));
    }
    if (!todayLunch) {
      setTodayMeal('lunch', generateRandomAssembly('lunch', {
        breakfastAssembly: todayBreakfast,
        recentProteins,
        enableAntiRedundancy: settings.rules.antiRedundancy,
      }));
    }
    if (!todayDinner) {
      setTodayMeal('dinner', generateRandomAssembly('dinner', {
        breakfastAssembly: todayBreakfast,
        recentProteins,
        enableAntiRedundancy: settings.rules.antiRedundancy,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = useCallback((mealType: MealType) => {
    const assembly = generateRandomAssembly(mealType, {
      breakfastAssembly: todayBreakfast,
      recentProteins,
      enableAntiRedundancy: settings.rules.antiRedundancy,
    });
    setTodayMeal(mealType, assembly);
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
  }, [todayBreakfast, todayLunch, todayDinner, setTodayMeal, addRecentProtein]);

  const warnings = detectDayConflicts(todayBreakfast, todayLunch, todayDinner);

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">
          {fr.dashboard.greeting}{settings.firstName ? ` ${settings.firstName}` : ''} !
        </h1>
        <p className="text-sm text-gray-500 capitalize">{dateStr}</p>
      </div>

      {/* Meal cards */}
      <div className="space-y-4 lg:flex lg:gap-4 lg:space-y-0">
        <div className="flex-1">
          <AssemblyCard
            assembly={todayBreakfast}
            mealType="breakfast"
            onRegenerate={() => handleRegenerate('breakfast')}
            onValidate={() => handleValidate('breakfast')}
          />
        </div>
        <div className="flex-1">
          <AssemblyCard
            assembly={todayLunch}
            mealType="lunch"
            onRegenerate={() => handleRegenerate('lunch')}
            onValidate={() => handleValidate('lunch')}
            warnings={warnings.filter((w) => w.includes('déjeuner') || w.includes('midi'))}
          />
        </div>
        <div className="flex-1">
          <AssemblyCard
            assembly={todayDinner}
            mealType="dinner"
            onRegenerate={() => handleRegenerate('dinner')}
            onValidate={() => handleValidate('dinner')}
            warnings={warnings.filter((w) => w.includes('soir') || w.includes('dîner'))}
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
    </div>
  );
}
