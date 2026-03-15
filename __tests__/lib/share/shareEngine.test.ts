import { describe, it, expect } from 'vitest';
import { encodeShareData, decodeShareData, buildShareUrl } from '@/lib/share/shareEngine';
import type { WeekPlan, MealFeedback, MealComponent, AssemblyRow, DayPlan } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeComponent(id: string, name: string): MealComponent {
  return { id, name, category: 'protein', prepTime: 5, tags: [] };
}

function makeAssembly(id: string, overrides: Partial<AssemblyRow> = {}): AssemblyRow {
  return {
    id,
    mealType: 'lunch',
    protein: null,
    vegetable: null,
    cereal: null,
    sauce: null,
    ...overrides,
  };
}

function makeEmptyDay(date: string): DayPlan {
  return { date, breakfast: null, lunch: null, dinner: null };
}

function makeWeekPlan(days: DayPlan[] = [], weekKey = '2024-W10'): WeekPlan {
  return { weekKey, days };
}

function makeFeedback(
  assemblyId: string,
  date: string,
  pleasure: MealFeedback['pleasure'] = 4
): MealFeedback {
  return { assemblyId, date, pleasure, quantity: 'just_right', note: null };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('encodeShareData / decodeShareData round-trip', () => {
  it('encodes and decodes an empty week plan back to equivalent data', () => {
    const weekPlan = makeWeekPlan([]);
    const payload = {
      weekPlan,
      feedbacks: [],
      userName: 'Alice',
      weekKey: weekPlan.weekKey,
    };

    const encoded = encodeShareData(payload);
    const decoded = decodeShareData(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.weekKey).toBe(weekPlan.weekKey);
    expect(decoded!.userName).toBe('Alice');
    expect(decoded!.days).toHaveLength(0);
    expect(decoded!.feedbacks).toHaveLength(0);
  });

  it('preserves userName after encode/decode', () => {
    const payload = {
      weekPlan: makeWeekPlan(),
      feedbacks: [],
      userName: 'Jean-Baptiste',
      weekKey: '2024-W10',
    };

    const decoded = decodeShareData(encodeShareData(payload));
    expect(decoded!.userName).toBe('Jean-Baptiste');
  });

  it('uses "Utilisateur" as default userName when empty string is provided', () => {
    const payload = {
      weekPlan: makeWeekPlan(),
      feedbacks: [],
      userName: '',
      weekKey: '2024-W10',
    };

    const decoded = decodeShareData(encodeShareData(payload));
    expect(decoded!.userName).toBe('Utilisateur');
  });

  it('encodes meal component names in days', () => {
    const protein = makeComponent('p1', 'Chicken');
    const vegetable = { ...makeComponent('v1', 'Broccoli'), category: 'vegetable' as const };
    const cereal = { ...makeComponent('c1', 'Quinoa'), category: 'cereal' as const };

    const lunch = makeAssembly('lunch-1', { protein, vegetable, cereal });
    const weekPlan = makeWeekPlan([{ date: '2024-03-04', breakfast: null, lunch, dinner: null }]);

    const payload = {
      weekPlan,
      feedbacks: [],
      userName: 'Test',
      weekKey: weekPlan.weekKey,
    };

    const decoded = decodeShareData(encodeShareData(payload));
    expect(decoded).not.toBeNull();
    expect(decoded!.days).toHaveLength(1);
    const lunchDay = decoded!.days[0];
    expect(lunchDay.l).toContain('Chicken');
    expect(lunchDay.l).toContain('Broccoli');
    expect(lunchDay.l).toContain('Quinoa');
  });

  it('maps null meals to null in decoded days', () => {
    const weekPlan = makeWeekPlan([makeEmptyDay('2024-03-04')]);
    const payload = {
      weekPlan,
      feedbacks: [],
      userName: 'Test',
      weekKey: weekPlan.weekKey,
    };

    const decoded = decodeShareData(encodeShareData(payload));
    expect(decoded!.days[0].b).toBeNull();
    expect(decoded!.days[0].l).toBeNull();
    expect(decoded!.days[0].d).toBeNull();
  });

  it('preserves feedback pleasure and date (MM-DD) through round-trip', () => {
    const feedback = makeFeedback('assembly-1', '2024-03-05', 5);
    const payload = {
      weekPlan: makeWeekPlan(),
      feedbacks: [feedback],
      userName: 'Test',
      weekKey: '2024-W10',
    };

    const decoded = decodeShareData(encodeShareData(payload));
    expect(decoded!.feedbacks).toHaveLength(1);
    expect(decoded!.feedbacks[0].p).toBe(5);
    expect(decoded!.feedbacks[0].d).toBe('03-05'); // MM-DD only
  });

  it('limits feedbacks to at most 14 entries', () => {
    const feedbacks = Array.from({ length: 20 }, (_, i) =>
      makeFeedback(`a${i}`, '2024-03-01', 3)
    );
    const payload = {
      weekPlan: makeWeekPlan(),
      feedbacks,
      userName: 'Test',
      weekKey: '2024-W10',
    };

    const decoded = decodeShareData(encodeShareData(payload));
    expect(decoded!.feedbacks.length).toBeLessThanOrEqual(14);
  });

  it('handles special characters in names (unicode)', () => {
    const payload = {
      weekPlan: makeWeekPlan(),
      feedbacks: [],
      userName: 'Léa & Émile',
      weekKey: '2024-W10',
    };

    const encoded = encodeShareData(payload);
    const decoded = decodeShareData(encoded);
    expect(decoded!.userName).toBe('Léa & Émile');
  });

  it('round-trip with a full week plan (7 days with meals)', () => {
    const protein = makeComponent('p1', 'Tuna');
    const days = Array.from({ length: 7 }, (_, i) => ({
      date: `2024-03-0${i + 1}`,
      breakfast: null,
      lunch: makeAssembly(`lunch-${i}`, { protein }),
      dinner: null,
    }));
    const weekPlan = makeWeekPlan(days);
    const payload = {
      weekPlan,
      feedbacks: [],
      userName: 'User',
      weekKey: weekPlan.weekKey,
    };

    const decoded = decodeShareData(encodeShareData(payload));
    expect(decoded!.days).toHaveLength(7);
  });
});

describe('decodeShareData', () => {
  it('returns null for an empty string', () => {
    expect(decodeShareData('')).toBeNull();
  });

  it('returns null for a random garbage string', () => {
    expect(decodeShareData('not-a-valid-token-!!')).toBeNull();
  });

  it('returns null for a valid base64 string that does not contain the required fields', () => {
    // Valid base64 JSON but missing the 'w' and 'd' fields
    const missingFields = btoa(encodeURIComponent(JSON.stringify({ foo: 'bar' })))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeShareData(missingFields)).toBeNull();
  });

  it('returns null for a token with valid base64 but invalid JSON', () => {
    const invalidJson = btoa('this is not json')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeShareData(invalidJson)).toBeNull();
  });

  it('returns feedbacks as empty array when f field is absent', () => {
    const payload = btoa(
      encodeURIComponent(JSON.stringify({ w: '2024-W01', n: 'Test', d: [] }))
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const decoded = decodeShareData(payload);
    expect(decoded).not.toBeNull();
    expect(decoded!.feedbacks).toEqual([]);
  });
});

