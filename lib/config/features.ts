import type { FeatureFlag, SubscriptionPlan } from '@/types';

/**
 * Matrice des fonctionnalités par plan.
 * En v1, toutes les features Pro retournent false pour 'free'.
 */
const featureMatrix: Record<FeatureFlag, Record<SubscriptionPlan, boolean>> = {
  SHARE_WITH_DIETITIAN: { free: false, pro: true },
  ADVANCED_REPERTOIRE: { free: false, pro: true },
  WEEKLY_STATS: { free: false, pro: true },
  MULTI_PROFILE: { free: false, pro: true },
};

export function isFeatureEnabled(feature: FeatureFlag, plan: SubscriptionPlan): boolean {
  return featureMatrix[feature]?.[plan] ?? false;
}

export const featureDescriptions: Record<FeatureFlag, { title: string; description: string }> = {
  SHARE_WITH_DIETITIAN: {
    title: 'Partage diététicien',
    description: 'Partagez votre semainier directement avec votre diététicien(ne) — il reçoit un lien de lecture en temps réel.',
  },
  ADVANCED_REPERTOIRE: {
    title: 'Répertoire avancé',
    description: 'Plus de 16 assemblages personnalisables pour varier encore plus vos repas.',
  },
  WEEKLY_STATS: {
    title: 'Statistiques hebdo',
    description: 'Tableau de bord nutritionnel avec évolution du Nutri-Score moyen sur 4 semaines.',
  },
  MULTI_PROFILE: {
    title: 'Multi-profils',
    description: 'Gérez plusieurs profils dans le même compte (famille, couple).',
  },
};
