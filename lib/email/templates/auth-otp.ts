import type { SchoolBrand } from '@/lib/themes/school-brand'
import type { Locale } from '@/i18n'
import { emailDir, emailTranslator, resolveLocale } from '@/lib/email/i18n'
import { escapeHtml, schoolButton, schoolHeadingStyle, schoolLogoHeader } from './school-brand-parts'

/**
 * Branded replacements for Supabase Auth's built-in emails (issue #776),
 * rendered by `app/api/auth/send-email-hook/route.ts` and never called
 * directly by app code — GoTrue calls the hook for every one of these.
 */
export type AuthOtpKind =
  | 'signup'
  | 'magiclink'
  | 'recovery'
  | 'invite'
  /** Sent to the NEW address — despite the GoTrue field being `token_hash` (see the route). */
  | 'email_change_new'
  /** Sent to the CURRENT address — GoTrue field `token_hash_new`. */
  | 'email_change_current'

export type AuthOtpLocale = Locale

export function resolveAuthOtpLocale(locale: string | null | undefined): AuthOtpLocale {
  return resolveLocale(locale)
}

// اسم القسم في messages/*.json لكل نوع بريد
const SECTION: Record<AuthOtpKind, string> = {
  signup: 'signup',
  magiclink: 'magiclink',
  recovery: 'recovery',
  invite: 'invite',
  email_change_new: 'emailChangeNew',
  email_change_current: 'emailChangeCurrent',
}

export interface AuthOtpEmailData {
  kind: AuthOtpKind
  schoolName: string
  /** The `/auth/confirm?token_hash=...&type=...` link built by `lib/auth/send-email-hook/build-link.ts`. */
  actionUrl: string
  locale?: string | null
  brand: SchoolBrand
}

export function authOtpTemplate(data: AuthOtpEmailData): { subject: string; html: string } {
  const t = emailTranslator(data.locale, `emails.authOtp.${SECTION[data.kind]}`)
  const school = escapeHtml(data.schoolName)

  return {
    subject: t('subject', { school: data.schoolName }),
    html: `<!DOCTYPE html>
<html dir="${emailDir(data.locale)}">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  ${schoolLogoHeader(data.brand)}
  <h2 style="${schoolHeadingStyle(data.brand)}">${t('heading')}</h2>
  <p>${t('body', { school })}</p>
  <p style="text-align:center;margin:32px 0">
    ${schoolButton(data.brand, data.actionUrl, t('cta'))}
  </p>
  <p style="color:#666;font-size:13px">${t('footer')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="color:#999;font-size:12px">${school}</p>
</body>
</html>`,
  }
}

/** Reauthentication uses an OTP passed to updateUser({ nonce }), not a link. */
export function authReauthenticationTemplate(data: {
  schoolName: string
  token: string
  locale?: string | null
  brand: SchoolBrand
}): { subject: string; html: string } {
  const t = emailTranslator(data.locale, 'emails.authOtp.reauthentication')
  const school = escapeHtml(data.schoolName)
  const heading = t('heading')

  return {
    subject: t('subject', { school: data.schoolName }),
    html: `<!DOCTYPE html><html dir="${emailDir(data.locale)}"><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      ${schoolLogoHeader(data.brand)}
      <h2 style="${schoolHeadingStyle(data.brand)}">${heading}</h2>
      <p>${t('body', { school })}</p><p style="font-size:32px;letter-spacing:8px;text-align:center">${escapeHtml(data.token)}</p>
      <p>${t('footer')}</p>
    </body></html>`,
  }
}