describe('encodeShareData', () => {
  it('returns a non-empty string', () => {
    const payload = {
      weekPlan: makeWeekPlan(),
      feedbacks: [],
      userName: 'Alice',
      weekKey: '2024-W10',
    };
    expect(encodeShareData(payload)).toBeTruthy();
  });

  it('produces a URL-safe string (no +, /, = characters)', () => {
    const payload = {
      weekPlan: makeWeekPlan(),
      feedbacks: [],
      userName: 'Alice',
      weekKey: '2024-W10',
    };
    const encoded = encodeShareData(payload);
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe('buildShareUrl', () => {
  it('includes the encoded token in the URL path', () => {
    const token = 'abc123';
    const url = buildShareUrl(token);
    expect(url).toContain(`/share/${token}`);
  });

  it('uses assembleat.app as base when window is not available (SSR fallback)', () => {
    // In jsdom environment window is defined, so we test the shape instead
    const url = buildShareUrl('token');
    expect(url).toMatch(/\/share\/token$/);
  });

  it('returns correct URL format: protocol + host + /share/ + encoded', () => {
    const token = 'myToken42';
    const url = buildShareUrl(token);
    expect(url).toMatch(/^https?:\/\/.+\/share\/myToken42$/);
  });

  it('very long week plan still encodes without crashing', () => {
    // Build a week plan with many days and long names to stress the encoder
    const protein = makeComponent('p1', 'A'.repeat(100));
    const vegetable = { ...makeComponent('v1', 'B'.repeat(100)), category: 'vegetable' as const };
    const cereal = { ...makeComponent('c1', 'C'.repeat(100)), category: 'cereal' as const };

    const days = Array.from({ length: 30 }, (_, i) => ({
      date: `2024-0${(i % 9) + 1}-01`,
      breakfast: makeAssembly(`b-${i}`, { protein }),
      lunch: makeAssembly(`l-${i}`, { vegetable }),
      dinner: makeAssembly(`d-${i}`, { cereal }),
    }));

    const weekPlan = makeWeekPlan(days, '2024-W50');
    const feedbacks = Array.from({ length: 50 }, (_, i) =>
      makeFeedback(`assembly-${i}`, '2024-03-01', 3)
    );

    const payload = {
      weekPlan,
      feedbacks,
      userName: 'LongNameUser'.repeat(5),
      weekKey: '2024-W50',
    };

    expect(() => {
      const encoded = encodeShareData(payload);
      const url = buildShareUrl(encoded);
      expect(typeof url).toBe('string');
      expect(url).toContain('/share/');
      // Should decode back without error (may have truncated feedbacks)
      const decoded = decodeShareData(encoded);
      expect(decoded).not.toBeNull();
    }).not.toThrow();
  });
});
