import type { SchoolBrand } from '@/lib/themes/school-brand'
import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml, schoolButton, schoolHeadingStyle, schoolLogoHeader } from './school-brand-parts'

export interface JoinedSchoolData {
  studentName: string
  schoolName: string
  dashboardUrl: string
  brand: SchoolBrand
  locale?: string | null
}

export function joinedSchoolTemplate(data: JoinedSchoolData): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.joinedSchool')
  const school = escapeHtml(data.schoolName)
  return {
    subject: t('subject', { schoolName: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  ${schoolLogoHeader(data.brand)}
  <h2 style="${schoolHeadingStyle(data.brand)}">${t('heading', { schoolName: school })}</h2>
  <p>${t('greeting', { studentName: escapeHtml(data.studentName) })}</p>
  <p>${t('body', { schoolName: school })}</p>
  <p style="text-align:center;margin:32px 0">
    ${schoolButton(data.brand, data.dashboardUrl, t('cta'))}
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${school}</p>
</body>
</html>`,
  }
}
