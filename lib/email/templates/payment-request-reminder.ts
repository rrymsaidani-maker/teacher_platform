import type { SchoolBrand } from '@/lib/themes/school-brand'
import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml, schoolButton, schoolHeadingStyle, schoolLogoHeader } from './school-brand-parts'

/**
 * "Your request expires soon" — sent once, before a student-facing
 * `payment_requests` row lapses (issue #802).
 */
export interface PaymentRequestReminderEmailData {
  schoolName: string
  itemName: string
  /** Already formatted in the request's own currency, e.g. `COP 120.000`. */
  amountLabel: string
  /** Already formatted for the student's zone/locale. */
  deadlineLabel: string
  /** Whole days left, floor-clamped to 0 — drives the "expires today" phrasing. */
  daysRemaining: number
  /** Absolute link to the student's request page. */
  requestUrl: string
  locale?: string | null
  brand: SchoolBrand
}

export function paymentRequestReminderTemplate(
  data: PaymentRequestReminderEmailData
): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.paymentRequestReminder')
  const school = escapeHtml(data.schoolName)
  const item = escapeHtml(data.itemName)
  const expiry = data.daysRemaining <= 1 ? t('expiresToday') : t('expiresIn', { days: data.daysRemaining })
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#666">${label}</td><td style="padding:4px 0">${value}</td></tr>`

  return {
    subject: t('subject', { item: data.itemName, school: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  ${schoolLogoHeader(data.brand)}
  <h2 style="${schoolHeadingStyle(data.brand)}">${t('heading', { item })}</h2>
  <p>${t('intro', { school })}</p>
  <p><strong>${expiry}</strong></p>
  <table style="border-collapse:collapse;margin:16px 0">
    ${row(t('item'), item)}
    ${row(t('amount'), `<strong>${escapeHtml(data.amountLabel)}</strong>`)}
    ${row(t('expiresOn'), escapeHtml(data.deadlineLabel))}
  </table>
  <p>${t('afterExpiry')}</p>
  <p style="text-align:center;margin:32px 0">
    ${schoolButton(data.brand, data.requestUrl, t('cta'))}
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${school}</p>
</body>
</html>`,
  }
}
