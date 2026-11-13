import type { SchoolBrand } from '@/lib/themes/school-brand'
import { emailDir, emailTranslator } from '@/lib/email/i18n'
import { escapeHtml, schoolButton, schoolHeadingStyle, schoolLogoHeader } from './school-brand-parts'

export interface CertificateIssuedData {
  studentName: string
  courseTitle: string
  schoolName: string
  verifyUrl: string
  downloadUrl: string
  brand: SchoolBrand
  locale?: string | null
}

export function certificateIssuedTemplate(data: CertificateIssuedData): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.certificateIssued')
  const course = escapeHtml(data.courseTitle)
  const school = escapeHtml(data.schoolName)
  return {
    subject: t('subject', { courseTitle: data.courseTitle, schoolName: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  ${schoolLogoHeader(data.brand)}
  <h2 style="${schoolHeadingStyle(data.brand)}">${t('heading', { studentName: escapeHtml(data.studentName) })}</h2>
  <p>${t('body', { courseTitle: course })}</p>
  <p style="text-align:center;margin:32px 0">
    ${schoolButton(data.brand, data.downloadUrl, t('cta'))}
    <a href="${data.verifyUrl}" style="background:#f3f4f6;color:#1a1a1a;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-left:8px">
      ${t('verify')}
    </a>
  </p>
  <p style="color:#666;font-size:13px">${t('share')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${school}</p>
</body>
</html>`,
  }
}
