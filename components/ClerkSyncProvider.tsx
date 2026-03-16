'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { createSupabasePersistence } from '@/lib/store/persistence';
import { useMigration } from '@/lib/hooks/useMigration';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { db: { schema: 'assembleat' } }
);

export function ClerkSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();
  const supabaseLayerActiveRef = useRef(false);
  const { setPersistence, syncFromPersistence } = useMealStore();
  const setPlan = useSubscriptionStore((s) => s.setPlan);
  const { migrate, migrated } = useMigration(isSignedIn ? user?.id ?? null : null);

  useEffect(() => {
    if (!isSignedIn || !user?.id || supabaseLayerActiveRef.current) return;

    const sync = async () => {
      if (!migrated) await migrate();
      setPersistence(createSupabasePersistence(supabase, user.id));
      await syncFromPersistence();
      supabaseLayerActiveRef.current = true;

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('clerk_user_id', user.id)
        .single();

      if (profile?.plan) {
        setPlan(profile.plan as 'free' | 'pro');
      }
    };

    sync();
  }, [isSignedIn, user?.id, setPersistence, syncFromPersistence, setPlan, migrate, migrated]);

  return <>{children}</>;
}
