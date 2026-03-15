import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useMealStore } from '@/lib/store/useMealStore';
import type { AssemblyRow, MealFeedback, UserProfile } from '@/types';

// ─── localStorage mock ───────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeAssembly = (id: string): AssemblyRow => ({
  id,
  mealType: 'lunch',
  protein: null,
  vegetable: null,
  cereal: null,
  sauce: null,
});

const makeFeedback = (assemblyId: string, date: string): MealFeedback => ({
  assemblyId,
  date,
  pleasure: 4,
  quantity: 'just_right',
  note: null,
});

const makeProfile = (): UserProfile => ({
  firstName: 'Alice',
  language: 'fr',
  rules: { antiRedundancy: true, starchWarning: true },
  avatarEmoji: '🥗',
  objective: 'balanced',
  diets: [],
  allergies: [],
  householdSize: 1,
  cookingTime: 'moderate',
  mealsToTrack: ['lunch', 'dinner'],
  onboardingCompleted: true,
});

// ─── Reset store state before each test ──────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear();
  act(() => {
    useMealStore.setState({
      todayBreakfast: null,
      todayLunch: null,
      todayDinner: null,
      weekPlans: {},
      recentProteins: [],
      feedbacks: [],
      onboardingCompleted: false,
      tourCompleted: false,
      streakCount: 0,
      streakLastDate: null,
      hydrated: false,
      settings: {
        firstName: '',
        language: 'fr',
        rules: { antiRedundancy: true, starchWarning: true },
      },
    });
  });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useMealStore — hydrate', () => {
  it('sets hydrated to true', () => {
    expect(useMealStore.getState().hydrated).toBe(false);
    act(() => {
      useMealStore.getState().hydrate();
    });
    expect(useMealStore.getState().hydrated).toBe(true);
  });
});

describe('useMealStore — setTodayMeal', () => {
  it('stores the assembly for breakfast', () => {
    const assembly = makeAssembly('asm-1');
    act(() => {
      useMealStore.getState().setTodayMeal('breakfast', assembly);
    });
    expect(useMealStore.getState().todayBreakfast).toEqual(assembly);
    expect(useMealStore.getState().todayLunch).toBeNull();
    expect(useMealStore.getState().todayDinner).toBeNull();
  });

  it('stores the assembly for lunch', () => {
    const assembly = makeAssembly('asm-2');
    act(() => {
      useMealStore.getState().setTodayMeal('lunch', assembly);
    });
    expect(useMealStore.getState().todayLunch).toEqual(assembly);
  });

  it('stores the assembly for dinner', () => {
    const assembly = makeAssembly('asm-3');
    act(() => {
      useMealStore.getState().setTodayMeal('dinner', assembly);
    });
    expect(useMealStore.getState().todayDinner).toEqual(assembly);
  });
});

describe('useMealStore — addFeedback', () => {
  it('adds a new feedback to the feedbacks array', () => {
    const feedback = makeFeedback('asm-1', '2024-01-01');
    act(() => {
      useMealStore.getState().addFeedback(feedback);
    });
    expect(useMealStore.getState().feedbacks).toHaveLength(1);
    expect(useMealStore.getState().feedbacks[0]).toEqual(feedback);
  });

  it('replaces an existing feedback with same assemblyId+date', () => {
    const feedback1 = makeFeedback('asm-1', '2024-01-01');
    const feedback2: MealFeedback = { ...feedback1, pleasure: 2 };

    act(() => {
      useMealStore.getState().addFeedback(feedback1);
    });
    act(() => {
      useMealStore.getState().addFeedback(feedback2);
    });

    const feedbacks = useMealStore.getState().feedbacks;
    expect(feedbacks).toHaveLength(1);
    expect(feedbacks[0].pleasure).toBe(2);
  });

  it('keeps distinct feedbacks with different assemblyId or date', () => {
    act(() => {
      useMealStore.getState().addFeedback(makeFeedback('asm-1', '2024-01-01'));
      useMealStore.getState().addFeedback(makeFeedback('asm-2', '2024-01-01'));
      useMealStore.getState().addFeedback(makeFeedback('asm-1', '2024-01-02'));
    });
    expect(useMealStore.getState().feedbacks).toHaveLength(3);
  });
});

