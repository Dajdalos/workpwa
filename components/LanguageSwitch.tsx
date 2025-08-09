'use client'
import { useLocale, useSetLocale } from '@/lib/i18n'

export default function LanguageSwitch() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as any)}
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
