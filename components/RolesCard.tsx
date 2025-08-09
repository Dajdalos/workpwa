'use client'
import { useMemo } from 'react'
import type { EntryRow, Role } from '@/lib/types'
import { Trash2, Plus } from 'lucide-react'
import { useT } from '@/lib/i18n'

export default function RolesCard({
  roles,
  setRoles,
  entries,
  setEntries,
}: {
  roles: Role[]
  setRoles: (r: Role[]) => void
  entries: EntryRow[]
  setEntries: (e: EntryRow[]) => void
}) {
  const t = useT()

  // Aggregate per role
  const perRole = useMemo(() => {
    const map = new Map<string, { role: Role; hours: number; amount: number }>()
    for (const r of roles) map.set(r.id, { role: r, hours: 0, amount: 0 })
    for (const e of entries) {
      if (!e.roleId) continue
      const rec = map.get(e.roleId)
      if (!rec) continue
      const h = Number(e.hours) || 0
      rec.hours += h
      rec.amount += h * (rec.role.rate || 0)
    }
    return Array.from(map.values())
  }, [entries, roles])

  const totalAmount = useMemo(
    () => perRole.reduce((a, b) => a + b.amount, 0),
    [perRole]
  )

  function updateRole(id: string, field: keyof Role, value: any) {
    setRoles(roles.map(r => r.id === id ? { ...r, [field]: field === 'rate' ? Number(value) : value } : r))
  }

  function addRole() {
    setRoles([...roles, { id: crypto.randomUUID(), name: `${t('role')} ${roles.length + 1}`, rate: 0 }])
  }

  function removeRole(id: string) {
    // clear references in entries
    setEntries(entries.map(e => e.roleId === id ? { ...e, roleId: undefined } : e))
    setRoles(roles.filter(r => r.id !== id))
  }

  return (
    <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
      <div className="text-sm font-medium mb-3">{t('roles_rates')}</div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="text-left px-4 py-2">{t('role')}</th>
              <th className="text-left px-4 py-2">{t('rate')}</th>
              <th className="text-left px-4 py-2">{t('hours')}</th>
              <th className="text-left px-4 py-2">{t('amount')}</th>
              <th className="w-16 px-2 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => {
              const row = perRole.find(x => x.role.id === r.id)
              return (
                <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-2">
                    <input
                      value={r.name}
                      onChange={e => updateRole(r.id, 'name', e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                    type="number"
                    step="0.01"
                    value={r.rate}
                    onChange={e => updateRole(r.id, 'rate', e.target.value)}
                    inputMode="decimal"                 // nicer mobile keyboard
                    className="no-spinner appearance-none w-full sm:w-28 border rounded-xl px-3 py-2
                                bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                    />

                  </td>
                  <td className="px-4 py-2">
                    <span className="tabular-nums">{(row?.hours ?? 0).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="tabular-nums font-medium">{(row?.amount ?? 0).toFixed(2)}</span>
                  </td>
                  <td className="px-2 text-right">
                    <button
                      onClick={() => removeRole(r.id)}
                      className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      title={t('remove')}
                      aria-label={t('remove')}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="px-4 py-2">
                <button
                  onClick={addRole}
                  className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t('add_role')}
                </button>
              </td>
              <td></td>
              <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-400">{t('total')}</td>
              <td className="px-4 py-2 font-semibold tabular-nums">{totalAmount.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
