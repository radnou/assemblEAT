'use client';

import { useCallback, useState } from 'react';
import { createAssembleatClient } from '@/lib/supabase/client';

const MIGRATION_KEY = 'supabase-migrated';

/**
 * One-shot migration hook.
 *
 * Call `migrate()` once after the user authenticates. It reads every relevant
 * localStorage key and uploads the data to Supabase. Only on full success does
 * it mark the migration as done. If anything throws, localStorage is left
 * untouched so no data is lost.
 *
 * Idempotent: subsequent calls are no-ops if already migrated.
 */
export function useMigration() {
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(MIGRATION_KEY) === 'true'
  );

  const migrate = useCallback(async () => {
    if (migrated) return;
    if (typeof window === 'undefined') return;

    const supabase = createAssembleatClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setMigrating(true);
    try {
      // 1. Migrate settings → profiles
      const rawSettings = localStorage.getItem('settings');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings) as Record<string, unknown>;
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            first_name: (parsed.firstName as string) ?? '',
            language: (parsed.language as string) ?? 'fr',
            rules: parsed.rules ?? { antiRedundancy: true, starchWarning: true },
          },
          { onConflict: 'id' }
        );
      }

      // 2. Migrate week plans (keys: "week-YYYY-WW")
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('week-')) {
          const weekKey = key.replace(/^week-/, '');
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw);
          await supabase.from('week_plans').upsert(
            { user_id: user.id, week_key: weekKey, data },
            { onConflict: 'user_id,week_key' }
          );
        }
      }

      // 3. Migrate feedbacks → meal_feedbacks
      const rawFeedbacks = localStorage.getItem('meal-feedbacks');
      if (rawFeedbacks) {
        const parsed = JSON.parse(rawFeedbacks) as Array<{
          assemblyId: string;
          date: string;
          pleasure: number;
          quantity: string | null;
          note: string | null;
        }>;
        for (const fb of parsed) {
          await supabase.from('meal_feedbacks').upsert(
            {
              user_id: user.id,
              assembly_id: fb.assemblyId,
              date: fb.date,
              pleasure: fb.pleasure,
              quantity: fb.quantity,
              note: fb.note,
            },
            { onConflict: 'user_id,assembly_id,date' }
          );
        }
      }

      // 4. Mark complete — only after all uploads succeeded
      localStorage.setItem(MIGRATION_KEY, 'true');
      setMigrated(true);
    } catch (error) {
      // Non-destructive: localStorage is preserved on failure
      console.error('[useMigration] Migration failed, localStorage preserved:', error);
    } finally {
      setMigrating(false);
    }
  }, [migrated]);

  return { migrate, migrating, migrated };
}
