/**
 * PersistenceLayer abstraction
 *
 * Two implementations:
 *   - createLocalPersistence()   — localStorage (default, no auth required)
 *   - createSupabasePersistence() — Supabase (opt-in after login)
 *
 * TODO: For Supabase to work, the PostgREST instance must expose the
 * `assembleat` schema via PGRST_DB_SCHEMAS env var in the docker-compose config.
 * Until then, the Supabase implementation will silently fail and fall back to
 * localStorage (non-destructive).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { WeekPlan, MealFeedback, UserSettings } from '@/types';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface PersistenceLayer {
  // Week plans
  getWeekPlan(weekKey: string): Promise<WeekPlan | null>;
  saveWeekPlan(weekKey: string, plan: WeekPlan): Promise<void>;

  // Feedbacks
  saveFeedback(feedback: MealFeedback): Promise<void>;
  getFeedbacks(): Promise<MealFeedback[]>;

  // Settings
  getSettings(): Promise<UserSettings | null>;
  saveSettings(settings: Partial<UserSettings>): Promise<void>;

}

// ─── Local implementation ─────────────────────────────────────────────────────

function localGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function localSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full — silently ignore
  }
}

export function createLocalPersistence(): PersistenceLayer {
  return {
    async getWeekPlan(weekKey) {
      return localGet<WeekPlan | null>(`week-${weekKey}`, null);
    },
    async saveWeekPlan(weekKey, plan) {
      localSet(`week-${weekKey}`, plan);
    },
    async saveFeedback(feedback) {
      const existing = localGet<MealFeedback[]>('meal-feedbacks', []);
      const filtered = existing.filter(
        (f) => f.assemblyId !== feedback.assemblyId || f.date !== feedback.date
      );
      localSet('meal-feedbacks', [...filtered, feedback]);
    },
    async getFeedbacks() {
      return localGet<MealFeedback[]>('meal-feedbacks', []);
    },
    async getSettings() {
      return localGet<UserSettings | null>('settings', null);
    },
    async saveSettings(settings) {
      const current = localGet<UserSettings | null>('settings', null);
      localSet('settings', { ...current, ...settings });
    },
  };
}

// ─── Supabase implementation ──────────────────────────────────────────────────

export function createSupabasePersistence(supabase: SupabaseClient, userId: string): PersistenceLayer {
  return {
    async getWeekPlan(weekKey) {
      try {
        const { data, error } = await supabase
          .from('week_plans')
          .select('data')
          .eq('user_id', userId)
          .eq('week_key', weekKey)
          .single();
        if (error || !data) return null;
        return data.data as WeekPlan;
      } catch {
        return null;
      }
    },

    async saveWeekPlan(weekKey, plan) {
      try {
        await supabase
          .from('week_plans')
          .upsert({ user_id: userId, week_key: weekKey, data: plan }, { onConflict: 'user_id,week_key' });
      } catch {
        // silently ignore — local layer still holds data
      }
    },

    async saveFeedback(feedback) {
      try {
        await supabase.from('meal_feedbacks').upsert(
          {
            user_id: userId,
            assembly_id: feedback.assemblyId,
            date: feedback.date,
            pleasure: feedback.pleasure,
            quantity: feedback.quantity,
            note: feedback.note,
          },
          { onConflict: 'user_id,assembly_id,date' }
        );
      } catch {
        // silently ignore
      }
    },

    async getFeedbacks() {
      try {
        const { data, error } = await supabase
          .from('meal_feedbacks')
          .select('*')
          .eq('user_id', userId);
        if (error || !data) return [];
        return data.map((row) => ({
          id: row.id,
          assemblyId: row.assembly_id,
          date: row.date,
          pleasure: row.pleasure as MealFeedback['pleasure'],
          quantity: row.quantity as MealFeedback['quantity'],
          note: row.note,
        }));
      } catch {
        return [];
      }
    },

    async getSettings() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, language, rules')
          .eq('clerk_user_id', userId)
          .single();
        if (error || !data) return null;
        return {
          firstName: data.first_name ?? '',
          language: (data.language ?? 'fr') as UserSettings['language'],
          rules: (data.rules as UserSettings['rules']) ?? {
            antiRedundancy: true,
            starchWarning: true,
          },
        };
      } catch {
        return null;
      }
    },

    async saveSettings(settings) {
      try {
        const patch: Record<string, unknown> = { clerk_user_id: userId };
        if (settings.firstName !== undefined) patch.first_name = settings.firstName;
        if (settings.language !== undefined) patch.language = settings.language;
        if (settings.rules !== undefined) patch.rules = settings.rules;
        await supabase.from('profiles').upsert(patch, { onConflict: 'clerk_user_id' });
      } catch {
        // silently ignore
      }
    },

  };
}
