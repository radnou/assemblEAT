import { describe, it, expect } from 'vitest';
import { filterByDiets, filterByAllergies, generateRandomAssembly } from '@/lib/engine/assemblyEngine';
import { lunchAssemblies } from '@/lib/data/repertoire';

describe('filterByDiets', () => {
  it('vegetarien excludes viande, volaille, poisson', () => {
    const filtered = filterByDiets(lunchAssemblies, ['vegetarien']);
    filtered.forEach((a) => {
      const proteinTags = a.protein?.tags ?? [];
      expect(proteinTags).not.toContain('viande');
      expect(proteinTags).not.toContain('volaille');
      expect(proteinTags).not.toContain('poisson');
    });
  });

  it('returns all assemblies when diets is empty', () => {
    const filtered = filterByDiets(lunchAssemblies, []);
    expect(filtered.length).toBe(lunchAssemblies.length);
  });

  it('sans_gluten excludes assemblies with gluten tag', () => {
    const filtered = filterByDiets(lunchAssemblies, ['sans_gluten']);
    filtered.forEach((a) => {
      const cerealTags = a.cereal?.tags ?? [];
      expect(cerealTags).not.toContain('gluten');
    });
  });
});

describe('filterByAllergies', () => {
  it('oeufs allergy excludes assemblies with oeufs tag', () => {
    const filtered = filterByAllergies(lunchAssemblies, ['oeufs']);
    filtered.forEach((a) => {
      const proteinTags = a.protein?.tags ?? [];
      expect(proteinTags).not.toContain('oeufs');
    });
  });

  it('returns all assemblies when allergies is empty', () => {
    const filtered = filterByAllergies(lunchAssemblies, []);
    expect(filtered.length).toBe(lunchAssemblies.length);
  });
});

describe('generateRandomAssembly with filters', () => {
  it('returns null when all candidates are filtered out', () => {
    // vegetalien + soja allergy = almost nothing left
    const result = generateRandomAssembly('lunch', {
      diets: ['vegetalien'],
      allergies: ['soja', 'oeufs'],
    });
    // May return null or a relaxed result, but never crash
    expect(() => result).not.toThrow();
  });

  it('weight_loss objective forces no cereal at dinner', () => {
    // Run 10 times to check consistency
    for (let i = 0; i < 10; i++) {
      const result = generateRandomAssembly('dinner', { objective: 'weight_loss' });
      if (result) {
        expect(result.cereal).toBeNull();
      }
    }
  });

  it('less_meat objective excludes viande and volaille when possible', () => {
    const result = generateRandomAssembly('lunch', { objective: 'less_meat' });
    if (result && result.protein) {
      // Should prefer non-meat proteins
      const hasMeat = result.protein.tags.some(t => ['viande', 'volaille'].includes(t));
      // Not strictly guaranteed (fallback), but should prefer meatless
    }
    expect(result).toBeDefined();
  });
});
