import { ar, enUS, es, fr } from 'date-fns/locale'
import type { Locale } from '@/i18n'

const dateFnsLocales = { en: enUS, es, fr, ar } as const

export function dateFnsLocale(locale: string) {
  return (dateFnsLocales as Record<string, typeof enUS>)[locale] ?? enUS
}

export function ogLocale(locale: string): string {
  const map: Record<Locale, string> = { en: 'en_US', es: 'es_ES', fr: 'fr_FR', ar: 'ar_SA' }
  return map[locale as Locale] ?? 'en_US'
}

export function bcp47(locale: string): string {
  const map: Record<Locale, string> = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', ar: 'ar-SA' }
  return map[locale as Locale] ?? 'en-US'
}