'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL ?? 'https://analytics.gerersci.fr';
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? '2'; // Site ID for AssemblEat in Matomo

export function MatomoTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Load Matomo script once
    if (typeof window !== 'undefined' && !(window as any)._paq) {
      const _paq = (window as any)._paq = (window as any)._paq || [];
      _paq.push(['setTrackerUrl', `${MATOMO_URL}/matomo.php`]);
      _paq.push(['setSiteId', MATOMO_SITE_ID]);
      _paq.push(['enableLinkTracking']);

      const script = document.createElement('script');
      script.async = true;
      script.src = `${MATOMO_URL}/matomo.js`;
      document.head.appendChild(script);
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any)._paq) {
      const _paq = (window as any)._paq;
      _paq.push(['setCustomUrl', pathname]);
      _paq.push(['setDocumentTitle', document.title]);
      _paq.push(['trackPageView']);
    }
  }, [pathname]);

  return null;
}
