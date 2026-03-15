import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to intercept the module-level CHECKOUT_URL constant.
// Since it is read at module load time from process.env, we use vi.resetModules()
// and dynamic import to re-evaluate the module with different env values.

describe('getCheckoutUrl', () => {
  const ORIGINAL_URL = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL;

  afterEach(() => {
    // Restore original env value
    if (ORIGINAL_URL === undefined) {
      delete process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL;
    } else {
      process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = ORIGINAL_URL;
    }
    vi.resetModules();
  });

  it('returns "#" when env var is not set', async () => {
    delete process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL;
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    const result = getCheckoutUrl();
    expect(result).toBe('#');
  });

  it('returns "#" when env var is empty string', async () => {
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = '';
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    const result = getCheckoutUrl();
    expect(result).toBe('#');
  });

  it('includes user_id in URL params when userId is provided', async () => {
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = 'https://store.lemonsqueezy.com/checkout/buy/abc123';
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    const result = getCheckoutUrl({ userId: 'user-42' });
    expect(result).toContain('user-42');
    expect(result).toContain('user_id');
  });

  it('includes email in URL params when email is provided', async () => {
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = 'https://store.lemonsqueezy.com/checkout/buy/abc123';
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    const result = getCheckoutUrl({ email: 'test@example.com' });
    expect(result).toContain('test%40example.com');
  });

  it('includes success_url param in all non-empty-env cases', async () => {
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = 'https://store.lemonsqueezy.com/checkout/buy/abc123';
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    const result = getCheckoutUrl({});
    expect(result).toContain('success_url');
  });

  it('includes firstName as checkout[name] param', async () => {
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = 'https://store.lemonsqueezy.com/checkout/buy/abc123';
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    const result = getCheckoutUrl({ firstName: 'Alice' });
    expect(result).toContain('Alice');
    expect(result).toContain('name');
  });

  it('includes all params when all options are provided', async () => {
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = 'https://store.lemonsqueezy.com/checkout/buy/abc123';
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    const result = getCheckoutUrl({
      userId: 'uid-99',
      email: 'user@test.com',
      firstName: 'Bob',
    });
    expect(result).toContain('uid-99');
    expect(result).toContain('success_url');
    expect(result).not.toBe('#');
  });

  it('returns a valid URL string when env is set', async () => {
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = 'https://store.lemonsqueezy.com/checkout/buy/abc123';
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    const result = getCheckoutUrl();
    expect(() => new URL(result)).not.toThrow();
  });

  it('works when called with no arguments', async () => {
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL = 'https://store.lemonsqueezy.com/checkout/buy/abc123';
    vi.resetModules();
    const { getCheckoutUrl } = await import('@/lib/lemonsqueezy/checkout');
    expect(() => getCheckoutUrl()).not.toThrow();
  });
});
