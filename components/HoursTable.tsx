'use client'
import { useMemo } from 'react'
import type { EntryRow, Role } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'
import { useT } from '@/lib/i18n'

export default function HoursTable({
  entries,
  roles,
  onChange,
}: {
  entries: EntryRow[]
  roles: Role[]
  onChange: (rows: EntryRow[]) => void
}) {
  const t = useT()
  const total = useMemo(
    () => entries.reduce((a, b) => a + (Number(b.hours) || 0), 0),
    [entries]
  )

  function addRow() {
    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        hours: 0,
        note: '',
        roleId: roles[0]?.id,
      },
    ])
  }

  function upd<K extends keyof EntryRow>(id: string, field: K, value: EntryRow[K]) {
    onChange(entries.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  function rm(id: string) {
    onChange(entries.filter((r) => r.id !== id))
  }

  return (
    <div className="rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{t('daily_entries')}</div>
          <div className="badge">
            <span className="text-slate-500 dark:text-slate-400">
              {t('total')} {t('hours')}
            </span>
            <span className="font-semibold tabular-nums">{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="text-left px-4 py-2">{t('date')}</th>
              <th className="text-left px-4 py-2">{t('hours')}</th>
              <th className="text-left px-4 py-2">{t('role')}</th>
              <th className="text-left px-4 py-2">{t('note')}</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row) => (
              <tr key={row.id} className="table-row">
                <td className="px-4 py-2">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => upd(row.id, 'date', e.target.value)}
                    className="input px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.25"
                    value={row.hours}
                    onChange={(e) => upd(row.id, 'hours', Number(e.target.value))}
                    className="input no-spinner px-2 py-1 w-28"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={row.roleId || ''}
                    onChange={(e) => upd(row.id, 'roleId', e.target.value)}
                    className="select px-2 py-1"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.rate.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    value={row.note || ''}
                    onChange={(e) => upd(row.id, 'note', e.target.value)}
                    className="input px-2 py-1 w-full"
                    placeholder={t('what_worked_on')}
                  />
                </td>
                <td className="px-2 text-right">
                  <button
                    onClick={() => rm(row.id)}
                    className="btn-ghost p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
        <button
          onClick={addRow}
          className="px-3 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-sm flex items-center gap-2
                     dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700"
        >
          <Plus className="w-4 h-4" /> {t('add_row')}
        </button>
        <div className="text-xs text-slate-500 dark:text-slate-400">{t('totals_autosave')}</div>
      </div>
    </div>
  )
}
