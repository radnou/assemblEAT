'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function MatomoTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Initialize Matomo exactly as provided by the Matomo dashboard
    const _paq = (window as unknown as { _paq: unknown[][] })._paq =
      (window as unknown as { _paq: unknown[][] })._paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);

    const u = '//analytics.gerersci.fr/';
    _paq.push(['setTrackerUrl', u + 'matomo.php']);
    _paq.push(['setSiteId', '2']);

    if (!document.getElementById('matomo-script')) {
      const g = document.createElement('script');
      g.id = 'matomo-script';
      g.async = true;
      g.src = u + 'matomo.js';
      const s = document.getElementsByTagName('script')[0];
      s.parentNode?.insertBefore(g, s);
    }
  }, []);

  // Track SPA page views on route change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const _paq = (window as unknown as { _paq: unknown[][] })._paq;
    if (_paq) {
      _paq.push(['setCustomUrl', pathname]);
      _paq.push(['setDocumentTitle', document.title]);
      _paq.push(['trackPageView']);
    }
  }, [pathname]);

  return null;
}
