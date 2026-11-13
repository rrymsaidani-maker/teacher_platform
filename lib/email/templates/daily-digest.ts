import type { SchoolBrand } from '@/lib/themes/school-brand'
import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml, schoolButton, schoolHeadingStyle, schoolLogoHeader } from './school-brand-parts'

export interface DailyDigestEmailData {
  schoolName: string
  firstName: string
  summary: string
  dueCards: number
  goalsPending: number
  /** Streak to warn about; 0 = no streak line. */
  streak: number
  /** Unread community replies; 0 or absent = no community line. */
  communityReplies?: number
  /** Where the community line links: the school's notifications page. */
  notificationsUrl?: string
  actionUrl: string
  brand: SchoolBrand
}

export interface StreakNudgeEmailData {
  schoolName: string
  firstName: string
  streak: number
  actionUrl: string
  brand: SchoolBrand
}

function layout(brand: SchoolBrand, schoolName: string, locale: string, inner: string): string {
  return `<!DOCTYPE html>
<html dir="${emailDir(locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  ${schoolLogoHeader(brand)}
${inner}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${escapeHtml(schoolName)}</p>
</body>
</html>`
}

function ctaButton(brand: SchoolBrand, url: string, label: string): string {
  return `<p style="text-align:center;margin:32px 0">
    ${schoolButton(brand, url, label)}
  </p>`
}

export function dailyDigestEmailTemplate(
  data: DailyDigestEmailData,
  locale: string
): { subject: string; html: string } {
  const t = emailTranslator(locale, 'emails.dailyDigest')
  const items: string[] = []
  if (data.dueCards > 0) items.push(t('cards', { n: data.dueCards }))
  if (data.goalsPending > 0) items.push(t('goals', { n: data.goalsPending }))
  const replies = data.communityReplies ?? 0
  if (replies > 0) {
    const text = t('community', { n: replies })
    items.push(
      data.notificationsUrl
        ? `<a href="${escapeHtml(data.notificationsUrl)}" style="color:inherit">${text}</a>`
        : text
    )
  }
  if (data.streak > 0) items.push(t('streak', { n: data.streak }))
  const list = items.map((item) => `    <li style="margin:8px 0">${item}</li>`).join('\n')

  return {
    subject: t('subject', { schoolName: data.schoolName }),
    html: layout(
      data.brand,
      data.schoolName,
      locale,
      `  <h2 style="${schoolHeadingStyle(data.brand)}">${t('greeting', { name: escapeHtml(data.firstName) })}</h2>
  <p>${t('intro')}</p>
  <ul style="padding-left:20px">
${list}
  </ul>
${ctaButton(data.brand, data.actionUrl, t('cta'))}
  <p style="color:#666;font-size:13px">${t('footer')}</p>`
    ),
  }
}

export function streakNudgeEmailTemplate(
  data: StreakNudgeEmailData,
  locale: string
): { subject: string; html: string } {
  const t = emailTranslator(locale, 'emails.streakNudge')
  const subject = t('subject', { streak: data.streak })
  return {
    subject,
    html: layout(
      data.brand,
      data.schoolName,
      locale,
      `  <h2 style="${schoolHeadingStyle(data.brand)}">🔥 ${subject}</h2>
  <p>${t('body', { name: escapeHtml(data.firstName), streak: data.streak })}</p>
${ctaButton(data.brand, data.actionUrl, t('cta'))}`
    ),
  }
}
