import type { SchoolBrand } from '@/lib/themes/school-brand'
import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml, schoolButton, schoolHeadingStyle, schoolLogoHeader } from './school-brand-parts'

export interface InvitationEmailData {
  schoolName: string
  inviterName: string
  role: 'student' | 'teacher' | 'admin'
  joinUrl: string
  brand: SchoolBrand
  locale?: string | null
}

export function invitationTemplate(data: InvitationEmailData): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.invitation')
  const school = escapeHtml(data.schoolName)
  const roleKey = data.role === 'admin' ? 'roleAdmin' : data.role === 'teacher' ? 'roleTeacher' : 'roleStudent'
  return {
    subject: t('subject', { schoolName: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  ${schoolLogoHeader(data.brand)}
  <h2 style="${schoolHeadingStyle(data.brand)}">${t('heading')}</h2>
  <p>${t('body', { inviterName: escapeHtml(data.inviterName), schoolName: school, role: `<strong>${t(roleKey)}</strong>` })}</p>
  <p>${t('nextStep')}</p>
  <p style="text-align:center;margin:32px 0">
    ${schoolButton(data.brand, data.joinUrl, t('cta', { schoolName: school }))}
  </p>
  <p style="color:#666;font-size:13px">${t('ignore')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${school}</p>
</body>
</html>`,
  }
}
