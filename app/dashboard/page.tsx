'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Header } from '@/components/ui'
import Sidebar from '@/components/Sidebar'
import TabEditor from '@/components/TabEditor'
import type { Tab } from '@/lib/types'
import { useT } from '@/lib/i18n'
import WorkspaceSwitch from '@/components/WorkspaceSwitch'
import WorkspaceAdmin from '@/components/WorkspaceAdmin'
import AssigneeSwitch from '@/components/AssigneeSwitch'
import ChatDock from '@/components/ChatDock'

function monthLabel(d = new Date()) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function Dashboard() {
  const router = useRouter()
  const t = useT()

  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState<string>('')
  const [workspaceId, setWorkspaceId] = useState<string>('')

  const [tabs, setTabs] = useState<Tab[]>([])
  const [currentId, setCurrentId] = useState<string | undefined>()
  const current = useMemo(() => tabs.find((tab) => tab.id === currentId), [tabs, currentId])

  const [search, setSearch] = useState('')

  // Role / filters
  const [myRole, setMyRole] = useState<'owner' | 'manager' | 'member' | 'unknown'>('unknown')
  const [assignee, setAssignee] = useState<string>('') // '' = All

  // -------- Auth boot --------
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/')
        return
      }
      setUserEmail(data.user.email || '')
      setUserId(data.user.id)

      // restore last workspace
      const savedWs = localStorage.getItem('ws')
      if (savedWs) setWorkspaceId(savedWs)
    })()
  }, [router])

  // -------- Load my role when workspace/user known --------
  useEffect(() => {
    if (!workspaceId || !userId) return
    ;(async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()
      if (!error && data?.role) setMyRole(data.role as any)
    })()
  }, [workspaceId, userId])

  // -------- Decide assignee selector default when role/workspace changes --------
  useEffect(() => {
    if (!workspaceId || !userId || myRole === 'unknown') return
    if (myRole === 'owner' || myRole === 'manager') {
      const saved = localStorage.getItem(`assignee:${workspaceId}`) || ''
      setAssignee(saved) // admins can see all by default
    } else {
      setAssignee(userId) // members locked to themselves
    }
  }, [workspaceId, userId, myRole])

  // -------- Tabs loader (stable) --------
  const refreshTabs = useCallback(async () => {
    if (!workspaceId) return
    let q = supabase
      .from('tabs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (assignee) q = q.eq('assignee_id', assignee)

    const { data, error } = await q
    if (error) {
      console.error(error)
      return
    }
    const list = (data as any) || []
    setTabs(list)
    setCurrentId((prev) => (prev && list.some((t: any) => t.id === prev) ? prev : list?.[0]?.id))
  }, [workspaceId, assignee])

  // refresh when workspace or assignee changes
  useEffect(() => {
    if (!workspaceId) return
    localStorage.setItem('ws', workspaceId)
    refreshTabs()
  }, [workspaceId, refreshTabs])

  useEffect(() => {
    if (!workspaceId) return
    // only persist assignee for admins
    if (myRole === 'owner' || myRole === 'manager') {
      localStorage.setItem(`assignee:${workspaceId}`, assignee)
    }
    refreshTabs()
  }, [assignee, myRole, workspaceId, refreshTabs])

  // -------- Actions --------
  async function addTab() {
    if (!workspaceId) return alert(t('choose_workspace_first'))
    const defaults = [{ id: crypto.randomUUID(), name: t('default_role'), rate: 0 }]
    const { data, error } = await supabase
      .from('tabs')
      .insert({
        workspace_id: workspaceId,
        assignee_id: userId,
        name: monthLabel(),
        hours: 0,
        entries: [],
        roles: defaults,
        invoice: null,
        notes: null,
      })
      .select('*')
      .single()
    if (error) return alert(error.message)
    setTabs((prev) => [...prev, data as any])
    setCurrentId((data as any).id)
  }

  async function deleteTab(id: string) {
    const ttab = tabs.find((x) => x.id === id)
    if (!ttab) return

    const allowed = myRole === 'owner' || ttab.assignee_id === userId
    if (!allowed) return alert(t('delete_tab_not_allowed'))

    if (!confirm(t('delete_confirm'))) return

    // cleanup storage: ws/assignee/tab
    const base = `${ttab.workspace_id}/${ttab.assignee_id}/${ttab.id}`

    const removeAll = async (bucket: 'images' | 'invoices') => {
      const { data: files } = await supabase.storage.from(bucket).list(base)
      if (files?.length) {
        await supabase.storage.from(bucket).remove(files.map((f) => `${base}/${f.name}`))
      }
    }
    await removeAll('images')
    await removeAll('invoices')

    const { error } = await supabase.from('tabs').delete().eq('id', id)
    if (error) return alert(error.message)
    await refreshTabs()
  }

  async function saveTabChanges(next: Tab) {
    const { error } = await supabase
      .from('tabs')
      .update({
        name: next.name,
        hours: next.hours,
        entries: next.entries,
        roles: next.roles,
        invoice: next.invoice,
        notes: next.notes,
      })
      .eq('id', next.id)
      .eq('workspace_id', workspaceId)
    if (error) console.error(error)
    setTabs((prev) => prev.map((t) => (t.id === next.id ? next : t)))
  }

  async function exportBackup() {
    const payload = {
      app: 'work-tracker-cloud',
      version: 2,
      exportedAt: new Date().toISOString(),
      workspaceId,
      tabs,
    }
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `work-tracker-${workspaceId}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function importBackup(file: File) {
    if (!workspaceId) return alert(t('choose_workspace_first'))
    const text = await file.text()
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {
      return alert(t('invalid_json'))
    }
    if (!data || !Array.isArray(data.tabs)) return alert(t('invalid_backup'))
    for (const ttab of data.tabs) {
      await supabase.from('tabs').insert({
        workspace_id: workspaceId,
        name: ttab.name,
        hours: ttab.hours,
        entries: ttab.entries || [],
        roles: ttab.roles || [],
        invoice: ttab.invoice || null,
        notes: ttab.notes || null,
      })
    }
    await refreshTabs()
    alert(t('imported_tabs', { count: data.tabs.length }) || `Imported ${data.tabs.length} tab(s).`)
  }

  // -------- Storage (workspace-scoped) --------
  const [imageItems, setImageItems] = useState<{ id: string; name: string; url: string }[]>([])
  const [pdfItems, setPdfItems] = useState<{ id: string; name: string; url: string }[]>([])

  useEffect(() => {
    ;(async () => {
      if (current?.id) {
        setImageItems(await listImages(current.id))
        setPdfItems(await listPdfs(current.id))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  async function uploadImages(files: File[]) {
    if (!current || !workspaceId) return
    const base = `${workspaceId}/${current.assignee_id}/${current.id}`
    for (const f of files) {
      const path = `${base}/${crypto.randomUUID()}-${f.name}`
      const { error } = await supabase.storage.from('images').upload(path, f, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) alert(error.message)
    }
    setImageItems(await listImages(current.id, current.assignee_id))
  }

  async function uploadPdfs(files: File[]) {
    if (!current || !workspaceId) return
    const base = `${workspaceId}/${current.assignee_id}/${current.id}`
    for (const f of files) {
      const path = `${base}/${crypto.randomUUID()}-${f.name}`
      const { error } = await supabase.storage.from('invoices').upload(path, f, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) alert(error.message)
    }
    setPdfItems(await listPdfs(current.id, current.assignee_id))
  }

  async function listImages(tabId: string, assigneeId?: string) {
    if (!workspaceId) return []
    const tab = tabs.find((t) => t.id === tabId)
    const aid = assigneeId || tab?.assignee_id
    if (!aid) return []
    const prefix = `${workspaceId}/${aid}/${tabId}`
    const { data, error } = await supabase.storage.from('images').list(prefix)
    if (error || !data) return []
    const paths = data.map((f) => `${prefix}/${f.name}`)
    const { data: signed } = await supabase.storage.from('images').createSignedUrls(paths, 3600)
    return data.map((f, i) => ({ id: f.name, name: f.name, url: signed?.[i]?.signedUrl || '' }))
  }

  async function listPdfs(tabId: string, assigneeId?: string) {
    if (!workspaceId) return []
    const tab = tabs.find((t) => t.id === tabId)
    const aid = assigneeId || tab?.assignee_id
    if (!aid) return []
    const prefix = `${workspaceId}/${aid}/${tabId}`
    const { data, error } = await supabase.storage.from('invoices').list(prefix)
    if (error || !data) return []
    const paths = data.map((f) => `${prefix}/${f.name}`)
    const { data: signed } = await supabase.storage.from('invoices').createSignedUrls(paths, 3600)
    return data.map((f, i) => ({ id: f.name, name: f.name, url: signed?.[i]?.signedUrl || '' }))
  }

  async function removeImage(name: string) {
    if (!current || !workspaceId) return
    const prefix = `${workspaceId}/${current.assignee_id}/${current.id}`
    await supabase.storage.from('images').remove([`${prefix}/${name}`])
    setImageItems(await listImages(current.id, current.assignee_id))
  }

  async function removePdf(name: string) {
    if (!current || !workspaceId) return
    const prefix = `${workspaceId}/${current.assignee_id}/${current.id}`
    await supabase.storage.from('invoices').remove([`${prefix}/${name}`])
    setPdfItems(await listPdfs(current.id, current.assignee_id))
  }

  // -------- Derived UI --------
  const tabsFiltered = tabs.filter(
    (t) =>
      (!assignee || t.assignee_id === assignee) &&
      (search ? (t.name || '').toLowerCase().includes(search.toLowerCase()) : true)
  )

  if (!userId) return null

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <Header
        userEmail={userEmail}
        onExport={exportBackup}
        onImport={importBackup}
        onSearchChange={setSearch}
        onAddTab={addTab}
      />

      {/* Workspace & assignee filters */}
      <div className="max-w-6xl mx-auto px-4 pt-3">
        <WorkspaceSwitch value={workspaceId} onChange={setWorkspaceId} />
        <AssigneeSwitch
          workspaceId={workspaceId}
          currentUserId={userId}
          value={assignee}
          onChange={setAssignee}
        />
      </div>

      {/* Admin panel */}
      <div className="max-w-6xl mx-auto px-4">
        <WorkspaceAdmin
          workspaceId={workspaceId}
          currentUserId={userId}
          onDeleted={() => {
            window.location.href = '/dashboard'
          }}
        />
      </div>

      {/* Chat */}
      {workspaceId && userId && <ChatDock workspaceId={workspaceId} currentUserId={userId} />}

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-4">
        <Sidebar
          tabs={tabsFiltered}
          currentId={currentId}
          onSelect={setCurrentId}
          onAdd={addTab}
          onDelete={deleteTab}
          myRole={myRole}
          currentUserId={userId}
        />
        <main className="flex-1 min-w-0">
          {!current ? (
            <div className="h-[60vh] grid place-items-center text-slate-500 dark:text-slate-300">
              {workspaceId ? t('select_or_create') : t('choose_workspace_first')}
            </div>
          ) : (
            <TabEditor
              tab={current}
              onSave={saveTabChanges}
              onUploadImages={uploadImages}
              onUploadPdfs={uploadPdfs}
              imageItems={imageItems}
              pdfItems={pdfItems}
              onRemoveImage={removeImage}
              onRemovePdf={removePdf}
            />
          )}
        </main>
      </div>
    </div>
  )
}
