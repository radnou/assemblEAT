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
  PRACTITIONER_THREAD: { free: false, pro: true },
  PRACTITIONER_GOALS: { free: false, pro: true },
  SMART_SUGGESTIONS: { free: false, pro: true },
  PHOTO_JOURNAL: { free: false, pro: true },
  GROCERY_LIST: { free: false, pro: true },
  CLOUD_SYNC: { free: false, pro: true },
  FRIDGE_MODE: { free: false, pro: true },
  FRIEND_COMPARE: { free: false, pro: true },
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
  PRACTITIONER_THREAD: {
    title: 'Thread praticien',
    description: 'Recevez les commentaires et réactions de votre praticien sur chaque repas.',
  },
  PRACTITIONER_GOALS: {
    title: 'Objectifs co-construits',
    description: 'Votre praticien définit des objectifs nutritionnels personnalisés.',
  },
  SMART_SUGGESTIONS: {
    title: 'Suggestions intelligentes',
    description: "L'app apprend vos goûts et propose des assemblages adaptés.",
  },
  PHOTO_JOURNAL: {
    title: 'Journal photo',
    description: 'Photographiez vos plats — votre praticien voit les vraies portions.',
  },
  GROCERY_LIST: {
    title: 'Liste de courses',
    description: 'Liste de courses auto-générée depuis votre semainier.',
  },
  CLOUD_SYNC: {
    title: 'Sync cloud',
    description: 'Synchronisez vos données entre tous vos appareils.',
  },
  FRIDGE_MODE: {
    title: 'Mode frigo',
    description: "Sélectionnez vos ingrédients dispo — l'app propose des assemblages.",
  },
  FRIEND_COMPARE: {
    title: 'Comparaison amis',
    description: 'Comparez votre Nutri-Score avec vos amis.',
  },
};
