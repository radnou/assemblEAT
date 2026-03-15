const CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? '';

/**
 * Generate a Lemon Squeezy checkout URL with user metadata.
 * The embed=1 param enables the overlay (LemonSqueezy.js must be loaded on the page).
 */
export function getCheckoutUrl(options?: {
  userId?: string;
  email?: string;
  firstName?: string;
}): string {
  if (!CHECKOUT_URL) {
    console.warn('NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL is not set');
    return '#';
  }

  const url = new URL(CHECKOUT_URL);

  // Pass custom data so the webhook can identify the user
  if (options?.userId) {
    url.searchParams.set('checkout[custom][user_id]', options.userId);
  }
  if (options?.email) {
    url.searchParams.set('checkout[email]', options.email);
  }
  if (options?.firstName) {
    url.searchParams.set('checkout[name]', options.firstName);
  }

  // Embed mode — opens as an overlay instead of a redirect
  url.searchParams.set('embed', '1');

  return url.toString();
}
