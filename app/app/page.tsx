'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { AssemblyCard } from '@/components/AssemblyCard';
import { WeeklyScoreCard } from '@/components/WeeklyScoreCard';
import { generateRandomAssembly, detectDayConflicts } from '@/lib/engine/assemblyEngine';
import { getSmartSuggestions } from '@/lib/engine/smartSuggestions';
import { computeWeeklyScore } from '@/lib/engine/weeklyScore';
import { useTimeContext } from '@/lib/hooks/useTimeContext';
import { useProgressiveGuide } from '@/lib/hooks/useProgressiveGuide';
import { useObjectiveCoaching } from '@/lib/hooks/useObjectiveCoaching';
import { useWeeklyChallenge } from '@/lib/hooks/useWeeklyChallenge';
import { useFruitVegCounter } from '@/lib/hooks/useFruitVegCounter';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { COLORS, FOOD_EMOJIS } from '@/components/onboarding/AvatarGenerator';
import { useTranslations, useLocale } from 'next-intl';
import type { AssemblyRow, MealFeedback, MealType } from '@/types';
import { AppTour } from '@/components/tour/AppTour';
import { ProUpsellDialog } from '@/components/ProUpsellDialog';
import Link from 'next/link';
import { Flame, Trophy, ShoppingCart, BookOpen, Share2, Sparkles, Lock, History } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';

