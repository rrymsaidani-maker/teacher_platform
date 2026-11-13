import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'es', 'fr', 'ar'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const rtlLocales: readonly Locale[] = ['ar']

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
}

export function isRtl(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale)
}


export function toLocale(value: unknown): Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const key of Object.keys(override)) {
    const b = out[key]
    const o = override[key]
    out[key] = isObject(b) && isObject(o) ? deepMerge(b, o) : o
  }
  return out
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }

  const english = (await import('./messages/en.json')).default as Record<string, unknown>
  const localized =
    locale === 'en'
      ? {}
      : ((await import(`./messages/${locale}.json`)).default as Record<string, unknown>)

  return {
    locale,
    messages: deepMerge(english, localized),
  }
})