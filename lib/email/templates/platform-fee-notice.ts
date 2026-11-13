/**
 * Platform fee notices to a school's admins: statement issued, reminder,
 * overdue, sales paused, sales resumed. Copy lives in messages/*.json under
 * `emails.platformFee`. Platform-branded, never sent to students.
 */
import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml } from './school-brand-parts'

export type PlatformFeeNoticeKind = 'statement' | 'reminder' | 'overdue' | 'blocked' | 'resumed'

export interface PlatformFeeNoticeData {
  kind: PlatformFeeNoticeKind
  schoolName: string
  /** Pre-formatted, e.g. "$12.40" or "$12.40 + €3.00" (never summed across currencies). */
  amountLabel: string
  /** Pre-formatted due date with its zone, e.g. "Oct 4, 2026 (UTC)". */
  dueLabel: string | null
  /** Where the admin sees the balance. */
  billingUrl: string
  locale: string
  /** Statement reference, e.g. PF-202609-12. */
  statementNumber?: string | null
}

const COLOR: Record<PlatformFeeNoticeKind, string> = {
  statement: '#3A50B8',
  reminder: '#3A50B8',
  overdue: '#dc2626',
  blocked: '#dc2626',
  resumed: '#16a34a',
}

export function platformFeeNoticeTemplate(data: PlatformFeeNoticeData): { subject: string; html: string } {
  const t = emailTranslator(data.locale, `emails.platformFee.${data.kind}`)
  const f = emailTranslator(data.locale, 'emails.platformFee')
  const color = COLOR[data.kind]
  const school = escapeHtml(data.schoolName)
  const amount = escapeHtml(data.amountLabel)
  const due = data.dueLabel ? escapeHtml(data.dueLabel) : ''
  const ref = data.statementNumber ? ` (${escapeHtml(data.statementNumber)})` : ''
  const vars = { schoolName: data.schoolName, school, amount, due, ref }

  return {
    subject: t('subject', { schoolName: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:${color}">${t('heading')}</h2>
  <p>${t('body', vars)}</p>
  <p style="text-align:center;margin:32px 0">
    <a href="${escapeHtml(data.billingUrl)}" style="background:${color};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">${t('button')}</a>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${f('footer')}</p>
</body>
</html>`,
  }
}
