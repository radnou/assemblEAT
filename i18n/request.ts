import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['fr', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // 1. Check cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`../messages/${cookieLocale}.json`)).default,
    };
  }

  // 2. Check Accept-Language
  const headerStore = await headers();
  const acceptLang = headerStore.get('accept-language') ?? '';
  const browserLocale = acceptLang.split(',')[0]?.split('-')[0];
  if (browserLocale && locales.includes(browserLocale as Locale)) {
    return {
      locale: browserLocale,
      messages: (await import(`../messages/${browserLocale}.json`)).default,
    };
  }

  // 3. Default to French
  return {
    locale: 'fr',
    messages: (await import('../messages/fr.json')).default,
  };
});
