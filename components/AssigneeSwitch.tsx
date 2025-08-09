'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Member = {
  user_id: string
  role: 'owner' | 'manager' | 'member'
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

export default function AssigneeSwitch({
  workspaceId,
  currentUserId,
  value,
  onChange,
}: {
  workspaceId: string
  currentUserId: string
  value: string // '' means "All"
  onChange: (id: string) => void
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [myRole, setMyRole] = useState<'owner'|'manager'|'member'|'unknown'>('unknown')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    ;(async () => {
      setLoading(true)
      // my role
      const { data: me } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', currentUserId)
        .maybeSingle()
      setMyRole((me?.role as any) || 'unknown')

      // roster with profile names
      const { data: rows } = await supabase
        .from('workspace_members')
        .select('user_id, role, profiles(display_name,avatar_url)')
        .eq('workspace_id', workspaceId)
        .order('role', { ascending: true })
      setMembers((rows as any) || [])
      setLoading(false)
    })()
  }, [workspaceId, currentUserId])

  const isAdmin = myRole === 'owner' || myRole === 'manager'
  const options = useMemo(() => {
    const list = members.map(m => ({
      id: m.user_id,
      name: m.profiles?.display_name || m.user_id.slice(0, 8),
      role: m.role,
    }))
    // sort by role then name
    return list.sort((a, b) => {
      const order = { owner: 0, manager: 1, member: 2 } as any
      if (order[a.role] !== order[b.role]) return order[a.role] - order[b.role]
      return a.name.localeCompare(b.name)
    })
  }, [members])

  if (!isAdmin) return null // workers don’t get the switcher

  return (
    <div className="mt-3 flex items-center gap-2">
      <label className="text-sm text-slate-600 dark:text-slate-300">Assignee</label>
      <select
        className="input w-64"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || !workspaceId}
        title="Filter tabs by assignee"
      >
        <option value="">{loading ? 'Loading…' : 'All people'}</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>
            {o.name} {o.id === currentUserId ? '(You)' : ''} — {o.role}
          </option>
        ))}
      </select>
    </div>
  )
}
