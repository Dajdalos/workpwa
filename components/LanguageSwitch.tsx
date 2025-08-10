'use client'
import type { ChangeEvent } from 'react'
import { useLocale, useSetLocale } from '@/lib/i18n'

type Locale = 'en' | 'de' | 'hu' | 'sk'
const LOCALES: Locale[] = ['en', 'de', 'hu', 'sk']
const isLocale = (v: string): v is Locale => (LOCALES as string[]).includes(v)

export default function LanguageSwitch() {
  const locale = useLocale()
  const setLocale = useSetLocale()

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setLocale(isLocale(v) ? v : 'en')
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      className="px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 text-sm"
      title="Language"
    >
      <option value="en">English</option>
      <option value="de">Deutsch</option>
      <option value="hu">Magyar</option>
      <option value="sk">Slovenčina</option>
    </select>
  )
}
