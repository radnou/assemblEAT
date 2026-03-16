import type { NutrientInput, NutriGrade, NutriScoreResult, FoodCategory } from '@/types';

// ─── Barèmes Nutri-Score v2 — aliments généraux ───────────────────

function scoreEnergy(kj: number): number {
  const thresholds = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
  for (let i = 0; i < thresholds.length; i++) {
    if (kj <= thresholds[i]) return i;
  }
  return 10;
}

function scoreSugars(g: number): number {
  const thresholds = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45, 54, 63, 72, 81, 90];
  for (let i = 0; i < thresholds.length; i++) {
    if (g <= thresholds[i]) return i;
  }
  return 15;
}

function scoreSaturatedFat(g: number): number {
  const thresholds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (let i = 0; i < thresholds.length; i++) {
    if (g <= thresholds[i]) return i;
  }
  return 10;
}

function scoreSalt(g: number): number {
  const thresholds = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0];
  for (let i = 0; i < thresholds.length; i++) {
    if (g <= thresholds[i]) return i;
  }
  return 15;
}

function scoreFiber(g: number): number {
  const thresholds = [0.9, 1.9, 2.8, 3.7, 4.7];
  for (let i = 0; i < thresholds.length; i++) {
    if (g <= thresholds[i]) return i;
  }
  return 5;
}

function scoreProtein(g: number): number {
  const thresholds = [1.6, 3.2, 4.8, 6.4, 8.0, 9.6, 11.2];
  for (let i = 0; i < thresholds.length; i++) {
    if (g <= thresholds[i]) return i;
  }
  return 7;
}

function scoreFruitVeg(percent: number): number {
  if (percent <= 40) return 0;
  if (percent <= 60) return 2;
  if (percent <= 80) return 4;
  return 5;
}

// ─── Barèmes Nutri-Score v2 — boissons ─────────────────────────────

function scoreEnergyBeverage(kj: number): number {
  const thresholds = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270];
  for (let i = 0; i < thresholds.length; i++) {
    if (kj <= thresholds[i]) return i;
  }
  return 10;
}

function scoreSugarsBeverage(g: number): number {
  const thresholds = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5];
  for (let i = 0; i < thresholds.length; i++) {
    if (g <= thresholds[i]) return i;
  }
  return 10;
}

// ─── Barèmes Nutri-Score v2 — corps gras ───────────────────────────

/**
 * Score le ratio AG saturés / lipides totaux (en %)
 * Spécifique à la catégorie "fat" du Nutri-Score v2
 */
function scoreSaturatedFatRatio(saturatedFat: number, totalFat: number): number {
  if (totalFat <= 0) return 0;
  const ratio = (saturatedFat / totalFat) * 100;
  const thresholds = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64];
  for (let i = 0; i < thresholds.length; i++) {
    if (ratio <= thresholds[i]) return i;
  }
  return 10;
}

// ─── Conversion score → grade ──────────────────────────────────────

/**
 * Convertit le score numérique final en grade Nutri-Score (A-E)
 * Barème aliments généraux v2
 */
function scoreToGrade(score: number): NutriGrade {
  if (score <= 0) return 'A';
  if (score <= 2) return 'B';
  if (score <= 10) return 'C';
  if (score <= 18) return 'D';
  return 'E';
}

/**
 * Grade Nutri-Score v2 pour les boissons
 */
function scoreToGradeBeverage(score: number): NutriGrade {
  if (score <= 1) return 'A';
  if (score <= 5) return 'B';
  if (score <= 9) return 'C';
  if (score <= 13) return 'D';
  return 'E';
}

/**
 * Grade Nutri-Score v2 pour les corps gras (huiles, beurre, margarines…)
 */
function scoreToGradeFat(score: number): NutriGrade {
  if (score <= -6) return 'A';
  if (score <= 2) return 'B';
  if (score <= 10) return 'C';
  if (score <= 18) return 'D';
  return 'E';
}

// ─── Fonction principale ───────────────────────────────────────────

/**
 * Calcule le Nutri-Score v2 pour un aliment.
 *
 * @param nutrients - Valeurs nutritionnelles pour 100g (ou 100ml pour les boissons)
 * @param fruitVegPercent - Pourcentage fruits/légumes/légumineuses (0-100)
 * @param category - Catégorie alimentaire (défaut: 'general')
 */
export function calculateNutriScore(
  nutrients: NutrientInput,
  fruitVegPercent: number,
  category: FoodCategory = 'general'
): NutriScoreResult {
  // Points négatifs (N) — adaptés selon la catégorie
  const energyPts = category === 'beverage'
    ? scoreEnergyBeverage(nutrients.energy_kj)
    : scoreEnergy(nutrients.energy_kj);

  const sugarsPts = category === 'beverage'
    ? scoreSugarsBeverage(nutrients.sugars)
    : scoreSugars(nutrients.sugars);

  const satFatPts = category === 'fat'
    ? scoreSaturatedFatRatio(nutrients.saturated_fat, nutrients.total_fat ?? 0)
    : scoreSaturatedFat(nutrients.saturated_fat);

  const saltPts = scoreSalt(nutrients.salt);
  const nPoints = energyPts + sugarsPts + satFatPts + saltPts;

  // Points positifs (P)
  const fiberPts = scoreFiber(nutrients.fiber);
  const proteinPts = scoreProtein(nutrients.protein);
  const fruitVegPts = scoreFruitVeg(fruitVegPercent);

  // Règle du plafond protéines v2 :
  // Si N >= 7 et catégorie != fromage, les protéines ne comptent pas
  const proteinCapped = nPoints >= 7 && category !== 'cheese';
  const pPoints = proteinCapped
    ? fiberPts + fruitVegPts
    : fiberPts + proteinPts + fruitVegPts;

  const score = nPoints - pPoints;

  // Grade selon la catégorie
  let grade: NutriGrade;
  if (category === 'beverage') {
    grade = scoreToGradeBeverage(score);
  } else if (category === 'fat') {
    grade = scoreToGradeFat(score);
  } else {
    grade = scoreToGrade(score);
  }

  return {
    grade,
    score,
    nPoints,
    pPoints,
    details: {
      energy: energyPts,
      sugars: sugarsPts,
      saturatedFat: satFatPts,
      salt: saltPts,
      fiber: fiberPts,
      protein: proteinPts,
      fruitVeg: fruitVegPts,
    },
  };
}
