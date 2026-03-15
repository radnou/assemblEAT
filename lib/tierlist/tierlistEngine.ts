import type { MealFeedback, WeekPlan, NutriGrade } from '@/types';

export interface TierItem {
  assemblyId: string;
  name: string;
  nutriGrade: string;
  avgPleasure: number;
  count: number;
  score: number;
}

export type TierRank = 'S' | 'A' | 'B' | 'C' | 'D';

function nutriScoreToNum(grade: string): number {
  const map: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
  return map[grade] ?? 3; // default to C=3 if unknown
}

/**
 * Derive a human-readable name for an assembly from weekPlans data.
 * Looks through all weekPlans for a matching assembly and builds a name
 * from its components.
 */
function getAssemblyName(
  assemblyId: string,
  weekPlans: Record<string, WeekPlan>
): { name: string; nutriGrade: NutriGrade } {
  for (const week of Object.values(weekPlans)) {
    for (const day of week.days) {
      const assemblies = [day.breakfast, day.lunch, day.dinner].filter(Boolean);
      for (const assembly of assemblies) {
        if (!assembly) continue;
        if (assembly.id === assemblyId) {
          const parts: string[] = [];
          if (assembly.protein) parts.push(assembly.protein.name);
          if (assembly.vegetable) parts.push(assembly.vegetable.name);
          if (assembly.cereal) parts.push(assembly.cereal.name);
          const name = parts.length > 0 ? parts.join(' + ') : assemblyId;
          // nutriGrade not stored on AssemblyRow — default to 'C' as fallback
          return { name, nutriGrade: 'C' };
        }
      }
    }
  }
  return { name: assemblyId, nutriGrade: 'C' };
}

/**
 * Compute tier list from feedbacks cross-referenced with weekPlans.
 *
 * Scoring formula:
 *   score = (avgPleasure / 5) * 0.6 + (nutriScoreToNum(grade) / 5) * 0.4
 *
 * Tier assignment:
 *   score >= 0.9 → S
 *   score >= 0.7 → A
 *   score >= 0.5 → B
 *   score >= 0.3 → C
 *   else         → D
 */
export function computeTierList(
  feedbacks: MealFeedback[],
  weekPlans: Record<string, WeekPlan>
): Record<TierRank, TierItem[]> {
  const empty: Record<TierRank, TierItem[]> = { S: [], A: [], B: [], C: [], D: [] };

  if (feedbacks.length < 3) {
    return empty;
  }

  // Group feedbacks by assemblyId
  const grouped = new Map<string, number[]>();
  for (const fb of feedbacks) {
    const existing = grouped.get(fb.assemblyId) ?? [];
    existing.push(fb.pleasure);
    grouped.set(fb.assemblyId, existing);
  }

  const items: TierItem[] = [];

  for (const [assemblyId, pleasures] of grouped.entries()) {
    const avgPleasure = pleasures.reduce((sum, p) => sum + p, 0) / pleasures.length;
    const count = pleasures.length;
    const { name, nutriGrade } = getAssemblyName(assemblyId, weekPlans);
    const score =
      (avgPleasure / 5) * 0.6 + (nutriScoreToNum(nutriGrade) / 5) * 0.4;

    items.push({ assemblyId, name, nutriGrade, avgPleasure, count, score });
  }

  // Sort by score descending
  items.sort((a, b) => b.score - a.score);

  const result: Record<TierRank, TierItem[]> = { S: [], A: [], B: [], C: [], D: [] };

  for (const item of items) {
    let rank: TierRank;
    if (item.score >= 0.9) rank = 'S';
    else if (item.score >= 0.7) rank = 'A';
    else if (item.score >= 0.5) rank = 'B';
    else if (item.score >= 0.3) rank = 'C';
    else rank = 'D';
    result[rank].push(item);
  }

  return result;
}
