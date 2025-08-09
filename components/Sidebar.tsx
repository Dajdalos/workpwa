'use client'

import type { Tab } from '@/lib/types'
import { Trash2, Calendar } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { KeyboardEvent } from 'react'

export default function Sidebar({
  tabs,
  currentId,
  onSelect,
  onAdd,
  onDelete,
  myRole,
  currentUserId,
}: {
  tabs: Tab[]
  currentId?: string
  onSelect: (id: string) => void
  onAdd: () => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  myRole: 'owner' | 'manager' | 'member' | 'unknown'
  currentUserId: string
}) {
  const t = useT()
  const filtered = tabs

  function handleRowKeyDown(e: KeyboardEvent<HTMLDivElement>, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }

  return (
    <aside className="w-72 shrink-0 lg:sticky lg:top-[var(--header-h,64px)] lg:self-start">
      {/* overflow-hidden keeps inner content clipped to rounded corners */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
        <div className="px-3 py-3 border-b text-sm font-medium bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
          {t('tabs')}
        </div>

        {/* list container: height = viewport - header - a little padding */}
        <div className="overflow-auto overscroll-contain max-h-[calc(100vh-var(--header-h,64px)-2rem)]">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
              {t('select_or_create')}
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {filtered.map((tab) => {
                const active = tab.id === currentId
                return (
                  <li key={tab.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      onClick={() => onSelect(tab.id)}
                      onKeyDown={(e) => handleRowKeyDown(e, tab.id)}
                      className={`w-full group text-left px-3 py-2 rounded-lg border flex items-center gap-2 outline-none
                        ${active
                          ? 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800'
                        }`}
                    >
                      <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="truncate flex-1 text-slate-800 dark:text-slate-100">{tab.name}</span>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(tab.id) }}
                        className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        title={t('delete')}
                        aria-label={t('delete')}
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        {/* Example Add button, shown only for owner/manager */}
        {(myRole === 'owner' || myRole === 'manager') && (
          <div className="p-3 border-t bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
            <button
              type="button"
              onClick={onAdd}
              className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              {t('add_tab')}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
