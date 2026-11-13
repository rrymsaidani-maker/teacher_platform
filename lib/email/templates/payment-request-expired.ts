import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml } from './school-brand-parts'

export interface PaymentRequestExpiredData {
  schoolName: string
  planName: string
  amount: string
  billingUrl: string
  ttlDays: number
  locale?: string | null
}

/**
 * Sent when an unpaid bank-transfer request hits its TTL and is closed
 * (issue #546 §2).
 */
export function paymentRequestExpiredTemplate(
  data: PaymentRequestExpiredData
): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.paymentRequestExpired')
  const c = emailTranslator(data.locale, 'emails.common')
  const school = escapeHtml(data.schoolName)
  const plan = escapeHtml(data.planName)
  return {
    subject: t('subject', { planName: data.planName, schoolName: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#d97706">${t('heading')}</h2>
  <p>${c('greeting')}</p>
  <p>${t('body', { planName: plan, schoolName: school, amount: escapeHtml(data.amount), ttlDays: data.ttlDays })}</p>
  <p>${t('note')}</p>
  <p>${t('action')}</p>
  <p style="text-align:center;margin:32px 0">
    <a href="${data.billingUrl}" style="background:#7c3aed;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">
      ${t('cta')}
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${c('billingFooter')}</p>
</body>
</html>`,
  }
}
