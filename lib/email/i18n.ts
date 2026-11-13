import { createTranslator } from 'next-intl'
import { isRtl, locales, defaultLocale, type Locale } from '@/i18n'
import en from '@/messages/en.json'
import es from '@/messages/es.json'
import fr from '@/messages/fr.json'
import ar from '@/messages/ar.json'

const ALL: Record<Locale, Record<string, unknown>> = { en, es, fr, ar } as Record<Locale, Record<string, unknown>>

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const key of Object.keys(override)) {
    const b = out[key]
    const o = override[key]
    out[key] = isObject(b) && isObject(o) ? deepMerge(b, o) : o
  }
  return out
}

export function resolveLocale(input: string | null | undefined): Locale {
  const code = input?.toLowerCase().slice(0, 2) ?? ''
  return (locales as readonly string[]).includes(code) ? (code as Locale) : defaultLocale
}

// مترجم للبريد على الخادم، يقرأ من ملفات messages نفسها، والمفتاح الناقص يرجع إلى الإنجليزية
export function emailTranslator(input: string | null | undefined, namespace: string) {
  const locale = resolveLocale(input)
  const messages = locale === 'en' ? en : deepMerge(en as Record<string, unknown>, ALL[locale])
  return createTranslator({
    locale,
    namespace,
    messages: messages as unknown as Parameters<typeof createTranslator>[0]['messages'],
  })
}

export function emailDir(input: string | null | undefined): 'rtl' | 'ltr' {
  return isRtl(resolveLocale(input)) ? 'rtl' : 'ltr'
}
