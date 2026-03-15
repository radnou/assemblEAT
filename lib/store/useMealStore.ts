'use client';

import { create } from 'zustand';
import type { AssemblyRow, DayPlan, WeekPlan, UserSettings, UserProfile, BatchItem, MealFeedback } from '@/types';
import { batchCookItems } from '@/lib/data/repertoire';
import { createLocalPersistence, type PersistenceLayer } from '@/lib/store/persistence';

function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage plein
  }
}

interface MealStore {
  // ─── Assemblages du jour ─────────────────
  todayBreakfast: AssemblyRow | null;
  todayLunch: AssemblyRow | null;
  todayDinner: AssemblyRow | null;
  setTodayMeal: (mealType: 'breakfast' | 'lunch' | 'dinner', assembly: AssemblyRow | null) => void;

  // ─── Semainier ───────────────────────────
  weekPlans: Record<string, WeekPlan>;
  setDayPlan: (weekKey: string, dayIndex: number, plan: DayPlan) => void;
  getWeekPlan: (weekKey: string) => WeekPlan;

  // ─── Protéines récentes (règle variété) ──
  recentProteins: string[];
  addRecentProtein: (proteinId: string) => void;

  // ─── Batch Cook ──────────────────────────
  batchItems: BatchItem[];
  toggleBatchItem: (id: string) => void;
  resetBatch: () => void;

  // ─── Settings ────────────────────────────
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;

  // ─── Feedbacks ───────────────────────────
  feedbacks: MealFeedback[];
  addFeedback: (feedback: MealFeedback) => void;

  // ─── Onboarding ──────────────────────────
  onboardingCompleted: boolean;
  completeOnboarding: (profile: UserProfile) => void;

  // ─── Tour ─────────────────────────────────
  tourCompleted: boolean;
  completeTour: () => void;

  // ─── Streak ──────────────────────────────
  streakCount: number;
  streakLastDate: string | null; // YYYY-MM-DD in local time
  checkAndUpdateStreak: () => void;

  // ─── Hydration ───────────────────────────
  hydrated: boolean;
  hydrate: () => void;

  // ─── Reset ───────────────────────────────
  resetAll: () => void;

  // ─── Persistence layer ────────────────────
  /** Active persistence layer (localStorage by default, Supabase after login). */
  persistence: PersistenceLayer;
  /** Switch the persistence layer at runtime (called after auth). */
  setPersistence: (layer: PersistenceLayer) => void;
  /**
   * Load authoritative data from the current persistence layer into the store.
   * Safe to call multiple times; each call overwrites the in-memory state with
   * whatever the persistence layer returns.
   */
  syncFromPersistence: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  firstName: '',
  language: 'fr',
  rules: { antiRedundancy: true, starchWarning: true },
};

function createEmptyWeek(weekKey: string): WeekPlan {
  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    days.push({
      date: '',
      breakfast: null,
      lunch: null,
      dinner: null,
    });
  }
  return { weekKey, days };
}

