'use client';

import { create } from 'zustand';

export interface NutritionGoal {
  id: string;
  text: string;
  targetCount: number;
  achievedCount: number;
  weekKey: string;
  createdAt: string;
}

interface GoalsStore {
  goals: NutritionGoal[];
  addGoal: (text: string, targetCount: number, weekKey: string) => void;
  incrementGoal: (id: string) => void;
  removeGoal: (id: string) => void;
}

function loadFromStorage(): NutritionGoal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('nutrition-goals');
    return raw ? (JSON.parse(raw) as NutritionGoal[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(goals: NutritionGoal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('nutrition-goals', JSON.stringify(goals));
  } catch {
    // localStorage full
  }
}

export const useGoalsStore = create<GoalsStore>((set) => ({
  goals: loadFromStorage(),

  addGoal: (text, targetCount, weekKey) => {
    const newGoal: NutritionGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      targetCount,
      achievedCount: 0,
      weekKey,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [...state.goals, newGoal];
      saveToStorage(updated);
      return { goals: updated };
    });
  },

  incrementGoal: (id) => {
    set((state) => {
      const updated = state.goals.map((g) =>
        g.id === id
          ? { ...g, achievedCount: Math.min(g.achievedCount + 1, g.targetCount) }
          : g
      );
      saveToStorage(updated);
      return { goals: updated };
    });
  },

  removeGoal: (id) => {
    set((state) => {
      const updated = state.goals.filter((g) => g.id !== id);
      saveToStorage(updated);
      return { goals: updated };
    });
  },
}));
