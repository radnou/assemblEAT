'use client';

import { useEffect } from 'react';
import { getCheckoutUrl } from '@/lib/lemonsqueezy/checkout';

/**
 * Hook that loads the Lemon Squeezy embed script once per page.
 * Call this in any component that may trigger a checkout overlay.
 */
export function useLemonSqueezy() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('lemonsqueezy-script')) return;

    const script = document.createElement('script');
    script.id = 'lemonsqueezy-script';
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
    script.defer = true;
    document.head.appendChild(script);
  }, []);
}

/**
 * Open the Lemon Squeezy checkout overlay.
 * Falls back to a new tab if the embed script is not yet initialised.
 */
export function openCheckout(options?: {
  userId?: string;
  email?: string;
  firstName?: string;
}) {
  const url = getCheckoutUrl(options);

  if (typeof window !== 'undefined') {
    // LemonSqueezy.js exposes a global `LemonSqueezy` object once loaded
    const w = window as unknown as Record<string, unknown>;
    const ls = w['LemonSqueezy'] as
      | { Url: { Open: (url: string) => void } }
      | undefined;

    if (ls?.Url?.Open) {
      ls.Url.Open(url);
    } else {
      // Script not loaded yet — open in new tab as fallback
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
