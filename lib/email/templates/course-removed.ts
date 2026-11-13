import type { SchoolBrand } from '@/lib/themes/school-brand'
import type { Locale } from '@/i18n'
import { emailDir, emailTranslator, resolveLocale } from '@/lib/email/i18n'
import { escapeHtml, schoolButton, schoolLogoHeader } from './school-brand-parts'

/**
 * Sent to each enrolled student when a teacher deletes a course outright.
 * The locale is the one passed by the caller (the school's UI language).
 */
export type CourseRemovedLocale = Locale

export interface CourseRemovedEmailData {
  courseTitle: string
  schoolName: string
  browseUrl: string
  locale?: string | null
  brand: SchoolBrand
}

export function resolveCourseRemovedLocale(locale: string | null | undefined): CourseRemovedLocale {
  return resolveLocale(locale)
}

export function courseRemovedTemplate(data: CourseRemovedEmailData): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.courseRemoved')
  const c = emailTranslator(data.locale, 'emails.common')
  const course = escapeHtml(data.courseTitle)
  const school = escapeHtml(data.schoolName)

  return {
    subject: t('subject', { course: data.courseTitle, school: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  ${schoolLogoHeader(data.brand)}
  <p>${c('greeting')}</p>
  <p>${t('body', { course, school })}</p>
  <p style="text-align:center;margin:32px 0">
    ${schoolButton(data.brand, data.browseUrl, t('cta'))}
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${school}</p>
</body>
</html>`,
  }
}
