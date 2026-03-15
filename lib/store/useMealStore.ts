'use client';

import { create } from 'zustand';
import type { AssemblyRow, DayPlan, WeekPlan, UserSettings, BatchItem } from '@/types';
import { batchCookItems } from '@/lib/data/repertoire';

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

  // ─── Hydration ───────────────────────────
  hydrated: boolean;
  hydrate: () => void;

  // ─── Reset ───────────────────────────────
  resetAll: () => void;
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

  settings: defaultSettings,
  updateSettings: (partial) => {
    set((s) => {
      const updated = { ...s.settings, ...partial };
      setLocalStorage('settings', updated);
      return { settings: updated };
    });
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

    set({
      ...todayMeals,
      settings,
      recentProteins,
      batchItems: storedBatch ?? batchCookItems,
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
    });
  },
}));
