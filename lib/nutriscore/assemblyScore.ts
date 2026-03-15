import type { AssemblyRow, AssemblyNutriScore, NutrientInput, NutriGrade } from '@/types';
import { calculateNutriScore } from './algorithm';
import { getCiqualEntry } from './ciqual-ref';
import { fetchNutriScore } from './offApi';

/**
 * Poids par défaut des composants dans un assemblage (en grammes)
 */
const DEFAULT_WEIGHTS: Record<string, number> = {
  protein: 150,
  vegetable: 200,
  cereal: 120,
  sauce: 30,
};

/**
 * Résout les données nutritionnelles d'un composant :
 * 1. Tente l'API Open Food Facts si un code-barres est présent
 * 2. Fallback sur les valeurs CIQUAL pré-encodées
 * 3. Retourne null si aucune donnée disponible
 */
async function resolveComponentNutrients(
  component: { ciqualRefId?: string; openFoodFactsBarcode?: string; name: string; id: string }
): Promise<{ nutrients: NutrientInput; fruitVegPercent: number; grade: NutriGrade; score: number } | null> {
  // Couche 1 : API Open Food Facts
  if (component.openFoodFactsBarcode) {
    const offResult = await fetchNutriScore(component.openFoodFactsBarcode);
    if (offResult) {
      return {
        nutrients: {
          energy_kj: 0,
          sugars: 0,
          saturated_fat: 0,
          salt: 0,
          fiber: 0,
          protein: 0,
        },
        fruitVegPercent: 0,
        grade: offResult.grade,
        score: offResult.score,
      };
    }
  }

  // Couche 2 : CIQUAL local
  if (component.ciqualRefId) {
    const entry = getCiqualEntry(component.ciqualRefId);
    if (entry) {
      const result = calculateNutriScore(entry.nutrients, entry.fruitVegPercent, entry.category);
      return {
        nutrients: entry.nutrients,
        fruitVegPercent: entry.fruitVegPercent,
        grade: result.grade,
        score: result.score,
      };
    }
  }

  return null;
}

/**
 * Calcule le Nutri-Score composite d'un assemblage complet.
 *
 * Méthode : moyenne pondérée par le poids de chaque composant,
 * puis calcul du Nutri-Score v2 sur les nutriments agrégés.
 */
export async function computeAssemblyScore(assembly: AssemblyRow): Promise<AssemblyNutriScore> {
  const components = [
    assembly.protein ? { ...assembly.protein, role: 'protein' } : null,
    assembly.vegetable ? { ...assembly.vegetable, role: 'vegetable' } : null,
    assembly.cereal ? { ...assembly.cereal, role: 'cereal' } : null,
    assembly.sauce ? { ...assembly.sauce, role: 'sauce' } : null,
  ].filter(Boolean) as Array<typeof assembly.protein & { role: string }>;

  const componentScores: AssemblyNutriScore['componentScores'] = [];
  let totalWeight = 0;
  const aggregatedNutrients: NutrientInput = {
    energy_kj: 0,
    sugars: 0,
    saturated_fat: 0,
    salt: 0,
    fiber: 0,
    protein: 0,
  };
  let weightedFruitVeg = 0;

  for (const comp of components) {
    if (!comp) continue;
    const resolved = await resolveComponentNutrients(comp);
    const weight = comp.weightG ?? DEFAULT_WEIGHTS[comp.role] ?? 100;

    if (resolved) {
      componentScores.push({
        id: comp.id,
        name: comp.name,
        grade: resolved.grade,
        score: resolved.score,
      });

      // Agréger les nutriments pondérés par le poids
      if (resolved.nutrients.energy_kj > 0) {
        const ratio = weight / 100;
        aggregatedNutrients.energy_kj += resolved.nutrients.energy_kj * ratio;
        aggregatedNutrients.sugars += resolved.nutrients.sugars * ratio;
        aggregatedNutrients.saturated_fat += resolved.nutrients.saturated_fat * ratio;
        aggregatedNutrients.salt += resolved.nutrients.salt * ratio;
        aggregatedNutrients.fiber += resolved.nutrients.fiber * ratio;
        aggregatedNutrients.protein += resolved.nutrients.protein * ratio;
        weightedFruitVeg += resolved.fruitVegPercent * weight;
      }
      totalWeight += weight;
    } else {
      componentScores.push({
        id: comp.id,
        name: comp.name,
        grade: 'C',
        score: 5,
      });
      totalWeight += weight;
    }
  }

  // Normaliser pour 100g
  if (totalWeight > 0) {
    const normFactor = 100 / totalWeight;
    aggregatedNutrients.energy_kj *= normFactor;
    aggregatedNutrients.sugars *= normFactor;
    aggregatedNutrients.saturated_fat *= normFactor;
    aggregatedNutrients.salt *= normFactor;
    aggregatedNutrients.fiber *= normFactor;
    aggregatedNutrients.protein *= normFactor;
    weightedFruitVeg = weightedFruitVeg / totalWeight;
  }

  const assemblyResult = calculateNutriScore(aggregatedNutrients, weightedFruitVeg);

  return {
    grade: assemblyResult.grade,
    score: assemblyResult.score,
    componentScores,
  };
}