describe('useMealStore — toggleBatchItem', () => {
  it('toggles the checked state of an item', () => {
    const state = useMealStore.getState();
    const firstItem = state.batchItems[0];
    expect(firstItem.checked).toBe(false);

    act(() => {
      useMealStore.getState().toggleBatchItem(firstItem.id);
    });
    expect(useMealStore.getState().batchItems[0].checked).toBe(true);

    act(() => {
      useMealStore.getState().toggleBatchItem(firstItem.id);
    });
    expect(useMealStore.getState().batchItems[0].checked).toBe(false);
  });

  it('only affects the targeted item', () => {
    const state = useMealStore.getState();
    const firstId = state.batchItems[0].id;

    act(() => {
      useMealStore.getState().toggleBatchItem(firstId);
    });

    const others = useMealStore.getState().batchItems.slice(1);
    expect(others.every((i) => i.checked === false)).toBe(true);
  });
});

describe('useMealStore — resetBatch', () => {
  it('resets all batch items to checked=false', () => {
    // toggle a few items first
    const items = useMealStore.getState().batchItems;
    act(() => {
      useMealStore.getState().toggleBatchItem(items[0].id);
      useMealStore.getState().toggleBatchItem(items[1].id);
    });
    expect(useMealStore.getState().batchItems.some((i) => i.checked)).toBe(true);

    act(() => {
      useMealStore.getState().resetBatch();
    });
    expect(useMealStore.getState().batchItems.every((i) => !i.checked)).toBe(true);
  });
});

describe('useMealStore — completeOnboarding', () => {
  it('sets onboardingCompleted to true', () => {
    expect(useMealStore.getState().onboardingCompleted).toBe(false);
    act(() => {
      useMealStore.getState().completeOnboarding(makeProfile());
    });
    expect(useMealStore.getState().onboardingCompleted).toBe(true);
  });

  it('persists the profile settings', () => {
    const profile = makeProfile();
    act(() => {
      useMealStore.getState().completeOnboarding(profile);
    });
    expect(useMealStore.getState().settings.firstName).toBe('Alice');
    expect(useMealStore.getState().settings.language).toBe('fr');
  });
});

describe('useMealStore — checkAndUpdateStreak', () => {
  it('starts streak at 1 on first call', () => {
    act(() => {
      useMealStore.getState().checkAndUpdateStreak();
    });
    expect(useMealStore.getState().streakCount).toBe(1);
  });

  it('does not increment when called twice the same day', () => {
    act(() => {
      useMealStore.getState().checkAndUpdateStreak();
      useMealStore.getState().checkAndUpdateStreak();
    });
    expect(useMealStore.getState().streakCount).toBe(1);
  });

  it('increments streak on consecutive days', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    // Simulate that we already validated yesterday
    act(() => {
      useMealStore.setState({ streakCount: 3, streakLastDate: yesterdayStr });
    });

    act(() => {
      useMealStore.getState().checkAndUpdateStreak();
    });

    expect(useMealStore.getState().streakCount).toBe(4);
  });

  it('resets streak to 1 when there is a gap', () => {
    // Last validated 3 days ago — not yesterday
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toLocaleDateString('en-CA');

    act(() => {
      useMealStore.setState({ streakCount: 5, streakLastDate: threeDaysAgoStr });
    });

    act(() => {
      useMealStore.getState().checkAndUpdateStreak();
    });

    expect(useMealStore.getState().streakCount).toBe(1);
  });
});

describe('useMealStore — resetAll', () => {
  it('clears today meals, streak, weekPlans, and recentProteins', () => {
    // Populate some state
    act(() => {
      useMealStore.getState().setTodayMeal('lunch', makeAssembly('asm-1'));
      useMealStore.setState({ streakCount: 5, streakLastDate: '2024-01-01' });
      useMealStore.getState().addRecentProtein('chicken');
    });

    act(() => {
      useMealStore.getState().resetAll();
    });

    const state = useMealStore.getState();
    expect(state.todayLunch).toBeNull();
    expect(state.todayBreakfast).toBeNull();
    expect(state.todayDinner).toBeNull();
    expect(state.streakCount).toBe(0);
    expect(state.streakLastDate).toBeNull();
    expect(state.weekPlans).toEqual({});
    expect(state.recentProteins).toHaveLength(0);
  });

  it('resets all batch items to unchecked', () => {
    const firstId = useMealStore.getState().batchItems[0].id;
    act(() => {
      useMealStore.getState().toggleBatchItem(firstId);
    });

    act(() => {
      useMealStore.getState().resetAll();
    });

    expect(useMealStore.getState().batchItems.every((i) => !i.checked)).toBe(true);
  });
});
