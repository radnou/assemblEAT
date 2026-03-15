import { describe, it, expect } from 'vitest';
import { getCiqualEntry, ciqualDatabase } from '@/lib/nutriscore/ciqual-ref';
import type { CiqualEntry } from '@/types';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getCiqualEntry', () => {
  it('returns an entry for a known ID', () => {
    const entry = getCiqualEntry('poulet-grille');
    expect(entry).not.toBeNull();
    expect(entry!.id).toBe('poulet-grille');
    expect(entry!.name).toBe('Poulet grillé');
  });

  it('returns null for an unknown ID', () => {
    expect(getCiqualEntry('this-does-not-exist')).toBeNull();
  });

  it('returns null for an empty string ID', () => {
    expect(getCiqualEntry('')).toBeNull();
  });

  it('broccoli entry has correct nutrient values', () => {
    const entry = getCiqualEntry('brocolis-vapeur');
    expect(entry).not.toBeNull();
    const { nutrients } = entry!;
    expect(nutrients.energy_kj).toBe(146);
    expect(nutrients.sugars).toBe(1.7);
    expect(nutrients.saturated_fat).toBeCloseTo(0.04);
    expect(nutrients.salt).toBeCloseTo(0.04);
    expect(nutrients.fiber).toBe(3.3);
    expect(nutrients.protein).toBe(2.8);
  });

  it('broccoli has fruitVegPercent of 100', () => {
    const entry = getCiqualEntry('brocolis-vapeur');
    expect(entry!.fruitVegPercent).toBe(100);
  });

  it('chicken entry has correct nutrient values', () => {
    const entry = getCiqualEntry('poulet-grille');
    expect(entry).not.toBeNull();
    expect(entry!.nutrients.energy_kj).toBe(695);
    expect(entry!.nutrients.protein).toBe(26);
    expect(entry!.nutrients.saturated_fat).toBe(1.3);
    expect(entry!.nutrients.salt).toBe(0.3);
    expect(entry!.nutrients.fiber).toBe(0);
    expect(entry!.fruitVegPercent).toBe(0);
  });

  it('lentils have a high fruitVegPercent (legumes)', () => {
    const entry = getCiqualEntry('lentilles-cuites');
    expect(entry!.fruitVegPercent).toBe(80);
  });

  it('chickpeas have a high fruitVegPercent (legumes)', () => {
    const entry = getCiqualEntry('pois-chiches-cuits');
    expect(entry!.fruitVegPercent).toBe(80);
  });

  it('honey entry has very high sugar value', () => {
    const entry = getCiqualEntry('miel');
    expect(entry).not.toBeNull();
    expect(entry!.nutrients.sugars).toBeGreaterThan(80);
  });

  it('each returned entry has the correct shape', () => {
    const knownIds = [
      'poulet-grille',
      'brocolis-vapeur',
      'riz-complet',
      'vinaigrette-maison',
      'yaourt-nature',
    ];
    for (const id of knownIds) {
      const entry = getCiqualEntry(id);
      expect(entry).not.toBeNull();
      expect(typeof entry!.id).toBe('string');
      expect(typeof entry!.name).toBe('string');
      expect(typeof entry!.fruitVegPercent).toBe('number');
      expect(['general', 'cheese', 'beverage', 'fat']).toContain(entry!.category);
    }
  });
});

describe('ciqualDatabase – data integrity', () => {
  it('every entry has all required nutrient fields', () => {
    for (const [id, entry] of Object.entries(ciqualDatabase)) {
      const { nutrients } = entry;
      expect(typeof nutrients.energy_kj, `energy_kj missing for ${id}`).toBe('number');
      expect(typeof nutrients.sugars, `sugars missing for ${id}`).toBe('number');
      expect(typeof nutrients.saturated_fat, `saturated_fat missing for ${id}`).toBe('number');
      expect(typeof nutrients.salt, `salt missing for ${id}`).toBe('number');
      expect(typeof nutrients.fiber, `fiber missing for ${id}`).toBe('number');
      expect(typeof nutrients.protein, `protein missing for ${id}`).toBe('number');
    }
  });

  it('every entry id matches its record key', () => {
    for (const [key, entry] of Object.entries(ciqualDatabase)) {
      expect(entry.id).toBe(key);
    }
  });

  it('all entries have a non-empty name', () => {
    for (const entry of Object.values(ciqualDatabase)) {
      expect(entry.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('fruitVegPercent is between 0 and 100 for all entries', () => {
    for (const entry of Object.values(ciqualDatabase)) {
      expect(entry.fruitVegPercent).toBeGreaterThanOrEqual(0);
      expect(entry.fruitVegPercent).toBeLessThanOrEqual(100);
    }
  });

  it('energy values are positive for all entries', () => {
    for (const entry of Object.values(ciqualDatabase)) {
      expect(entry.nutrients.energy_kj).toBeGreaterThanOrEqual(0);
    }
  });

  it('all entries have a valid category', () => {
    const validCategories = ['general', 'cheese', 'beverage', 'fat'];
    for (const entry of Object.values(ciqualDatabase)) {
      expect(validCategories).toContain(entry.category);
    }
  });

  it('database contains at least 20 entries', () => {
    expect(Object.keys(ciqualDatabase).length).toBeGreaterThanOrEqual(20);
  });

  it('getCiqualEntry and direct database access return the same object', () => {
    const id = 'saumon-vapeur';
    expect(getCiqualEntry(id)).toBe(ciqualDatabase[id]);
  });

  it('vegetables have fruitVegPercent = 100', () => {
    const vegetableIds = [
      'brocolis-vapeur',
      'courgettes-grillees',
      'carottes-vapeur',
      'haricots-verts',
      'epinards-cuits',
      'tomates',
      'concombre',
    ];
    for (const id of vegetableIds) {
      const entry = getCiqualEntry(id);
      expect(entry, `Entry missing for ${id}`).not.toBeNull();
      expect(entry!.fruitVegPercent, `fruitVegPercent wrong for ${id}`).toBe(100);
    }
  });

  it('pure animal proteins have fruitVegPercent = 0', () => {
    const proteinIds = ['poulet-grille', 'thon-conserve', 'oeufs-durs', 'saumon-vapeur'];
    for (const id of proteinIds) {
      const entry = getCiqualEntry(id);
      expect(entry!.fruitVegPercent).toBe(0);
    }
  });
});
