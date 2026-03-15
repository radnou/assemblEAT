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

  // Redirect after successful payment
  url.searchParams.set('checkout[success_url]', 'https://assembleat.app/app?upgraded=true');

  return url.toString();
}
