import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml } from './school-brand-parts'

export interface RenewalReminderData {
  schoolName: string
  planName: string
  billingUrl: string
  periodEnd: string
  overdue: boolean
  locale?: string | null
}

export function renewalReminderTemplate(data: RenewalReminderData): { subject: string; html: string } {
  const section = data.overdue ? 'overdue' : 'due'
  const t = emailTranslator(data.locale, `emails.renewalReminder.${section}`)
  const c = emailTranslator(data.locale, 'emails.common')
  const r = emailTranslator(data.locale, 'emails.renewalReminder')
  const vars = { planName: escapeHtml(data.planName), schoolName: escapeHtml(data.schoolName), periodEnd: escapeHtml(data.periodEnd) }
  const headingColor = data.overdue ? '#dc2626' : '#7c3aed'
  const buttonColor = data.overdue ? '#dc2626' : '#7c3aed'

  return {
    subject: t('subject', { planName: data.planName, schoolName: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:${headingColor}">${t('heading')}</h2>
  <p>${c('greeting')}</p>
  <p>${t('intro', vars)}</p>
  <p>${t('action')}</p>
  <p style="text-align:center;margin:32px 0">
    <a href="${data.billingUrl}" style="background:${buttonColor};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">
      ${t('cta')}
    </a>
  </p>
  <p style="color:#666;font-size:13px">${r('alreadySubmitted')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${c('billingFooter')}</p>
</body>
</html>`,
  }
}
