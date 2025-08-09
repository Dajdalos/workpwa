'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Send, Trash2, Pencil } from 'lucide-react'
import clsx from 'clsx'

type Msg = {
  id: string
  workspace_id: string
  tab_id: string | null
  sender_id: string
  content: string
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  profiles?: { display_name: string | null; avatar_url: string | null } | null
}

export default function ChatPanel({
  workspaceId,
  tabId,
  currentUserId,
  className,            // ← new
}: {
  workspaceId: string
  tabId?: string
  currentUserId: string
  className?: string
}) {
  const [myRole, setMyRole] = useState<'owner'|'manager'|'member'|'unknown'>('unknown')
  const [items, setItems] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!workspaceId || !currentUserId) return
    ;(async () => {
      const { data } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', currentUserId)
        .maybeSingle()
      if (data?.role) setMyRole(data.role as any)
    })()
  }, [workspaceId, currentUserId])

  // initial fetch
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
      if (data) setItems(data as any)
      scrollToBottom()
    })()
  }, [workspaceId, tabId])

  // realtime: broadcast (instant) + pg changes (when available)
  useEffect(() => {
    if (!workspaceId) return
    const chanName = `ws:${workspaceId}:chat`
    const channel = supabase.channel(chanName, { config: { broadcast: { self: true } } })

    // broadcast
    channel.on('broadcast', { event: 'msg' }, (payload: any) => {
      const m = payload.payload as any
      if (typeof tabId !== 'undefined' && m.tab_id !== tabId) return
      setItems(prev => (prev.some(x => x.id === m.id) ? prev : [...prev, {
        id: m.id, workspace_id: m.workspace_id, tab_id: m.tab_id,
        sender_id: m.sender_id, content: m.content, created_at: m.created_at,
        edited_at: null, deleted_at: null,
        profiles: m.profile ? { display_name: m.profile.display_name ?? null, avatar_url: m.profile.avatar_url ?? null } : undefined
      }]))
      scrollToBottom()
    })

    // db changes (if publication enabled)
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table: 'messages', filter: `workspace_id=eq.${workspaceId}`
    }, async (payload) => {
      const row = payload.new as Msg
      const old = payload.old as any
      if (typeof tabId !== 'undefined' && row?.tab_id !== tabId) return
      if (payload.eventType === 'INSERT') {
        let enriched: Msg = row
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name,avatar_url')
          .eq('id', row.sender_id)
          .maybeSingle()
        if (prof) enriched = { ...row, profiles: prof as any }
        setItems(prev => (prev.some(x => x.id === enriched.id) ? prev : [...prev, enriched]))
        scrollToBottom()
      } else if (payload.eventType === 'UPDATE') {
        setItems(prev => prev.map(m => m.id === row.id ? { ...m, ...row } : m))
      } else if (payload.eventType === 'DELETE') {
        if (old?.id) setItems(prev => prev.filter(m => m.id !== old.id))
      }
    })

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, tabId])

  function scrollToBottom() {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }))
  }

  async function send() {
    const content = text.trim()
    if (!content) return
    setText('')

    const tempId = `temp-${crypto.randomUUID()}`
    const createdAt = new Date().toISOString()
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
        id: tempId, workspace_id: workspaceId, tab_id: tabId ?? null,
        sender_id: currentUserId, content, created_at: createdAt, profile: meProf || {}
      }
    })

    // optimistic local append (in case broadcast self-echo is delayed)
    setItems(prev => [...prev, {
      id: tempId, workspace_id: workspaceId, tab_id: tabId ?? null,
      sender_id: currentUserId, content, createdAt,
      edited_at: null, deleted_at: null,
      profiles: meProf ? { display_name: (meProf as any).display_name, avatar_url: (meProf as any).avatar_url } : undefined
    } as any])
    scrollToBottom()

    // persist
    const { data, error } = await supabase.from('messages').insert({
      workspace_id: workspaceId, tab_id: tabId ?? null, sender_id: currentUserId, content
    }).select('id,created_at').single()

    if (!error && data) {
      setItems(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, created_at: data.created_at } : m))
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
    if (error) alert(error.message); else setEditingId(null)
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
    <div className={clsx(
      'rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 flex flex-col',
      className || 'h-[420px]' // default height unless overridden
    )}>
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
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-300 shrink-0">
                    {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full grid place-items-center text-xs text-slate-700">{name[0]}</div>}
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
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{ts}{m.edited_at ? ' • edited' : ''}</div>
                  </div>

                  {editingId === m.id ? (
                    <div className="mt-1">
                      <textarea
                        className="input w-full"
                        rows={2}
                        defaultValue={m.content}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault(); saveEdit(m.id, (e.target as HTMLTextAreaElement).value)
                          }
                        }}
                      />
                      <div className="mt-1 flex gap-2 justify-end">
                        <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => {
                          const el = (document.activeElement as HTMLTextAreaElement)
                          saveEdit(m.id, el?.value || '')
                        }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 whitespace-pre-wrap break-words">{m.content}</div>
                  )}

                  {(mine || canModerate) && editingId !== m.id && (
                    <div className="mt-1 flex gap-2 justify-end">
                      {mine && <button className="btn" onClick={() => setEditingId(m.id)} title="Edit"><Pencil className="w-4 h-4"/></button>}
                      {/*
                        Disable delete button for temp messages.
                        Show tooltip if disabled.
                      */}
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
            onChange={e => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send() }
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
