'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { AssemblyCard } from '@/components/AssemblyCard';
import { WeeklyScoreCard } from '@/components/WeeklyScoreCard';
import { generateRandomAssembly, detectDayConflicts } from '@/lib/engine/assemblyEngine';
import { getSmartSuggestions } from '@/lib/engine/smartSuggestions';
import { computeWeeklyScore } from '@/lib/engine/weeklyScore';
import { useTranslations, useLocale } from 'next-intl';
import type { AssemblyRow, MealFeedback, MealType } from '@/types';
import { AppTour } from '@/components/tour/AppTour';
import { ProUpsellDialog } from '@/components/ProUpsellDialog';
import Link from 'next/link';
import { Flame, Trophy, ShoppingCart, UserCircle, Refrigerator, BookOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGoalsStore } from '@/lib/store/useGoalsStore';

export default function Dashboard() {
  const t = useTranslations('dashboard');
  const tGoals = useTranslations('goals');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { plan } = useSubscriptionStore();
  const [showUpgradeWelcome, setShowUpgradeWelcome] = useState(
    () => searchParams.get('upgraded') === 'true'
  );
  const [proDialogOpen, setProDialogOpen] = useState(false);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);

  // Clean URL when the upgrade welcome modal is first shown
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
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
    onboardingCompleted,
    tourCompleted,
    completeTour,
  } = useMealStore();

  // Show trial prompt once after 3rd feedback
  useEffect(() => {
    if (feedbacks.length === 3 && plan === 'free' && !localStorage.getItem('trial-prompt-shown')) {
      setShowTrialPrompt(true);
      localStorage.setItem('trial-prompt-shown', 'true');
    }
  }, [feedbacks.length, plan]);

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
  }, [todayBreakfast, todayLunch, todayDinner, setTodayMeal, addRecentProtein]);

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

  // Current ISO week key (YYYY-Www)
  const currentWeekKey = useMemo(() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }, []);

  // Weekly Score (FREE feature)
  const weeklyScore = useMemo(() => {
    const weekPlan = {
      weekKey: currentWeekKey,
      days: Array.from({ length: 7 }, (_, i) => ({
        date: '',
        breakfast: i === 0 ? todayBreakfast : null,
        lunch: i === 0 ? todayLunch : null,
        dinner: i === 0 ? todayDinner : null,
      })),
    };
    // Merge from store if available
    const stored = Object.values(
      // Access store weekPlans via useMealStore.getState() is not available here;
      // we rely on feedbacks only for the score computation.
      {}
    );
    void stored;
    return computeWeeklyScore(weekPlan, feedbacks);
  }, [currentWeekKey, feedbacks, todayBreakfast, todayLunch, todayDinner]);

  // Weekly recap stats
  const thisWeekFeedbacks = feedbacks.filter(f => {
    const feedbackDate = new Date(f.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return feedbackDate >= weekAgo;
  });

  const avgPleasure = thisWeekFeedbacks.length > 0
    ? (thisWeekFeedbacks.reduce((sum, f) => sum + f.pleasure, 0) / thisWeekFeedbacks.length).toFixed(1)
    : null;

  // Smart suggestions for Pro users — mealType defaults to 'lunch' as the primary meal
  const smartSuggestions = useMemo(() => {
    if (plan !== 'pro') return [];
    return getSmartSuggestions('lunch', feedbacks, 3);
  }, [plan, feedbacks]);

  const applySuggestion = useCallback((assembly: AssemblyRow) => {
    // Apply to the first unvalidated meal (breakfast → lunch → dinner)
    const meals: { type: MealType; value: AssemblyRow | null }[] = [
      { type: 'breakfast', value: todayBreakfast },
      { type: 'lunch', value: todayLunch },
      { type: 'dinner', value: todayDinner },
    ];
    const target = meals.find((m) => m.value && !m.value.validated);
    if (target) {
      setTodayMeal(target.type, { ...assembly, mealType: target.type, validated: false });
    } else {
      // Fallback: apply to lunch
      setTodayMeal('lunch', { ...assembly, mealType: 'lunch', validated: false });
    }
  }, [todayBreakfast, todayLunch, todayDinner, setTodayMeal]);

  const { goals, incrementGoal } = useGoalsStore();
  const activeGoals = goals.filter((g) => g.weekKey === currentWeekKey && g.achievedCount < g.targetCount);

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
        </div>
      </div>

      {/* Weekly Score Card (FREE feature) */}
      {weeklyScore && weeklyScore.mealsValidated >= 3 && (
        <WeeklyScoreCard
          score={weeklyScore}
          weekKey={currentWeekKey}
          userName={settings.firstName}
        />
      )}

      {/* Smart suggestions (Pro only) */}
      {plan === 'pro' && smartSuggestions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-600">✨ Suggestions pour toi</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {smartSuggestions.map(s => (
              <button
                key={s.id}
                onClick={() => applySuggestion(s)}
                className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 text-sm"
              >
                <span className="font-medium">{s.protein?.name}</span>
                <span className="text-gray-400"> + </span>
                <span className="text-gray-600">{s.vegetable?.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Goals banner (Pro only) */}
      {plan === 'pro' && activeGoals.length > 0 && (
        <div className="space-y-2">
          {activeGoals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100"
            >
              <span className="text-lg">🎯</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{goal.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(goal.achievedCount / goal.targetCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-blue-600 font-medium shrink-0">
                    {goal.achievedCount}/{goal.targetCount}
                  </span>
                </div>
              </div>
              <button
                onClick={() => incrementGoal(goal.id)}
                className="text-blue-500 hover:text-blue-700 font-semibold text-sm px-1"
                aria-label={tGoals('progress')}
              >
                +1
              </button>
            </div>
          ))}
        </div>
      )}

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

      {/* Roast my diet + Tier List + Grocery CTAs */}
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
        <Link
          href="/app/grocery"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <ShoppingCart size={18} />
          🛒 Liste de courses
        </Link>
        <Link
          href="/app/history"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-semibold shadow-lg"
        >
          📊 Mon historique
        </Link>
        <Link
          href="/app/fridge"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Refrigerator size={18} />
          🧊 Mode Frigo
        </Link>
        <Link
          href="/app/repertoire"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-400 to-violet-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <BookOpen size={18} />
          📚 Mon répertoire
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-meal-breakfast)]">
            {feedbacks.filter(f => f.pleasure >= 4).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t('goodMeals')}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-meal-dinner)]">
            {feedbacks.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t('totalFeedbacks')}</p>
        </div>
      </div>

      {/* Weekly recap card */}
      {thisWeekFeedbacks.length >= 3 && (
        <div className="bg-gradient-to-r from-[var(--color-meal-breakfast)]/10 to-[var(--color-meal-lunch)]/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">📊 Résumé de la semaine</h3>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-bold text-[var(--color-meal-breakfast)]">{thisWeekFeedbacks.length}</span>
              <span className="text-gray-500"> repas notés</span>
            </div>
            <div>
              <span className="font-bold text-[var(--color-cta)]">{avgPleasure}</span>
              <span className="text-gray-500">/5 plaisir moyen</span>
            </div>
          </div>
        </div>
      )}

      {/* Feature tour overlay */}
      {showTour && <AppTour onComplete={completeTour} />}

      {/* Trial prompt banner after 3rd feedback */}
      {showTrialPrompt && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-white rounded-xl shadow-lg border p-4 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Vous aimez AssemblEat ?</p>
              <p className="text-xs text-gray-500 mt-0.5">Essayez Pro 7 jours gratuitement — partage praticien, suggestions, historique.</p>
            </div>
            <button onClick={() => setShowTrialPrompt(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setShowTrialPrompt(false); setProDialogOpen(true); }}
              className="flex-1 py-2 rounded-lg bg-[var(--color-cta)] text-white text-sm font-semibold"
            >
              Essayer Pro gratuit
            </button>
            <button
              onClick={() => setShowTrialPrompt(false)}
              className="px-4 py-2 rounded-lg border text-sm text-gray-500"
            >
              Plus tard
            </button>
          </div>
        </div>
      )}

      <ProUpsellDialog open={proDialogOpen} onOpenChange={setProDialogOpen} />

      {/* Pro upgrade welcome modal */}
      {showUpgradeWelcome && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Bienvenue dans Pro !</h2>
            <p className="text-gray-500 mb-6">
              Votre essai gratuit de 7 jours a commencé. Profitez du partage praticien, des
              suggestions intelligentes, et bien plus.
            </p>
            <button
              onClick={() => setShowUpgradeWelcome(false)}
              className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
              style={{ background: 'var(--color-cta)' }}
            >
              Découvrir mes avantages Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
