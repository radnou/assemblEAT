'use client';

import { useMemo } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import type { AssemblyRow } from '@/types';

const FRUIT_VEG_TARGET = 5;

/**
 * Counts unique fruits and vegetables from today's validated assemblies.
 * Target: 5 per day (PNNS recommendation).
 */
export function useFruitVegCounter() {
  const { todayBreakfast, todayLunch, todayDinner } = useMealStore();

  return useMemo(() => {
    const meals = [todayBreakfast, todayLunch, todayDinner].filter(
      (m): m is AssemblyRow => m !== null && m.validated === true,
    );

    const itemSet = new Set<string>();
    const items: string[] = [];

    for (const meal of meals) {
      // Count the vegetable slot
      if (meal.vegetable) {
        if (!itemSet.has(meal.vegetable.id)) {
          itemSet.add(meal.vegetable.id);
          items.push(meal.vegetable.name);
        }
      }

      // Count fruits and vegetables from extras
      if (meal.extras) {
        for (const extra of meal.extras) {
          if (
            (extra.category === 'fruit' || extra.category === 'vegetable') &&
            !itemSet.has(extra.id)
          ) {
            itemSet.add(extra.id);
            items.push(extra.name);
          }
        }
      }
    }

    const count = items.length;
    return {
      count,
      target: FRUIT_VEG_TARGET,
      items,
      percentage: Math.min(100, Math.round((count / FRUIT_VEG_TARGET) * 100)),
    };
  }, [todayBreakfast, todayLunch, todayDinner]);
}
