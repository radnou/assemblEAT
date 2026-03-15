import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';

beforeEach(() => {
  act(() => {
    useSubscriptionStore.setState({ plan: 'free' });
  });
});

describe('useSubscriptionStore', () => {
  it('default plan is free', () => {
    expect(useSubscriptionStore.getState().plan).toBe('free');
  });

  it('setPlan("pro") changes plan to pro', () => {
    act(() => {
      useSubscriptionStore.getState().setPlan('pro');
    });
    expect(useSubscriptionStore.getState().plan).toBe('pro');
  });

  it('setPlan("free") changes plan back to free', () => {
    act(() => {
      useSubscriptionStore.getState().setPlan('pro');
    });
    act(() => {
      useSubscriptionStore.getState().setPlan('free');
    });
    expect(useSubscriptionStore.getState().plan).toBe('free');
  });
});
