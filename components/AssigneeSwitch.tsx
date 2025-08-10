'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Role = 'owner' | 'manager' | 'member' | 'unknown'

type Member = {
  user_id: string
  role: Exclude<Role, 'unknown'>
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

// ---- Runtime guards / coercers (no `any`) ----
function normalizeRole(input: unknown): Role {
  return input === 'owner' || input === 'manager' || input === 'member' ? input : 'unknown'
}

function isProfile(x: unknown): x is { display_name: unknown; avatar_url: unknown } {
  return !!x && typeof x === 'object' && 'display_name' in (x as Record<string, unknown>) && 'avatar_url' in (x as Record<string, unknown>)
}

function coerceProfile(
  input: unknown
): { display_name: string | null; avatar_url: string | null } | null {
  if (Array.isArray(input)) {
    const first = input[0]
    if (isProfile(first)) {
      const dn = first.display_name
      const au = first.avatar_url
      return {
        display_name: typeof dn === 'string' || dn === null ? dn : null,
        avatar_url: typeof au === 'string' || au === null ? au : null,
      }
    }
    return null
  }
  if (isProfile(input)) {
    const dn = input.display_name
    const au = input.avatar_url
    return {
      display_name: typeof dn === 'string' || dn === null ? dn : null,
      avatar_url: typeof au === 'string' || au === null ? au : null,
    }
  }
  return null
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
  const [myRole, setMyRole] = useState<Role>('unknown')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        // my role
        const { data: me } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', currentUserId)
          .maybeSingle()

        if (!alive) return
        setMyRole(normalizeRole(me?.role))

        // roster with profile names (profiles may come back as object OR array)
        const { data: rows } = await supabase
          .from('workspace_members')
          .select('user_id, role, profiles(display_name,avatar_url)')
          .eq('workspace_id', workspaceId)
          .order('role', { ascending: true })

        if (!alive) return

        const safeMembers: Member[] = (Array.isArray(rows) ? rows : [])
          .map((r: unknown) => {
            if (!r || typeof r !== 'object') return null
            const rec = r as Record<string, unknown>

            const uid = typeof rec.user_id === 'string' ? rec.user_id : null
            const role = normalizeRole(rec.role)
            const prof = coerceProfile(rec.profiles)

            if (!uid || role === 'unknown') return null
            return { user_id: uid, role, profiles: prof }
          })
          .filter((m): m is Member => m !== null)

        setMembers(safeMembers)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [workspaceId, currentUserId])

  const isAdmin = myRole === 'owner' || myRole === 'manager'

  const options = useMemo(() => {
    const list = members.map((m) => ({
      id: m.user_id,
      name: m.profiles?.display_name || m.user_id.slice(0, 8),
      role: m.role,
    }))
    // sort by role then name
    const order: Record<Exclude<Role, 'unknown'>, number> = {
      owner: 0,
      manager: 1,
      member: 2,
    }
    return list.sort((a, b) => {
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
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} {o.id === currentUserId ? '(You)' : ''} — {o.role}
          </option>
        ))}
      </select>
    </div>
  )
}
