'use client';

import { create } from 'zustand';
import type { SubscriptionPlan } from '@/types';

interface SubscriptionStore {
  plan: SubscriptionPlan;
  setPlan: (plan: SubscriptionPlan) => void;
}

/**
 * Store de souscription — préparé pour Stripe en v2.
 * En v1, tous les utilisateurs sont sur le plan 'free'.
 */
export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  plan: 'free',
  setPlan: (plan) => set({ plan }),
}));