export const useMealStore = create<MealStore>((set, get) => ({
  todayBreakfast: null,
  todayLunch: null,
  todayDinner: null,
  setTodayMeal: (mealType, assembly) => {
    const key = mealType === 'breakfast' ? 'todayBreakfast'
      : mealType === 'lunch' ? 'todayLunch' : 'todayDinner';
    set({ [key]: assembly });
    setLocalStorage('today-meals', {
      todayBreakfast: mealType === 'breakfast' ? assembly : get().todayBreakfast,
      todayLunch: mealType === 'lunch' ? assembly : get().todayLunch,
      todayDinner: mealType === 'dinner' ? assembly : get().todayDinner,
    });
  },

  weekPlans: {},
  setDayPlan: (weekKey, dayIndex, plan) => {
    const current = get().weekPlans;
    const week = current[weekKey] ?? createEmptyWeek(weekKey);
    const newDays = [...week.days];
    newDays[dayIndex] = plan;
    const newWeek = { ...week, days: newDays };
    const newPlans = { ...current, [weekKey]: newWeek };
    set({ weekPlans: newPlans });
    setLocalStorage(`week-${weekKey}`, newWeek);
  },
  getWeekPlan: (weekKey) => {
    const existing = get().weekPlans[weekKey];
    if (existing) return existing;
    const stored = getLocalStorage<WeekPlan | null>(`week-${weekKey}`, null);
    if (stored) {
      set((s) => ({ weekPlans: { ...s.weekPlans, [weekKey]: stored } }));
      return stored;
    }
    const empty = createEmptyWeek(weekKey);
    set((s) => ({ weekPlans: { ...s.weekPlans, [weekKey]: empty } }));
    return empty;
  },

  recentProteins: [],
  addRecentProtein: (proteinId) => {
    set((s) => {
      const updated = [...s.recentProteins, proteinId].slice(-4);
      setLocalStorage('recent-proteins', updated);
      return { recentProteins: updated };
    });
  },

  batchItems: batchCookItems,
  toggleBatchItem: (id) => {
    set((s) => {
      const items = s.batchItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      setLocalStorage('batch-items', items);
      return { batchItems: items };
    });
  },
  resetBatch: () => {
    const reset = batchCookItems.map((i) => ({ ...i, checked: false }));
    set({ batchItems: reset });
    setLocalStorage('batch-items', reset);
  },

  feedbacks: [],
  addFeedback: (feedback) => {
    set((s) => {
      const existing = s.feedbacks.filter((f) => f.assemblyId !== feedback.assemblyId || f.date !== feedback.date);
      const updated = [...existing, feedback];
      setLocalStorage('meal-feedbacks', updated);
      return { feedbacks: updated };
    });
  },

  settings: defaultSettings,
  updateSettings: (partial) => {
    set((s) => {
      const updated = { ...s.settings, ...partial };
      setLocalStorage('settings', updated);
      return { settings: updated };
    });
  },

  streakCount: 0,
  streakLastDate: null,
  checkAndUpdateStreak: () => {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const { streakLastDate, streakCount } = get();

    if (streakLastDate === today) return; // already validated today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    let newCount: number;
    if (streakLastDate === yesterdayStr) {
      newCount = streakCount + 1;
    } else {
      newCount = 1;
    }

    setLocalStorage('streak-count', newCount);
    setLocalStorage('streak-last-date', today);
    set({ streakCount: newCount, streakLastDate: today });
  },

  tourCompleted: false,
  completeTour: () => {
    setLocalStorage('tourCompleted', true);
    set({ tourCompleted: true });
  },

  onboardingCompleted: false,
  completeOnboarding: (profile) => {
    const settingsToSave: UserSettings = {
      firstName: profile.firstName,
      language: profile.language,
      rules: profile.rules,
    };
    setLocalStorage('settings', settingsToSave);
    setLocalStorage('onboardingCompleted', true);
    setLocalStorage('userProfile', profile);
    if (profile.foodPreferences) {
      setLocalStorage('food-preferences', profile.foodPreferences);
    }
    set({ settings: settingsToSave, onboardingCompleted: true });
  },

  hydrated: false,
  hydrate: () => {
    const todayMeals = getLocalStorage<{
      todayBreakfast: AssemblyRow | null;
      todayLunch: AssemblyRow | null;
      todayDinner: AssemblyRow | null;
    }>('today-meals', { todayBreakfast: null, todayLunch: null, todayDinner: null });

    const settings = getLocalStorage<UserSettings>('settings', defaultSettings);
    const recentProteins = getLocalStorage<string[]>('recent-proteins', []);
    const storedBatch = getLocalStorage<BatchItem[] | null>('batch-items', null);
    const feedbacks = getLocalStorage<MealFeedback[]>('meal-feedbacks', []);
    const onboardingCompleted = getLocalStorage<boolean>('onboardingCompleted', false);
    const tourCompleted = getLocalStorage<boolean>('tourCompleted', false);
    const streakCount = getLocalStorage<number>('streak-count', 0);
    const streakLastDate = getLocalStorage<string | null>('streak-last-date', null);
    // food preferences are stored inside userProfile; also kept separately for convenience
    getLocalStorage<{ id: string; rating: 'like' | 'neutral' | 'dislike' }[]>('food-preferences', []);

    set({
      ...todayMeals,
      settings,
      recentProteins,
      batchItems: storedBatch ?? batchCookItems,
      feedbacks,
      onboardingCompleted,
      tourCompleted,
      streakCount,
      streakLastDate,
      hydrated: true,
    });
  },

  resetAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    set({
      todayBreakfast: null,
      todayLunch: null,
      todayDinner: null,
      weekPlans: {},
      recentProteins: [],
      batchItems: batchCookItems.map((i) => ({ ...i, checked: false })),
      settings: defaultSettings,
      streakCount: 0,
      streakLastDate: null,
    });
  },

  // ─── Persistence layer ────────────────────
  persistence: createLocalPersistence(),

  setPersistence: (layer) => {
    set({ persistence: layer });
  },

  syncFromPersistence: async () => {
    const { persistence } = get();
    try {
      const [settingsResult, feedbacksResult, streakResult] = await Promise.all([
        persistence.getSettings(),
        persistence.getFeedbacks(),
        persistence.getStreak(),
      ]);

      const patch: Partial<MealStore> = {};

      if (settingsResult) {
        patch.settings = { ...defaultSettings, ...settingsResult };
      }
      if (feedbacksResult.length > 0) {
        patch.feedbacks = feedbacksResult;
      }
      if (streakResult.count > 0 || streakResult.lastDate !== null) {
        patch.streakCount = streakResult.count;
        patch.streakLastDate = streakResult.lastDate;
      }

      if (Object.keys(patch).length > 0) {
        set(patch);
      }
    } catch (error) {
      console.error('[useMealStore] syncFromPersistence failed:', error);
      // Store keeps existing in-memory state — no data lost
    }
  },
}));
