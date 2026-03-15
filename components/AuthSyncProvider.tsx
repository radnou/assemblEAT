'use client';

/**
 * AuthSyncProvider
 *
 * Runs after HydrationProvider confirms localStorage is loaded. It:
 *   1. Watches for Supabase auth state.
 *   2. On first login, runs the one-shot localStorage → Supabase migration.
 *   3. After migration, switches the store's persistence layer to Supabase.
 *
 * Renders nothing — purely a side-effect provider.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMigration } from '@/lib/hooks/useMigration';
import { useMealStore } from '@/lib/store/useMealStore';
import { createAssembleatClient } from '@/lib/supabase/client';
import { createSupabasePersistence } from '@/lib/store/persistence';

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { migrate, migrated } = useMigration();
  const setPersistence = useMealStore((s) => s.setPersistence);
  const syncFromPersistence = useMealStore((s) => s.syncFromPersistence);

  // Track whether we have already switched to the Supabase layer for this user
  const supabaseLayerActiveRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      supabaseLayerActiveRef.current = false;
      return;
    }

    async function handleAuthReady() {
      // Step 1: migrate localStorage data to Supabase (idempotent)
      if (!migrated) {
        await migrate();
      }

      // Step 2: switch persistence layer to Supabase (once per session)
      if (!supabaseLayerActiveRef.current) {
        const supabase = createAssembleatClient();
        const layer = createSupabasePersistence(supabase);
        setPersistence(layer);
        supabaseLayerActiveRef.current = true;

        // Step 3: load authoritative Supabase data into the store
        await syncFromPersistence();
      }
    }

    handleAuthReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  return <>{children}</>;
}
