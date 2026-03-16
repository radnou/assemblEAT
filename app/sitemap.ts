import type { MetadataRoute } from 'next';
import { getTopCombinations } from '@/lib/seo/combinations';

export default function sitemap(): MetadataRoute.Sitemap {
  const combos = getTopCombinations();

  return [
    { url: 'https://assembleat.app', lastModified: new Date() },
    { url: 'https://assembleat.app/nutriscore', lastModified: new Date() },
    ...combos.map((c) => ({
      url: `https://assembleat.app/nutriscore/${c.slug}`,
      lastModified: new Date(),
    })),
  ];
}
