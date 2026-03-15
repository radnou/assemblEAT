import { describe, it, expect } from 'vitest';
import { isFeatureEnabled } from '@/lib/config/features';
import type { FeatureFlag, SubscriptionPlan } from '@/types';

// All known feature flags
const ALL_FLAGS: FeatureFlag[] = [
  'SHARE_WITH_DIETITIAN',
  'ADVANCED_REPERTOIRE',
  'WEEKLY_STATS',
  'MULTI_PROFILE',
  'PRACTITIONER_THREAD',
  'PRACTITIONER_GOALS',
  'SMART_SUGGESTIONS',
  'PHOTO_JOURNAL',
  'GROCERY_LIST',
  'CLOUD_SYNC',
  'FRIDGE_MODE',
  'FRIEND_COMPARE',
];

describe('isFeatureEnabled – free plan', () => {
  it('returns false for every feature flag on the free plan', () => {
    for (const flag of ALL_FLAGS) {
      expect(isFeatureEnabled(flag, 'free')).toBe(false);
    }
  });

  it('SHARE_WITH_DIETITIAN is disabled on free', () => {
    expect(isFeatureEnabled('SHARE_WITH_DIETITIAN', 'free')).toBe(false);
  });

  it('GROCERY_LIST is disabled on free', () => {
    expect(isFeatureEnabled('GROCERY_LIST', 'free')).toBe(false);
  });

  it('CLOUD_SYNC is disabled on free', () => {
    expect(isFeatureEnabled('CLOUD_SYNC', 'free')).toBe(false);
  });
});

describe('isFeatureEnabled – pro plan', () => {
  it('returns true for every feature flag on the pro plan', () => {
    for (const flag of ALL_FLAGS) {
      expect(isFeatureEnabled(flag, 'pro')).toBe(true);
    }
  });

  it('SHARE_WITH_DIETITIAN is enabled on pro', () => {
    expect(isFeatureEnabled('SHARE_WITH_DIETITIAN', 'pro')).toBe(true);
  });

  it('GROCERY_LIST is enabled on pro', () => {
    expect(isFeatureEnabled('GROCERY_LIST', 'pro')).toBe(true);
  });

  it('SMART_SUGGESTIONS is enabled on pro', () => {
    expect(isFeatureEnabled('SMART_SUGGESTIONS', 'pro')).toBe(true);
  });

  it('MULTI_PROFILE is enabled on pro', () => {
    expect(isFeatureEnabled('MULTI_PROFILE', 'pro')).toBe(true);
  });
});

describe('isFeatureEnabled – unknown feature / plan', () => {
  it('returns false for an unknown feature flag', () => {
    // Cast to bypass TypeScript typing — simulates runtime unknown flag
    expect(isFeatureEnabled('UNKNOWN_FEATURE' as FeatureFlag, 'pro')).toBe(false);
  });

  it('returns false for an unknown plan', () => {
    expect(isFeatureEnabled('GROCERY_LIST', 'enterprise' as SubscriptionPlan)).toBe(false);
  });

  it('returns false for both unknown feature and unknown plan', () => {
    expect(
      isFeatureEnabled('DOES_NOT_EXIST' as FeatureFlag, 'trial' as SubscriptionPlan)
    ).toBe(false);
  });
});

describe('isFeatureEnabled – exhaustive plan check', () => {
  const plans: SubscriptionPlan[] = ['free', 'pro'];

  it('every feature behaves consistently: false on free, true on pro', () => {
    for (const flag of ALL_FLAGS) {
      expect(isFeatureEnabled(flag, 'free')).toBe(false);
      expect(isFeatureEnabled(flag, 'pro')).toBe(true);
    }
  });

  it('result type is always boolean', () => {
    for (const flag of ALL_FLAGS) {
      for (const plan of plans) {
        expect(typeof isFeatureEnabled(flag, plan)).toBe('boolean');
      }
    }
  });
});
