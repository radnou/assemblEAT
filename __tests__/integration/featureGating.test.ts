import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';

// Reset subscription store to 'free' before each test to ensure isolation
beforeEach(() => {
  act(() => {
    useSubscriptionStore.setState({ plan: 'free' });
  });
});

describe('featureGating integration: useFeatureFlag + useSubscriptionStore', () => {
  it('returns false for GROCERY_LIST when plan is "free"', () => {
    useSubscriptionStore.setState({ plan: 'free' });
    const { result } = renderHook(() => useFeatureFlag('GROCERY_LIST'));
    expect(result.current).toBe(false);
  });

  it('returns true for GROCERY_LIST when plan is "pro"', () => {
    useSubscriptionStore.setState({ plan: 'pro' });
    const { result } = renderHook(() => useFeatureFlag('GROCERY_LIST'));
    expect(result.current).toBe(true);
  });

  it('updates flag in real-time when plan changes from free to pro', () => {
    const { result } = renderHook(() => useFeatureFlag('GROCERY_LIST'));

    // Initially free
    expect(result.current).toBe(false);

    // Change plan to pro
    act(() => {
      useSubscriptionStore.getState().setPlan('pro');
    });

    expect(result.current).toBe(true);
  });

  it('updates flag in real-time when plan changes from pro back to free', () => {
    useSubscriptionStore.setState({ plan: 'pro' });
    const { result } = renderHook(() => useFeatureFlag('GROCERY_LIST'));

    expect(result.current).toBe(true);

    act(() => {
      useSubscriptionStore.getState().setPlan('free');
    });

    expect(result.current).toBe(false);
  });

  it('SMART_SUGGESTIONS is false on free and true on pro', () => {
    useSubscriptionStore.setState({ plan: 'free' });
    const { result: freeResult } = renderHook(() => useFeatureFlag('SMART_SUGGESTIONS'));
    expect(freeResult.current).toBe(false);

    useSubscriptionStore.setState({ plan: 'pro' });
    const { result: proResult } = renderHook(() => useFeatureFlag('SMART_SUGGESTIONS'));
    expect(proResult.current).toBe(true);
  });

  it('CLOUD_SYNC is false on free and true on pro', () => {
    useSubscriptionStore.setState({ plan: 'free' });
    const { result: freeResult } = renderHook(() => useFeatureFlag('CLOUD_SYNC'));
    expect(freeResult.current).toBe(false);

    useSubscriptionStore.setState({ plan: 'pro' });
    const { result: proResult } = renderHook(() => useFeatureFlag('CLOUD_SYNC'));
    expect(proResult.current).toBe(true);
  });

  it('multiple hooks each reflect the current plan correctly', () => {
    useSubscriptionStore.setState({ plan: 'free' });
    const { result: grocery } = renderHook(() => useFeatureFlag('GROCERY_LIST'));
    const { result: smart } = renderHook(() => useFeatureFlag('SMART_SUGGESTIONS'));
    const { result: cloud } = renderHook(() => useFeatureFlag('CLOUD_SYNC'));

    expect(grocery.current).toBe(false);
    expect(smart.current).toBe(false);
    expect(cloud.current).toBe(false);

    act(() => {
      useSubscriptionStore.getState().setPlan('pro');
    });

    expect(grocery.current).toBe(true);
    expect(smart.current).toBe(true);
    expect(cloud.current).toBe(true);
  });
});
