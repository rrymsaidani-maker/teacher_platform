import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml } from './school-brand-parts'

export interface PaymentFailedData {
  schoolName: string
  planName: string
  billingUrl: string
  locale?: string | null
}

export function paymentFailedTemplate(data: PaymentFailedData): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.paymentFailed')
  const c = emailTranslator(data.locale, 'emails.common')
  const school = escapeHtml(data.schoolName)
  const plan = escapeHtml(data.planName)
  return {
    subject: t('subject', { planName: data.planName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#dc2626">${t('heading')}</h2>
  <p>${c('greeting')}</p>
  <p>${t('body', { planName: plan, schoolName: school })}</p>
  <p>${t('note')}</p>
  <p style="text-align:center;margin:32px 0">
    <a href="${data.billingUrl}" style="background:#dc2626;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">
      ${t('cta')}
    </a>
  </p>
  <p style="color:#666;font-size:13px">${c('contactSupport')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${c('billingFooter')}</p>
</body>
</html>`,
  }
}
