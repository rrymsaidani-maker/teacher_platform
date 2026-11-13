/**
 * Access-cutoff notification emails (issues #494, #517).
 *
 * The ladder is scheduled → T-7 → T-1 → enforced. The copy lives in
 * messages/*.json under `emails.accessCutoff` and `emails.common`.
 * The `enforced` stage is past tense: students have already lost access.
 */
import type { SchoolBrand } from '@/lib/themes/school-brand'
import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml } from './school-brand-parts'

export type AccessCutoffStage = 'scheduled' | 'reminder_7d' | 'reminder_1d' | 'enforced'

export interface AccessCutoffWarningData {
  schoolName: string
  planName: string
  reasons: string[]
  cutoffDate: string
  billingUrl: string
  /** Which rung of the reminder ladder this is. Defaults to the #494 behaviour. */
  stage?: AccessCutoffStage
  locale?: string | null
  brand?: SchoolBrand
}

const SECTION: Record<AccessCutoffStage, string> = {
  scheduled: 'scheduled',
  reminder_7d: 'reminder7d',
  reminder_1d: 'reminder1d',
  enforced: 'enforced',
}

export function accessCutoffWarningTemplate(data: AccessCutoffWarningData): {
  subject: string
  html: string
} {
  const stage = data.stage ?? 'scheduled'
  const t = emailTranslator(data.locale, `emails.accessCutoff.${SECTION[stage]}`)
  const c = emailTranslator(data.locale, 'emails.common')
  const vars = {
    schoolName: data.schoolName,
    planName: data.planName,
    cutoffDate: data.cutoffDate,
  }
  const buttonLabel = stage === 'enforced' ? c('restoreAccess') : c('manageBilling')

  return {
    subject: t('subject', vars),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#dc2626">${t('heading')}</h2>
  <p>${c('greeting')}</p>
  <p>${t('lead', vars)}</p>
  <ul style="color:#444">
    ${data.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('\n    ')}
  </ul>
  <p>${t('consequence', vars)}</p>
  <p>${t('callToAction')}</p>
  <p style="text-align:center;margin:32px 0">
    <a href="${data.billingUrl}" style="background:#dc2626;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">
      ${buttonLabel}
    </a>
  </p>
  <p style="color:#666;font-size:13px">${c('contactSupport')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${c('billingFooter')}</p>
</body>
</html>`,
  }
}
