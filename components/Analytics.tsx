'use client'
import { useMemo } from 'react'
import type { EntryRow, Role } from '@/lib/types'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts'
import { useT } from '@/lib/i18n'

export default function Analytics({
  entries,
  roles,
  monthName,
}: {
  entries: EntryRow[]
  roles: Role[]
  monthName: string
}) {
  const t = useT()

  // Hours per day
  const byDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entries) {
      if (!e.date) continue
      const h = Number(e.hours) || 0
      map.set(e.date, (map.get(e.date) || 0) + h)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, hours]) => ({ date, hours }))
  }, [entries])

  // Amount per role
  const byRole = useMemo(() => {
    const nameById = new Map(roles.map(r => [r.id, r.name]))
    const rateById = new Map(roles.map(r => [r.id, r.rate]))
    const map = new Map<string, number>()
    for (const e of entries) {
      const id = e.roleId
      if (!id) continue
      const amt = (Number(e.hours) || 0) * (rateById.get(id) || 0)
      map.set(id, (map.get(id) || 0) + amt)
    }
    return Array.from(map.entries()).map(([id, amount]) => ({ role: nameById.get(id) || '—', amount }))
  }, [entries, roles])

  const totalHours = useMemo(() => byDay.reduce((a, b) => a + b.hours, 0), [byDay])
  const totalAmount = useMemo(() => byRole.reduce((a, b) => a + b.amount, 0), [byRole])

  return (
    <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4 space-y-6">
      <div className="text-sm font-medium">{t('analytics')}</div>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">{t('total')} {t('hours')}</div>
          <div className="text-2xl font-semibold tabular-nums">{totalHours.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">{t('amount')}</div>
          <div className="text-2xl font-semibold tabular-nums">{totalAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Hours by day */}
      <div>
        <div className="text-sm mb-2">{t('hours_by_day')} — {monthName}</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hours" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Amount by role */}
      <div>
        <div className="text-sm mb-2">{t('amount_by_role')}</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byRole}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
