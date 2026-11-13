'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { locales, localeNames, type Locale } from '@/i18n'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('common')

  const switchLocale = (newLocale: Locale) => {
    const parts = pathname.split('/')
    if ((locales as readonly string[]).includes(parts[1])) {
      parts[1] = newLocale
    } else {
      parts.splice(1, 0, newLocale)
    }
    router.push(parts.join('/').replace('//', '/'))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'w-9 px-0')}
      >
        <Globe className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">{t('toggleLanguage')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem key={l} onClick={() => switchLocale(l)}>
            {localeNames[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}