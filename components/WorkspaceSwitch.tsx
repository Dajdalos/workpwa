'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Pencil, Plus } from 'lucide-react'

type Workspace = { id: string; name: string }

export default function WorkspaceSwitch({
  value,
  onChange,
}: {
  value?: string | null
  onChange: (id: string) => void
}) {
  const [items, setItems] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  // Rename modal state
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameName, setRenameName] = useState('')

  useEffect(() => {
    loadWorkspaces()

    const onRefresh = () => loadWorkspaces()
    window.addEventListener('ws:refresh', onRefresh)
    return () => window.removeEventListener('ws:refresh', onRefresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadWorkspaces() {
    setLoading(true)
    const { data, error } = await supabase
      .from('workspaces')
      .select('id,name')
      .order('created_at', { ascending: true })
    setLoading(false)
    if (error) return console.error(error)
    const list = (data || []) as Workspace[]
    setItems(list)
    if (!value && list[0]) onChange(list[0].id)
  }

  async function createWorkspace() {
    const name = prompt('Workspace name')
    if (!name) return
    const { data, error } = await supabase.rpc('create_workspace', { p_name: name })
    if (error) return alert(error.message)
    await loadWorkspaces()
    onChange(data as string)
  }

  function openRename() {
    if (!value) return
    const ws = items.find(i => i.id === value)
    setRenameName(ws?.name || '')
    setRenameOpen(true)
  }

  async function saveRename() {
    if (!value) return
    const next = renameName.trim()
    if (!next) return
    const { error } = await supabase.rpc('rename_workspace', {
      p_workspace_id: value,
      p_new_name: next,
    })
    if (error) return alert(error.message)
    setRenameOpen(false)
    // Refresh UI — you asked for an auto refresh:
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="input w-56"
        disabled={loading || items.length === 0}
        title="Select workspace"
      >
        {items.length === 0 ? (
          <option value="">{loading ? 'Loading…' : 'No workspaces'}</option>
        ) : (
          items.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))
        )}
      </select>

      <button className="btn" onClick={createWorkspace} title="New workspace">
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">New</span>
      </button>

      <button
        className="btn"
        onClick={openRename}
        disabled={!value}
        title="Rename workspace"
      >
        <Pencil className="w-4 h-4" />
        <span className="hidden sm:inline">Rename</span>
      </button>

      {/* Floating rename modal */}
      {renameOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRenameOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-xl
                          dark:bg-slate-900 dark:border-slate-700">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Rename workspace
            </div>
            <div className="mt-3">
              <label className="text-xs text-slate-600 dark:text-slate-300">New name</label>
              <input
                className="input mt-1 w-full"
                autoFocus
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename()
                  if (e.key === 'Escape') setRenameOpen(false)
                }}
                placeholder="Company name"
              />
              <div className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                Names are unique across the app (case-insensitive).
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setRenameOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={saveRename}
                disabled={!renameName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
