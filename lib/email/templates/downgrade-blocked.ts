import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml } from './school-brand-parts'

export interface DowngradeBlockedData {
  schoolName: string
  oldPlanName: string
  newPlanName: string
  reasons: string[]
  outcome: 'reverted' | 'applied_over_limit'
  billingUrl: string
  locale?: string | null
}

export function downgradeBlockedTemplate(data: DowngradeBlockedData): {
  subject: string
  html: string
} {
  const reverted = data.outcome === 'reverted'
  const section = reverted ? 'reverted' : 'applied'
  const t = emailTranslator(data.locale, `emails.downgradeBlocked.${section}`)
  const c = emailTranslator(data.locale, 'emails.common')
  const vars = {
    schoolName: escapeHtml(data.schoolName),
    oldPlanName: escapeHtml(data.oldPlanName),
    newPlanName: escapeHtml(data.newPlanName),
  }

  return {
    subject: t('subject', { schoolName: data.schoolName, newPlanName: data.newPlanName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#d97706">${t('heading')}</h2>
  <p>${c('greeting')}</p>
  <p>${t('lead', vars)}</p>
  <ul style="color:#444">
    ${data.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('\n    ')}
  </ul>
  <p>${t('next', vars)}</p>
  <p style="text-align:center;margin:32px 0">
    <a href="${data.billingUrl}" style="background:#d97706;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">
      ${c('manageBilling')}
    </a>
  </p>
  <p style="color:#666;font-size:13px">${c('contactSupport')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${c('billingFooter')}</p>
</body>
</html>`,
  }
}
