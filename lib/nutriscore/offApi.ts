import type { NutriGrade, NutriScoreResult } from '@/types';

interface OFFProduct {
  product_name?: string;
  nutrition_grades?: string;
  nutriscore_score?: number;
  nutriscore_data?: Record<string, unknown>;
  nutriments?: Record<string, number>;
  categories_tags?: string[];
}

interface OFFResponse {
  status: number;
  product?: OFFProduct;
}

const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';
const USER_AGENT = 'AssemblEat/1.0 (contact@assembleat.app)';
const CACHE_PREFIX = 'off-';

/**
 * Récupère le Nutri-Score d'un produit via l'API Open Food Facts v2.
 * Les résultats sont mis en cache dans sessionStorage.
 *
 * @returns NutriScoreResult si trouvé, null sinon (déclenche le fallback local)
 */
export async function fetchNutriScore(barcode: string): Promise<NutriScoreResult | null> {
  const cacheKey = `${CACHE_PREFIX}${barcode}`;

  // Vérifier le cache sessionStorage
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as NutriScoreResult;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
  }

  try {
    const fields = [
      'product_name',
      'nutrition_grades',
      'nutriscore_score',
      'nutriscore_data',
      'nutriments',
      'categories_tags',
    ].join(',');

    const response = await fetch(`${OFF_BASE_URL}/${barcode}?fields=${fields}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) return null;

    const data: OFFResponse = await response.json();

    if (!data.product || !data.product.nutrition_grades) {
      return null;
    }

    const grade = data.product.nutrition_grades.toUpperCase() as NutriGrade;
    if (!['A', 'B', 'C', 'D', 'E'].includes(grade)) return null;

    const result: NutriScoreResult = {
      grade,
      score: data.product.nutriscore_score ?? 0,
      nPoints: 0,
      pPoints: 0,
      details: {
        energy: 0,
        sugars: 0,
        saturatedFat: 0,
        salt: 0,
        fiber: 0,
        protein: 0,
        fruitVeg: 0,
      },
    };

    // Mettre en cache
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // sessionStorage plein — ignorer silencieusement
      }
    }

    return result;
  } catch {
    // Erreur réseau → fallback sur l'algorithme local
    return null;
  }
}
