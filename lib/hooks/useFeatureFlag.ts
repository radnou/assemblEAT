'use client';

import type { FeatureFlag } from '@/types';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { isFeatureEnabled } from '@/lib/config/features';

/**
 * Hook pour vérifier si une fonctionnalité est accessible
 * selon le plan de l'utilisateur.
 */
export function useFeatureFlag(feature: FeatureFlag): boolean {
  const plan = useSubscriptionStore((s) => s.plan);
  return isFeatureEnabled(feature, plan);
}
