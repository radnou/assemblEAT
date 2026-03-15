'use client';

import { useEffect } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useMealStore((s) => s.hydrate);
  const hydrated = useMealStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg font-semibold text-[var(--color-meal-breakfast)]">
          AssemblEat
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
