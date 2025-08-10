'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { Send, Trash2, Pencil } from 'lucide-react'
import clsx from 'clsx'

type Role = 'owner' | 'manager' | 'member' | 'unknown'

type ProfileLite = { display_name: string | null; avatar_url: string | null } | null

type Msg = {
  id: string
  workspace_id: string
  tab_id: string | null
  sender_id: string
  content: string
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  profiles?: ProfileLite
}

function normalizeRole(input: unknown): Role {
  return input === 'owner' || input === 'manager' || input === 'member' ? input : 'unknown'
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object'
}

function coerceProfile(x: unknown): ProfileLite {
  // Supabase relation can return object or array; accept both.
  if (Array.isArray(x)) return coerceProfile(x[0])
  if (!isObject(x)) return null
  const dn = x.display_name
  const au = x.avatar_url
  return {
    display_name: typeof dn === 'string' || dn === null ? dn ?? null : null,
    avatar_url: typeof au === 'string' || au === null ? au ?? null : null,
  }
}

function coerceMsgFromRow(row: unknown): Msg | null {
  if (!isObject(row)) return null
  const id = typeof row.id === 'string' ? row.id : null
  const workspace_id = typeof row.workspace_id === 'string' ? row.workspace_id : null
  const tab_id = typeof row.tab_id === 'string' || row.tab_id === null ? (row.tab_id as string | null) : null
  const sender_id = typeof row.sender_id === 'string' ? row.sender_id : null
  const content = typeof row.content === 'string' ? row.content : null
  const created_at = typeof row.created_at === 'string' ? row.created_at : null
  const edited_at = typeof row.edited_at === 'string' || row.edited_at === null ? (row.edited_at as string | null) : null
  const deleted_at = typeof row.deleted_at === 'string' || row.deleted_at === null ? (row.deleted_at as string | null) : null
  if (!id || !workspace_id || !sender_id || !content || !created_at) return null
  return {
    id,
    workspace_id,
    tab_id: tab_id ?? null,
    sender_id,
    content,
    created_at,
    edited_at: edited_at ?? null,
    deleted_at: deleted_at ?? null,
    profiles: coerceProfile(row.profiles),
  }
}

