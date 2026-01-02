export type Locale = (typeof locales)[number];

export const locales = ['en', 'zh-hant'] as const;
export const defaultLocale: Locale = 'en';
