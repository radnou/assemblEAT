import type { CiqualEntry } from '@/types';

/**
 * Valeurs nutritionnelles de référence issues de la base CIQUAL (ANSES)
 * pour les ingrédients bruts du répertoire AssemblEat.
 * Valeurs pour 100g d'aliment.
 */
export const ciqualDatabase: Record<string, CiqualEntry> = {
  // ─── Protéines ─────────────────────────────────
  'poulet-grille': {
    id: 'poulet-grille',
    name: 'Poulet grillé',
    nutrients: { energy_kj: 695, sugars: 0, saturated_fat: 1.3, salt: 0.3, fiber: 0, protein: 26 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'thon-conserve': {
    id: 'thon-conserve',
    name: 'Thon en conserve (au naturel)',
    nutrients: { energy_kj: 460, sugars: 0, saturated_fat: 0.3, salt: 0.8, fiber: 0, protein: 26 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'oeufs-durs': {
    id: 'oeufs-durs',
    name: 'Œufs durs',
    nutrients: { energy_kj: 612, sugars: 0.4, saturated_fat: 3.3, salt: 0.4, fiber: 0, protein: 12.6 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'maquereau-conserve': {
    id: 'maquereau-conserve',
    name: 'Maquereau en conserve',
    nutrients: { energy_kj: 870, sugars: 0, saturated_fat: 3.3, salt: 1.1, fiber: 0, protein: 24 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'lentilles-cuites': {
    id: 'lentilles-cuites',
    name: 'Lentilles cuites',
    nutrients: { energy_kj: 480, sugars: 0.8, saturated_fat: 0.1, salt: 0.02, fiber: 7.9, protein: 9 },
    fruitVegPercent: 80,
    category: 'general',
  },
  'pois-chiches-cuits': {
    id: 'pois-chiches-cuits',
    name: 'Pois chiches cuits',
    nutrients: { energy_kj: 570, sugars: 2.6, saturated_fat: 0.3, salt: 0.02, fiber: 7.6, protein: 8.9 },
    fruitVegPercent: 80,
    category: 'general',
  },
  'tofu-nature': {
    id: 'tofu-nature',
    name: 'Tofu nature',
    nutrients: { energy_kj: 510, sugars: 0.7, saturated_fat: 0.9, salt: 0.05, fiber: 0.3, protein: 12.7 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'saumon-vapeur': {
    id: 'saumon-vapeur',
    name: 'Saumon cuit vapeur',
    nutrients: { energy_kj: 820, sugars: 0, saturated_fat: 2.2, salt: 0.1, fiber: 0, protein: 22 },
    fruitVegPercent: 0,
    category: 'general',
  },

  // ─── Féculents / Céréales ─────────────────────
  'riz-complet': {
    id: 'riz-complet',
    name: 'Riz complet cuit',
    nutrients: { energy_kj: 510, sugars: 0.4, saturated_fat: 0.3, salt: 0.01, fiber: 1.8, protein: 2.7 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'quinoa-cuit': {
    id: 'quinoa-cuit',
    name: 'Quinoa cuit',
    nutrients: { energy_kj: 502, sugars: 0.9, saturated_fat: 0.2, salt: 0.01, fiber: 2.8, protein: 4.4 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'patate-douce': {
    id: 'patate-douce',
    name: 'Patate douce cuite',
    nutrients: { energy_kj: 360, sugars: 4.2, saturated_fat: 0.02, salt: 0.04, fiber: 3, protein: 1.6 },
    fruitVegPercent: 80,
    category: 'general',
  },
  'semoule-complete': {
    id: 'semoule-complete',
    name: 'Semoule complète cuite',
    nutrients: { energy_kj: 460, sugars: 0.3, saturated_fat: 0.1, salt: 0.01, fiber: 3.6, protein: 4.5 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'pates-completes': {
    id: 'pates-completes',
    name: 'Pâtes complètes cuites',
    nutrients: { energy_kj: 520, sugars: 0.6, saturated_fat: 0.2, salt: 0.01, fiber: 3.9, protein: 5.3 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'pain-complet': {
    id: 'pain-complet',
    name: 'Pain complet',
    nutrients: { energy_kj: 962, sugars: 3.5, saturated_fat: 0.5, salt: 1.2, fiber: 6.5, protein: 9.7 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'flocons-avoine': {
    id: 'flocons-avoine',
    name: "Flocons d'avoine",
    nutrients: { energy_kj: 1560, sugars: 1.1, saturated_fat: 1.2, salt: 0.01, fiber: 10.6, protein: 13.5 },
    fruitVegPercent: 0,
    category: 'general',
  },

  // ─── Légumes ──────────────────────────────────
  'brocolis-vapeur': {
    id: 'brocolis-vapeur',
    name: 'Brocolis cuits vapeur',
    nutrients: { energy_kj: 146, sugars: 1.7, saturated_fat: 0.04, salt: 0.04, fiber: 3.3, protein: 2.8 },
    fruitVegPercent: 100,
    category: 'general',
  },
  'courgettes-grillees': {
    id: 'courgettes-grillees',
    name: 'Courgettes grillées',
    nutrients: { energy_kj: 109, sugars: 2.5, saturated_fat: 0.08, salt: 0.01, fiber: 1.1, protein: 1.2 },
    fruitVegPercent: 100,
    category: 'general',
  },
  'carottes-vapeur': {
    id: 'carottes-vapeur',
    name: 'Carottes cuites vapeur',
    nutrients: { energy_kj: 150, sugars: 4.7, saturated_fat: 0.04, salt: 0.08, fiber: 2.8, protein: 0.8 },
    fruitVegPercent: 100,
    category: 'general',
  },
  'haricots-verts': {
    id: 'haricots-verts',
    name: 'Haricots verts cuits',
    nutrients: { energy_kj: 130, sugars: 1.4, saturated_fat: 0.04, salt: 0.01, fiber: 3.4, protein: 1.8 },
    fruitVegPercent: 100,
    category: 'general',
  },
  'epinards-cuits': {
    id: 'epinards-cuits',
    name: 'Épinards cuits',
    nutrients: { energy_kj: 105, sugars: 0.4, saturated_fat: 0.05, salt: 0.2, fiber: 2.2, protein: 2.9 },
    fruitVegPercent: 100,
    category: 'general',
  },
  'tomates': {
    id: 'tomates',
    name: 'Tomates crues',
    nutrients: { energy_kj: 80, sugars: 2.6, saturated_fat: 0.03, salt: 0.01, fiber: 1.2, protein: 0.9 },
    fruitVegPercent: 100,
    category: 'general',
  },
  'concombre': {
    id: 'concombre',
    name: 'Concombre cru',
    nutrients: { energy_kj: 52, sugars: 1.7, saturated_fat: 0.02, salt: 0.01, fiber: 0.5, protein: 0.7 },
    fruitVegPercent: 100,
    category: 'general',
  },

  // ─── Sauces / Condiments ──────────────────────
  'vinaigrette-maison': {
    id: 'vinaigrette-maison',
    name: 'Vinaigrette maison',
    nutrients: { energy_kj: 1400, sugars: 1.5, saturated_fat: 1.8, salt: 1.0, fiber: 0, protein: 0.2 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'sauce-soja': {
    id: 'sauce-soja',
    name: 'Sauce soja',
    nutrients: { energy_kj: 250, sugars: 2.4, saturated_fat: 0.01, salt: 14.5, fiber: 0.8, protein: 8.7 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'houmous': {
    id: 'houmous',
    name: 'Houmous',
    nutrients: { energy_kj: 1100, sugars: 0.9, saturated_fat: 2.1, salt: 0.8, fiber: 5.4, protein: 7.9 },
    fruitVegPercent: 40,
    category: 'general',
  },

  // ─── Petit-déjeuner ───────────────────────────
  'yaourt-nature': {
    id: 'yaourt-nature',
    name: 'Yaourt nature',
    nutrients: { energy_kj: 260, sugars: 4.7, saturated_fat: 1.1, salt: 0.15, fiber: 0, protein: 4.3 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'banane': {
    id: 'banane',
    name: 'Banane',
    nutrients: { energy_kj: 378, sugars: 12.2, saturated_fat: 0.1, salt: 0.01, fiber: 2.6, protein: 1.1 },
    fruitVegPercent: 100,
    category: 'general',
  },
  'fromage-blanc': {
    id: 'fromage-blanc',
    name: 'Fromage blanc 3%',
    nutrients: { energy_kj: 290, sugars: 3.9, saturated_fat: 1.7, salt: 0.1, fiber: 0, protein: 7.5 },
    fruitVegPercent: 0,
    category: 'general',
  },
  'miel': {
    id: 'miel',
    name: 'Miel',
    nutrients: { energy_kj: 1340, sugars: 81.7, saturated_fat: 0, salt: 0.01, fiber: 0, protein: 0.3 },
    fruitVegPercent: 0,
    category: 'general',
  },
};

/**
 * Retrouve une entrée CIQUAL par son ID de référence
 */
export function getCiqualEntry(refId: string): CiqualEntry | null {
  return ciqualDatabase[refId] ?? null;
}
