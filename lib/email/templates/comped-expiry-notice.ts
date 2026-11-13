import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml } from './school-brand-parts'

export interface CompedExpiryNoticeData {
  schoolName: string
  planName: string
  /** Formatted expiry date. */
  expiryDate: string
  daysRemaining: number
  billingUrl: string
  /** `ended`: the comp already lapsed (grace started). Default: upcoming. */
  stage?: 'upcoming' | 'ended'
  /** Grace days granted when `stage` is `ended`; null when the school was already on free. */
  graceDays?: number | null
  /** Platform-owner copy: names the school and drops the call to action. */
  audience?: 'school' | 'owner'
  locale?: string | null
}

export function compedExpiryNoticeTemplate(data: CompedExpiryNoticeData): { subject: string; html: string } {
  const ended = data.stage === 'ended'
  const owner = data.audience === 'owner'
  const t = emailTranslator(data.locale, 'emails.compedExpiry')
  const c = emailTranslator(data.locale, 'emails.common')
  const school = escapeHtml(data.schoolName)
  const plan = escapeHtml(data.planName)
  const expiry = escapeHtml(data.expiryDate)
  const audience = owner ? 'Owner' : 'School'

  const subjectKey = ended ? `subjectEnded${audience}` : `subjectUpcoming${audience}`
  const introKey = ended
    ? `intro${owner ? 'Owner' : 'School'}Ended`
    : `intro${owner ? 'Owner' : 'School'}Upcoming`
  const actionKey = ended ? `action${audience}Ended` : `action${audience}Upcoming`
  const color = ended ? '#dc2626' : '#7c3aed'

  const grace = data.graceDays
    ? ` ${t('graceSuffix', { graceDays: data.graceDays })}`
    : ` ${t('normalBilling')}`

  const button = owner
    ? ''
    : `<p style="text-align:center;margin:32px 0">
    <a href="${data.billingUrl}" style="background:${color};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">
      ${t('cta')}
    </a>
  </p>`

  return {
    subject: t(subjectKey, { planName: data.planName, schoolName: data.schoolName, days: data.daysRemaining }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:${color}">${t(ended ? 'headingEnded' : 'headingUpcoming')}</h2>
  <p>${c('greeting')}</p>
  <p>${t(introKey, { planName: plan, schoolName: school, expiryDate: expiry, days: data.daysRemaining })}${ended ? grace : ''}</p>
  <p>${t(actionKey)}</p>
  ${button}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${c('billingFooter')}</p>
</body>
</html>`,
  }
}