// ---------------------------------------------------------------------------
// Dashboard — 3 contextual sections
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();
  const { plan } = useSubscriptionStore();

  // ---- Time context -------------------------------------------------------
  const { focusMeal, isWeekend, isMondayMorning, seasonLabel, seasonVegetables } = useTimeContext();

  // ---- Progressive guide --------------------------------------------------
  const guide = useProgressiveGuide();

  // ---- Objective coaching -------------------------------------------------
  const coaching = useObjectiveCoaching();

  // ---- Weekly challenge ---------------------------------------------------
  const { challenge, shareChallenge } = useWeeklyChallenge();

  // ---- Fruit & vegetable counter -------------------------------------------
  const fruitVeg = useFruitVegCounter();

  // ---- Feature flags ------------------------------------------------------
  const hasGrocery = useFeatureFlag('GROCERY_LIST');
  const hasRepertoire = useFeatureFlag('ADVANCED_REPERTOIRE');
  const hasShare = useFeatureFlag('SHARE_WITH_DIETITIAN');
  const hasSuggestions = useFeatureFlag('SMART_SUGGESTIONS');

  // ---- Avatar -------------------------------------------------------------
  const [avatar] = useLocalStorage<{ colorIndex: number; emojiIndex: number }>(
    'assembleat-avatar',
    { colorIndex: 0, emojiIndex: 0 },
  );

  // ---- Modals -------------------------------------------------------------
  const [showUpgradeWelcome, setShowUpgradeWelcome] = useState(
    () => searchParams.get('upgraded') === 'true',
  );
  const [proDialogOpen, setProDialogOpen] = useState(false);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);

  // Clean URL on upgrade redirect
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      window.history.replaceState({}, '', '/app');
    }
  }, [searchParams]);

  // ---- Store --------------------------------------------------------------
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

  // ---- Advance guide on first render --------------------------------------
  useEffect(() => {
    guide.advance(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Trial prompt after 3rd feedback ------------------------------------
  useEffect(() => {
    if (feedbacks.length === 3 && plan === 'free' && !localStorage.getItem('trial-prompt-shown')) {
      setShowTrialPrompt(true);
      localStorage.setItem('trial-prompt-shown', 'true');
    }
  }, [feedbacks.length, plan]);

  // ---- Generate meals on first load if empty ------------------------------
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

  // ---- Handlers -----------------------------------------------------------
  const handleRegenerate = useCallback(
    (mealType: MealType) => {
      const assembly = generateRandomAssembly(mealType, {
        breakfastAssembly: todayBreakfast,
        recentProteins,
        enableAntiRedundancy: settings.rules.antiRedundancy,
      });
      if (assembly) setTodayMeal(mealType, assembly);
    },
    [todayBreakfast, recentProteins, settings.rules.antiRedundancy, setTodayMeal],
  );

  const handleValidate = useCallback(
    (mealType: MealType) => {
      const meals = { breakfast: todayBreakfast, lunch: todayLunch, dinner: todayDinner };
      const current = meals[mealType];
      if (!current) return;
      const validated = { ...current, validated: true };
      setTodayMeal(mealType, validated);
      if (current.protein) addRecentProtein(current.protein.id);
    },
    [todayBreakfast, todayLunch, todayDinner, setTodayMeal, addRecentProtein],
  );

  const handleFeedbackSubmit = useCallback(
    (feedback: MealFeedback) => {
      addFeedback(feedback);
    },
    [addFeedback],
  );

  // ---- Derived data -------------------------------------------------------
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

  // Current ISO week key
  const currentWeekKey = useMemo(() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }, []);

  // Weekly Score
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
    return computeWeeklyScore(weekPlan, feedbacks);
  }, [currentWeekKey, feedbacks, todayBreakfast, todayLunch, todayDinner]);

  // Weekly recap stats
  const thisWeekFeedbacks = feedbacks.filter((f) => {
    const feedbackDate = new Date(f.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return feedbackDate >= weekAgo;
  });

  const avgPleasure =
    thisWeekFeedbacks.length > 0
      ? (thisWeekFeedbacks.reduce((sum, f) => sum + f.pleasure, 0) / thisWeekFeedbacks.length).toFixed(1)
      : null;

  // Smart suggestions (Pro)
  const smartSuggestions = useMemo(() => {
    if (plan !== 'pro') return [];
    return getSmartSuggestions('lunch', feedbacks, 3);
  }, [plan, feedbacks]);

  const applySuggestion = useCallback(
    (assembly: AssemblyRow) => {
      const meals: { type: MealType; value: AssemblyRow | null }[] = [
        { type: 'breakfast', value: todayBreakfast },
        { type: 'lunch', value: todayLunch },
        { type: 'dinner', value: todayDinner },
      ];
      const target = meals.find((m) => m.value && !m.value.validated);
      if (target) {
        setTodayMeal(target.type, { ...assembly, mealType: target.type, validated: false });
      } else {
        setTodayMeal('lunch', { ...assembly, mealType: 'lunch', validated: false });
      }
    },
    [todayBreakfast, todayLunch, todayDinner, setTodayMeal],
  );

  const showTour = onboardingCompleted && !tourCompleted;

  // Meal entries for rendering
  const mealEntries: { type: MealType; assembly: AssemblyRow | null }[] = [
    { type: 'breakfast', assembly: todayBreakfast },
    { type: 'lunch', assembly: todayLunch },
    { type: 'dinner', assembly: todayDinner },
  ];

  const currentHour = today.getHours();
  const isWeekendMorning = isWeekend && currentHour < 12;

  // ---- Avatar rendering helper --------------------------------------------
  const avatarInitial = (settings.firstName?.charAt(0) || '?').toUpperCase();
  const avatarColor = COLORS[avatar.colorIndex] ?? COLORS[0];
  const avatarEmoji = FOOD_EMOJIS[avatar.emojiIndex] ?? FOOD_EMOJIS[0];

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="max-w-lg mx-auto py-6 px-4 space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative w-11 h-11 shrink-0">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white ${avatarColor}`}
            >
              {avatarInitial}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs shadow">
              {avatarEmoji}
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold">
              Salut {settings.firstName || 'toi'} !
            </h1>
            <p className="text-xs text-gray-500 capitalize">{dateStr}</p>
          </div>
        </div>
        {isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton mode="modal">
            <button className="text-sm text-gray-500 hover:text-gray-700 underline">
              Connexion
            </button>
          </SignInButton>
        )}
      </div>

      {/* ─── Progressive Guide Banner ───────────────────────────────────── */}
      {guide.currentGuide && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">{guide.currentGuide.content}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-green-600 font-medium">
              Étape {guide.step}/7
            </span>
            <button
              onClick={guide.dismiss}
              className="text-xs text-green-500 hover:text-green-700 underline"
            >
              Passer le guide
            </button>
          </div>
        </div>
      )}

      {/* ─── Objective Coaching Bar ─────────────────────────────────────── */}
      {coaching.hasObjective && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-900">
              🎯 {coaching.objective.label} · J{coaching.daysPassed}/{coaching.daysTotal}
            </span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${coaching.percentage}%` }}
            />
          </div>
          <p className="text-xs text-blue-600">{coaching.message}</p>
        </div>
      )}

      {/* ─── Day Banner ─────────────────────────────────────────────────── */}
      {isWeekendMorning && thisWeekFeedbacks.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-amber-900">📊 Bilan hebdo</h3>
          <div className="flex gap-4 text-sm">
            {weeklyScore && (
              <span className="font-bold text-amber-700">Score {weeklyScore.grade}</span>
            )}
            <span>
              <span className="font-bold text-amber-700">{thisWeekFeedbacks.length}</span>
              <span className="text-gray-500"> repas notés</span>
            </span>
            {avgPleasure && (
              <span>
                <span className="font-bold text-amber-700">{avgPleasure}</span>
                <span className="text-gray-500">/5 plaisir</span>
              </span>
            )}
          </div>
          <Link
            href="/app/planner"
            className="inline-block mt-1 text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
          >
            Prépare ta semaine →
          </Link>
        </div>
      )}

      {isMondayMorning && !isWeekend && (
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 text-center">
          <p className="text-sm font-semibold text-green-800">
            Nouvelle semaine, c&apos;est parti 💪
          </p>
        </div>
      )}

      {/* ─── Weekly Challenge Card ──────────────────────────────────────── */}
      {challenge && (
        <div className="mx-0 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{challenge.emoji}</span>
              <div>
                <div className="text-sm font-semibold">{challenge.title}</div>
                <div className="text-xs text-muted-foreground">{challenge.description}</div>
              </div>
            </div>
            {challenge.completed && <span className="text-green-500 text-lg">✅</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-amber-100 rounded-full h-2">
              <div
                className="bg-amber-500 rounded-full h-2 transition-all"
                style={{ width: `${Math.min(100, (challenge.currentCount / challenge.targetCount) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{challenge.currentCount}/{challenge.targetCount}</span>
          </div>
          {challenge.completed && (
            <button
              onClick={() => shareChallenge()}
              className="mt-2 w-full text-center text-sm font-medium text-amber-700 hover:text-amber-900"
            >
              📤 Partager mon défi réussi
            </button>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SECTION 1: 🎯 REPAS DU JOUR                                     */}
      {/* ================================================================ */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-3">
          🎯 REPAS DU JOUR
        </h2>

        <div className="space-y-3">
          {mealEntries.map(({ type, assembly }) => {
            const isFocus = focusMeal === type;
            return (
              <div
                key={type}
                className={`transition-all duration-200 ${
                  isFocus
                    ? 'ring-2 ring-green-500 rounded-xl'
                    : 'scale-[0.97] opacity-90'
                }`}
              >
                <AssemblyCard
                  assembly={assembly}
                  mealType={type}
                  onRegenerate={() => handleRegenerate(type)}
                  onValidate={() => handleValidate(type)}
                  existingFeedback={getFeedbackForAssembly(assembly?.id)}
                  onFeedbackSubmit={handleFeedbackSubmit}
                  today={todayISO}
                />
              </div>
            );
          })}
        </div>

        {/* Global warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1 mt-2">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                {w}
              </p>
            ))}
          </div>
        )}

        {/* Weekly score mini-card */}
        {weeklyScore && (
          <div className="mt-4">
            <WeeklyScoreCard
              score={weeklyScore}
              weekKey={currentWeekKey}
              userName={settings.firstName}
            />
          </div>
        )}

        {/* Fruit & vegetable counter */}
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg mt-3">
          <span className="text-lg">🥬</span>
          <div className="flex-1">
            <div className="text-xs font-medium text-green-900">Fruits & légumes aujourd&apos;hui</div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${i <= fruitVeg.count ? 'bg-green-500' : 'bg-green-200'}`}
                />
              ))}
            </div>
          </div>
          <span className="text-sm font-bold text-green-600">{fruitVeg.count}/5</span>
        </div>
      </section>

      {/* ─── Seasonal Banner ────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-4 py-3">
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">{seasonLabel}</span>
          {' · Légumes de saison : '}
          {seasonVegetables.join(', ')}
        </p>
      </div>

      {/* ================================================================ */}
      {/* SECTION 2: 📊 MON BILAN                                         */}
      {/* ================================================================ */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
          📊 MON BILAN
        </h2>

        <div className="grid gap-3">
          {/* Roast — free */}
          <Link
            href="/app/roast"
            className="flex items-center gap-3 rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
              <Flame size={20} className="text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">🔥 Roast my diet</p>
              <p className="text-xs text-gray-500">Analyse sans pitié de tes habitudes</p>
            </div>
          </Link>

          {/* Tier List — free */}
          <Link
            href="/app/tierlist"
            className="flex items-center gap-3 rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shrink-0">
              <Trophy size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">🏆 Ma Tier List</p>
              <p className="text-xs text-gray-500">Classe tes ingrédients préférés</p>
            </div>
          </Link>

          {/* Historique — Pro */}
          <ProCard
            href="/app/history"
            enabled={plan === 'pro'}
            onUpsell={() => setProDialogOpen(true)}
            icon={<History size={20} className="text-white" />}
            iconBg="bg-gradient-to-br from-blue-400 to-indigo-500"
            title="📊 Mon historique"
            description="Suivi détaillé de tes repas"
          />
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 3: 🛠️ MES OUTILS                                       */}
      {/* ================================================================ */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-3">
          🛠️ MES OUTILS
        </h2>

        <div className="grid gap-3">
          {/* Liste de courses — Pro */}
          <ProCard
            href="/app/grocery"
            enabled={hasGrocery}
            onUpsell={() => setProDialogOpen(true)}
            icon={<ShoppingCart size={20} className="text-white" />}
            iconBg="bg-gradient-to-br from-green-400 to-emerald-500"
            title="🛒 Liste de courses"
            description="Auto-générée depuis tes repas"
          />

          {/* Mon répertoire — Pro */}
          <ProCard
            href="/app/repertoire"
            enabled={hasRepertoire}
            onUpsell={() => setProDialogOpen(true)}
            icon={<BookOpen size={20} className="text-white" />}
            iconBg="bg-gradient-to-br from-purple-400 to-violet-500"
            title="📚 Mon répertoire"
            description="Tes assemblages personnalisés"
          />

          {/* Partage diététicien — Pro */}
          <ProCard
            href="/app/export"
            enabled={hasShare}
            onUpsell={() => setProDialogOpen(true)}
            icon={<Share2 size={20} className="text-white" />}
            iconBg="bg-gradient-to-br from-teal-400 to-cyan-500"
            title="🩺 Partage diététicien"
            description="Envoie ton bilan à ton praticien"
          />

          {/* Smart suggestions — Pro (inline) */}
          {hasSuggestions && smartSuggestions.length > 0 ? (
            <div className="rounded-xl border shadow-sm p-4 bg-white space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <p className="text-sm font-semibold">✨ Suggestions pour toi</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {smartSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => applySuggestion(s)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 text-sm hover:shadow transition-shadow"
                  >
                    <span className="font-medium">{s.protein?.name}</span>
                    <span className="text-gray-400"> + </span>
                    <span className="text-gray-600">{s.vegetable?.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            !hasSuggestions && (
              <div className="relative rounded-xl border shadow-sm p-4 bg-white overflow-hidden">
                <div className="blur-[2px] opacity-60 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <p className="text-sm font-semibold">✨ Suggestions pour toi</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Des suggestions basées sur tes goûts
                  </p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setProDialogOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold shadow-lg hover:bg-purple-700 transition-colors"
                  >
                    <Lock size={12} />
                    Débloquer
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* ─── Feature tour overlay ───────────────────────────────────────── */}
      {showTour && <AppTour onComplete={completeTour} />}

      {/* ─── Trial prompt banner ────────────────────────────────────────── */}
      {showTrialPrompt && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-white rounded-xl shadow-lg border p-4 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Vous aimez AssemblEat ?</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Essayez Pro 7 jours gratuitement — partage praticien, suggestions, historique.
              </p>
            </div>
            <button
              onClick={() => setShowTrialPrompt(false)}
              className="text-gray-400 hover:text-gray-600 text-lg"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setShowTrialPrompt(false);
                setProDialogOpen(true);
              }}
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

      {/* ─── Pro upgrade welcome modal ──────────────────────────────────── */}
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

// ---------------------------------------------------------------------------
// ProCard — link card with blurred preview for Pro features
// ---------------------------------------------------------------------------
interface ProCardProps {
  href: string;
  enabled: boolean;
  onUpsell: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function ProCard({ href, enabled, onUpsell, icon, iconBg, title, description }: ProCardProps) {
  if (enabled) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow bg-white"
      >
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative rounded-xl border shadow-sm p-4 bg-white overflow-hidden">
      <div className="flex items-center gap-3 blur-[2px] opacity-60 pointer-events-none">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={onUpsell}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold shadow-lg hover:bg-purple-700 transition-colors"
        >
          <Lock size={12} />
          Débloquer
        </button>
      </div>
    </div>
  );
}
