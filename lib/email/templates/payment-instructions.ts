import type { SchoolBrand } from '@/lib/themes/school-brand'
import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml, schoolButton, schoolHeadingStyle, schoolLogoHeader } from './school-brand-parts'

/**
 * "Here is how to pay" — sent to a student when the school saves payment
 * instructions on a manual (bank transfer / offline) request (issue #727).
 */
export interface PaymentInstructionsEmailData {
  schoolName: string
  itemName: string
  /** Already formatted in the request's own currency, e.g. `COP 120.000`. */
  amountLabel: string
  paymentMethod: string | null
  instructions: string
  /** Already formatted for the student; omitted when the school set none. */
  deadlineLabel?: string | null
  /** Absolute link to the student's request page. */
  requestUrl: string
  locale?: string | null
  brand: SchoolBrand
}

export function paymentInstructionsTemplate(
  data: PaymentInstructionsEmailData
): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.paymentInstructions')
  const school = escapeHtml(data.schoolName)
  const item = escapeHtml(data.itemName)
  const instructions = escapeHtml(data.instructions).replace(/\r?\n/g, '<br/>')
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
  <table style="border-collapse:collapse;margin:16px 0">
    ${row(t('amount'), `<strong>${escapeHtml(data.amountLabel)}</strong>`)}
    ${data.paymentMethod ? row(t('method'), escapeHtml(data.paymentMethod)) : ''}
    ${data.deadlineLabel ? row(t('payBy'), escapeHtml(data.deadlineLabel)) : ''}
  </table>
  <div style="background:#f5f5f5;border-radius:6px;padding:16px;margin:16px 0;line-height:1.5">${instructions}</div>
  <p>${t('afterPaying')}</p>
  <p style="text-align:center;margin:32px 0">
    ${schoolButton(data.brand, data.requestUrl, t('cta'))}
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${school}</p>
</body>
</html>`,
  }
}