export default function ChatPanel({
  workspaceId,
  tabId,
  currentUserId,
  className,
}: {
  workspaceId: string
  tabId?: string
  currentUserId: string
  className?: string
}) {
  const [myRole, setMyRole] = useState<Role>('unknown')
  const [items, setItems] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // My role
  useEffect(() => {
    if (!workspaceId || !currentUserId) return
    ;(async () => {
      const { data } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', currentUserId)
        .maybeSingle()
      setMyRole(normalizeRole(data?.role))
    })()
  }, [workspaceId, currentUserId])

  // Initial fetch
  useEffect(() => {
    if (!workspaceId) return
    ;(async () => {
      let q = supabase
        .from('messages')
        .select('*, profiles(display_name,avatar_url)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
      if (tabId) q = q.eq('tab_id', tabId)
      const { data } = await q
      const list = Array.isArray(data) ? data.map(coerceMsgFromRow).filter(Boolean) as Msg[] : []
      setItems(list)
      scrollToBottom()
    })()
  }, [workspaceId, tabId])

  // Realtime: broadcast + postgres_changes
  useEffect(() => {
    if (!workspaceId) return
    const chanName = `ws:${workspaceId}:chat`
    const channel = supabase.channel(chanName, { config: { broadcast: { self: true } } })

    // broadcast
    channel.on('broadcast', { event: 'msg' }, (payload: unknown) => {
      if (!isObject(payload)) return
      const p = payload as { payload?: unknown }
      if (!isObject(p.payload)) return
      const m = p.payload as Record<string, unknown>
      // Filter by tab if present
      if (typeof tabId !== 'undefined') {
        const t = m.tab_id
        if (!(typeof t === 'string' || t === null) || t !== (tabId ?? null)) return
      }
      const created_at = typeof m.created_at === 'string' ? m.created_at : new Date().toISOString()
      const msg: Msg | null = coerceMsgFromRow({
        id: m.id,
        workspace_id: m.workspace_id,
        tab_id: m.tab_id ?? null,
        sender_id: m.sender_id,
        content: m.content,
        created_at,
        edited_at: null,
        deleted_at: null,
        profiles: m.profile
          ? { display_name: (m.profile as Record<string, unknown>).display_name ?? null,
              avatar_url: (m.profile as Record<string, unknown>).avatar_url ?? null }
          : null,
      })
      if (!msg) return
      setItems(prev => (prev.some(x => x.id === msg.id) ? prev : [...prev, msg]))
      scrollToBottom()
    })

    // postgres changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `workspace_id=eq.${workspaceId}` },
      async (payload: unknown) => {
        if (!isObject(payload)) return
        const p = payload as { eventType?: string; new?: unknown; old?: unknown }
        const row = coerceMsgFromRow(p.new)
        if (!row) return
        if (typeof tabId !== 'undefined' && row.tab_id !== (tabId ?? null)) return

        if (p.eventType === 'INSERT') {
          let enriched: Msg = row
          const { data: prof } = await supabase
            .from('profiles')
            .select('display_name,avatar_url')
            .eq('id', row.sender_id)
            .maybeSingle()
          if (prof) {
            enriched = { ...row, profiles: coerceProfile(prof) }
          }
          setItems(prev => (prev.some(x => x.id === enriched.id) ? prev : [...prev, enriched]))
          scrollToBottom()
        } else if (p.eventType === 'UPDATE') {
          setItems(prev => prev.map(m => (m.id === row.id ? { ...m, ...row } : m)))
        } else if (p.eventType === 'DELETE') {
          const oldId =
            isObject(p.old) && typeof (p.old as Record<string, unknown>).id === 'string'
              ? ((p.old as Record<string, unknown>).id as string)
              : null
          if (oldId) setItems(prev => prev.filter(m => m.id !== oldId))
        }
      }
    )

    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, tabId])

  function scrollToBottom() {
    requestAnimationFrame(() =>
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    )
  }

  async function send() {
    const content = text.trim()
    if (!content) return
    setText('')

    const tempId = `temp-${crypto.randomUUID()}`
    const created_at = new Date().toISOString()
    const { data: meProf } = await supabase
      .from('profiles')
      .select('display_name,avatar_url')
      .eq('id', currentUserId)
      .maybeSingle()

    // instant broadcast
    supabase.channel(`ws:${workspaceId}:chat`).send({
      type: 'broadcast',
      event: 'msg',
      payload: {
        id: tempId,
        workspace_id: workspaceId,
        tab_id: tabId ?? null,
        sender_id: currentUserId,
        content,
        created_at,
        profile: meProf || {},
      },
    })

    // optimistic local append (in case broadcast self-echo is delayed)
    setItems(prev => [
      ...prev,
      {
        id: tempId,
        workspace_id: workspaceId,
        tab_id: tabId ?? null,
        sender_id: currentUserId,
        content,
        created_at,
        edited_at: null,
        deleted_at: null,
        profiles: coerceProfile(meProf ?? null),
      },
    ])
    scrollToBottom()

    // persist
    const { data, error } = await supabase
      .from('messages')
      .insert({
        workspace_id: workspaceId,
        tab_id: tabId ?? null,
        sender_id: currentUserId,
        content,
      })
      .select('id,created_at')
      .single()

    if (!error && data) {
      setItems(prev =>
        prev.map(m => (m.id === tempId ? { ...m, id: data.id, created_at: data.created_at } : m))
      )
    } else if (error) {
      setItems(prev => prev.filter(m => m.id !== tempId))
      alert(error.message)
    }
  }

  async function saveEdit(id: string, content: string) {
    const body = content.trim()
    if (!body) return
    const { error } = await supabase
      .from('messages')
      .update({ content: body, edited_at: new Date().toISOString() })
      .eq('id', id)
    if (error) alert(error.message)
    else setEditingId(null)
  }

  async function remove(id: string) {
    // If the message is still a client-temp one, just drop it locally
    if (id.startsWith('temp-')) {
      setItems(prev => prev.filter(m => m.id !== id))
      return
    }
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) alert(error.message)
  }

  const canModerate = myRole === 'owner' || myRole === 'manager'
  const me = (id: string) => id === currentUserId

  return (
    <div
      className={clsx(
        'rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 flex flex-col',
        className || 'h-[420px]' // default height unless overridden
      )}
    >
      <div className="px-3 py-2 border-b dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100">
        {tabId ? 'Tab chat' : 'Workspace chat'}
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2 text-slate-800 dark:text-slate-100"
      >
        {items.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">No messages yet.</div>
        ) : (
          items.map(m => {
            const mine = me(m.sender_id)
            const name = m.profiles?.display_name || m.sender_id.slice(0, 6)
            const avatar = m.profiles?.avatar_url || ''
            const ts = new Date(m.created_at).toLocaleString()
            return (
              <div key={m.id} className={`flex items-start gap-2 ${mine ? 'justify-end' : ''}`}>
                {!mine && (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-300 shrink-0 relative">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={name}
                        fill
                        sizes="28px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-slate-700">
                        {name[0]}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={clsx(
                    'max-w-[78%] rounded-xl border px-3 py-2 text-sm leading-5',
                    mine
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
                    'text-slate-800 dark:text-slate-100'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-medium opacity-80">{mine ? 'You' : name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {ts}
                      {m.edited_at ? ' • edited' : ''}
                    </div>
                  </div>

                  {editingId === m.id ? (
                    <div className="mt-1">
                      <textarea
                        className="input w-full"
                        rows={2}
                        defaultValue={m.content}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault()
                            const val = (e.target as HTMLTextAreaElement).value
                            saveEdit(m.id, val)
                          }
                        }}
                      />
                      <div className="mt-1 flex gap-2 justify-end">
                        <button className="btn" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            const el = document.activeElement as HTMLTextAreaElement | null
                            saveEdit(m.id, el?.value || '')
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 whitespace-pre-wrap break-words">{m.content}</div>
                  )}

                  {(mine || canModerate) && editingId !== m.id && (
                    <div className="mt-1 flex gap-2 justify-end">
                      {mine && (
                        <button className="btn" onClick={() => setEditingId(m.id)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {(() => {
                        const isTemp = m.id.startsWith('temp-')
                        return (
                          <button
                            className="btn"
                            onClick={() => remove(m.id)}
                            disabled={isTemp}
                            title={isTemp ? 'Please wait a moment…' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t dark:border-slate-700 p-2">
        <div className="flex items-end gap-2">
          <textarea
            className="input flex-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            rows={2}
            placeholder="Type a message… (Ctrl/⌘+Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button className="btn btn-primary" onClick={send} title="Send">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
