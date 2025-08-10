'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import {
  UserPlus, ChevronDown, Copy, X, Trash2, Users2,
  Crown, Briefcase, User as UserIcon, Power, LogOut
} from 'lucide-react'
import { useT } from '@/lib/i18n'

type Role = 'owner' | 'manager' | 'member' | 'unknown'

type Invite = {
  token: string
  workspace_id: string
  role: 'manager' | 'member'
  created_by: string | null
  expires_at: string | null
  used_by: string | null
  used_at: string | null
  revoked: boolean
  created_at: string
  created?: { display_name: string | null; avatar_url: string | null } | null
  used?: { display_name: string | null; avatar_url: string | null } | null
}

type MemberRow = {
  user_id: string
  role: 'owner' | 'manager' | 'member'
  created_at: string
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object'
}
function normalizeRole(input: unknown): Role {
  return input === 'owner' || input === 'manager' || input === 'member' ? input : 'unknown'
}
function coerceProfile(
  input: unknown
): { display_name: string | null; avatar_url: string | null } | null {
  if (Array.isArray(input)) return coerceProfile(input[0])
  if (!isObject(input)) return null
  const dn = input.display_name
  const au = input.avatar_url
  return {
    display_name: typeof dn === 'string' || dn === null ? (dn ?? null) : null,
    avatar_url: typeof au === 'string' || au === null ? (au ?? null) : null,
  }
}
const isRoleStrict = (v: string): v is Exclude<Role, 'unknown'> =>
  (['owner', 'manager', 'member'] as const).includes(v as Exclude<Role, 'unknown'>)

export default function WorkspaceAdmin({
  workspaceId,
  currentUserId,
  onDeleted,
}: {
  workspaceId: string
  currentUserId: string
  onDeleted?: () => void
}) {
  const t = useT()

  const [invites, setInvites] = useState<Invite[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [busyDelete, setBusyDelete] = useState(false)
  const [myRole, setMyRole] = useState<Role>('unknown')
  const [presenceKeys, setPresenceKeys] = useState<Set<string>>(new Set())

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMembers(), refreshInvites(), loadMyRole()])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, currentUserId])

  useEffect(() => { if (workspaceId) refreshAll() }, [workspaceId, refreshAll])

  // Presence
  useEffect(() => {
    if (!workspaceId || !currentUserId) return
    const channel = supabase.channel(`presence:${workspaceId}`, {
      config: { presence: { key: currentUserId } }
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, unknown[]>
      setPresenceKeys(new Set(Object.keys(state)))
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ user_id: currentUserId, at: new Date().toISOString() })
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, currentUserId])

  async function loadMyRole() {
    const { data } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', currentUserId)
      .maybeSingle()
    setMyRole(normalizeRole(data?.role))
  }

  async function refreshMembers() {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('user_id, role, created_at, profiles(display_name,avatar_url)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error || !Array.isArray(data)) return

    type RawMember = {
      user_id?: unknown
      role?: unknown
      created_at?: unknown
      profiles?: unknown
    }

    const next: MemberRow[] = []
    for (const r of data as unknown as RawMember[]) {
      if (!isObject(r)) continue
      const uid = typeof r.user_id === 'string' ? r.user_id : null
      const role = normalizeRole(r.role)
      const created_at = typeof r.created_at === 'string' ? r.created_at : ''
      if (!uid || role === 'unknown') continue
      next.push({
        user_id: uid,
        role,
        created_at,
        profiles: coerceProfile(r.profiles),
      })
    }
    setMembers(next)
  }

  async function refreshInvites() {
    const { data, error } = await supabase
      .from('workspace_invites')
      .select(`
        token, workspace_id, role, created_at, expires_at, used_by, used_at, revoked, created_by,
        created:profiles!workspace_invites_created_by_fkey(display_name,avatar_url),
        used:profiles!workspace_invites_used_by_fkey(display_name,avatar_url)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error || !Array.isArray(data)) return

    type RawInvite = {
      token?: unknown
      workspace_id?: unknown
      role?: unknown
      created_by?: unknown
      expires_at?: unknown
      used_by?: unknown
      used_at?: unknown
      revoked?: unknown
      created_at?: unknown
      created?: unknown
      used?: unknown
    }

    const next: Invite[] = []
    for (const r of data as unknown as RawInvite[]) {
      if (!isObject(r)) continue
      const token = typeof r.token === 'string' ? r.token : null
      const role = r.role === 'manager' || r.role === 'member' ? r.role : null
      const workspace_id = typeof r.workspace_id === 'string' ? r.workspace_id : null
      if (!token || !role || !workspace_id) continue
      next.push({
        token,
        workspace_id,
        role,
        created_by: typeof r.created_by === 'string' ? r.created_by : null,
        expires_at: typeof r.expires_at === 'string' ? r.expires_at : null,
        used_by: typeof r.used_by === 'string' ? r.used_by : null,
        used_at: typeof r.used_at === 'string' ? r.used_at : null,
        revoked: !!r.revoked,
        created_at: typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
        created: coerceProfile(r.created),
        used: coerceProfile(r.used),
      })
    }
    setInvites(next)
  }

  const isOwner = myRole === 'owner'
  const isAdmin = myRole === 'owner' || myRole === 'manager'

  // Role changes – owner only
  async function changeRole(userId: string, nextRole: Exclude<Role, 'unknown'>) {
    if (!isOwner) return alert(t('only_owners_change_roles') || 'Only owners can change roles.')
    const { error } = await supabase.rpc('set_member_role', {
      p_workspace_id: workspaceId, p_user_id: userId, p_role: nextRole
    })
    if (error) return alert(error.message)
    await refreshMembers()
  }

  // Remove member – owner only
  async function removeMember(userId: string) {
    if (!isOwner) return alert(t('only_owners_remove_members') || 'Only owners can remove members.')
    if (!confirm(t('confirm_remove_member') || 'Remove this member?')) return
    const { error } = await supabase.rpc('remove_member', {
      p_workspace_id: workspaceId, p_user_id: userId
    })
    if (error) return alert(error.message)
    await refreshMembers()
  }

  // Leave workspace (any role)
  async function leaveWorkspace() {
    if (!confirm(t('leave_workspace_confirm'))) return
    const { error } = await supabase.rpc('leave_workspace', { p_workspace_id: workspaceId })
    if (error) return alert(error.message)
    localStorage.removeItem('ws')
    window.location.href = '/dashboard'
  }

  // Delete workspace (owner)
  async function deleteWorkspace() {
    if (!isOwner) return alert(t('only_owners_remove_members') || 'Only owners can delete the workspace.')
    if (!confirm(t('delete_workspace_confirm') || 'Delete this workspace? This cannot be undone.')) return
    setBusyDelete(true)
    try {
      const rpc = await supabase.rpc('delete_workspace', { p_workspace_id: workspaceId })
      if (rpc.error) {
        const del = await supabase.from('workspaces').delete().eq('id', workspaceId)
        if (del.error) throw del.error
      }
      localStorage.removeItem('ws')
      onDeleted?.()
      window.location.href = '/dashboard'
    } catch (err) {
      const msg = isObject(err) && typeof err.message === 'string' ? err.message : 'Failed to delete'
      alert(msg)
    } finally {
      setBusyDelete(false)
    }
  }

  // Invites
  async function createInvite(role: 'member' | 'manager') {
    const { data, error } = await supabase.rpc('create_workspace_invite', {
      p_workspace_id: workspaceId, p_role: role, p_expires_minutes: 60 * 24 * 3
    })
    if (error) return alert(error.message)
    const token = String(data)
    const url = `${window.location.origin}/join/${token}`
    await navigator.clipboard.writeText(url).catch(() => {})
    alert(t('invite_link_copied', { url }))
    await refreshInvites()
    setRoleMenuOpen(false)
  }

  function inviteStatus(i: Invite): 'revoked'|'used'|'expired'|'active' {
    const now = Date.now()
    const exp = i.expires_at ? new Date(i.expires_at).getTime() : null
    if (i.revoked) return 'revoked'
    if (i.used_by) return 'used'
    if (exp && exp < now) return 'expired'
    return 'active'
  }

  async function removeInvite(token: string) {
    const { error } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('token', token)
      .eq('workspace_id', workspaceId)
    if (error) return alert(error.message)
    await refreshInvites()
  }

  const roster = useMemo(() => {
    return members.map(m => ({
      ...m,
      name: m.profiles?.display_name || m.user_id.slice(0, 8),
      avatar: m.profiles?.avatar_url || '',
      online: presenceKeys.has(m.user_id),
    }))
  }, [members, presenceKeys])

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {/* Members */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4" />
            <span>{t('members')}</span>
          </div>
        </div>

        <div className="card-body">
          {roster.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">{t('no_members_yet') || 'No members yet.'}</div>
          ) : (
            <ul className="space-y-2">
              {roster.map((m) => (
                <li
                  key={m.user_id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border dark:border-slate-700 p-2"
                >
                  {/* left (name/avatar) */}
                  <div className="min-w-0 flex items-center gap-3 overflow-hidden">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border dark:border-slate-700 bg-slate-200 shrink-0">
                      {m.avatar ? (
                        <Image
                          src={m.avatar}
                          alt={m.name}
                          fill
                          sizes="36px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-slate-600">{m.name[0]}</div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900
                          ${m.online ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        title={m.online ? t('online') : t('offline')}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                    </div>
                  </div>

                  {/* right (controls) */}
                  <div className="flex items-center gap-2 justify-end">
                    {isOwner ? (
                      <>
                        {/* Compact segmented control on md+, select on small screens */}
                        <div className="hidden md:inline-flex">
                          <RoleGroup value={m.role} onChange={(r) => changeRole(m.user_id, r)} />
                        </div>
                        <div className="md:hidden">
                          <select
                            className="input w-32"
                            value={m.role}
                            onChange={(e) => {
                              const v = e.target.value
                              if (isRoleStrict(v)) changeRole(m.user_id, v)
                            }}
                            title={t('change_role')}
                          >
                            <option value="owner">{t('owner')}</option>
                            <option value="manager">{t('manager')}</option>
                            <option value="member">{t('member')}</option>
                          </select>
                        </div>

                        <button
                          className="btn"
                          onClick={() => removeMember(m.user_id)}
                          title={t('remove_member') || t('remove')}
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </button>
                      </>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Leave workspace */}
        <div className="px-4 pb-4 flex justify-end">
          <button className="btn" onClick={leaveWorkspace} title={t('leave_workspace')}>
            <LogOut className="w-4 h-4" />
            {t('leave_workspace')}
          </button>
        </div>
      </div>

      {/* Invites */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span>{t('invites')}</span>
          </div>

          {isAdmin && (
            <div className="relative">
              <button
                className="btn"
                onClick={() => setRoleMenuOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={roleMenuOpen}
              >
                {t('new_invite')}
                <ChevronDown className="w-4 h-4" />
              </button>
              {roleMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1 w-44 rounded-xl border bg-white p-1
                             dark:bg-slate-900 dark:border-slate-700 shadow"
                >
                  <MenuItem onClick={() => createInvite('member')}>
                    {t('invite_member') || 'Invite Member'}
                  </MenuItem>
                  <MenuItem onClick={() => createInvite('manager')}>
                    {t('invite_manager') || 'Invite Manager'}
                  </MenuItem>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card-body">
          {invites.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">{t('no_invites_yet')}</div>
          ) : (
            <ul className="space-y-2">
              {invites.map((i) => {
                const statusKey = inviteStatus(i)
                const statusLabel =
                  statusKey === 'active' ? (t('status_active') || 'Active')
                  : statusKey === 'expired' ? (t('status_expired') || 'Expired')
                  : statusKey === 'used' ? (t('status_used') || 'Used')
                  : (t('status_revoked') || t('revoked') || 'Revoked')

                const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${i.token}`

                return (
                  <li key={i.token} className="rounded-xl border dark:border-slate-700 p-3">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full border text-xs dark:border-slate-700">
                            {t(i.role)}
                          </span>
                          <span className={`text-xs ${statusKey === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{joinUrl}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-1">
                            <span className="opacity-70">{t('created_by')}</span>
                            <AvatarMini name={i.created?.display_name} url={i.created?.avatar_url} />
                          </span>
                          {i.used_by && (
                            <span className="inline-flex items-center gap-1">
                              <span className="opacity-70">{t('used_by')}</span>
                              <AvatarMini name={i.used?.display_name} url={i.used?.avatar_url} />
                              <span>
                                {t('used_at', { at: new Date(i.used_at!).toLocaleString() })}
                              </span>
                            </span>
                          )}
                          {i.expires_at && <span>{t('expires_at', { at: new Date(i.expires_at).toLocaleString() })}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          className="btn"
                          onClick={async () => { await navigator.clipboard.writeText(joinUrl).catch(()=>{}); }}
                          title={t('copy_link')}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="btn" onClick={() => window.open(joinUrl, '_blank')} title={t('open')}>
                          <Power className="w-4 h-4" />
                        </button>
                        <button className="btn" onClick={() => removeInvite(i.token)} title={t('remove')}>
                          <X className="w-4 h-4 text-rose-600" />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Danger zone */}
      {isOwner && (
        <div className="card md:col-span-2">
          <div className="card-header flex items-center justify-between">
            <span>{t('danger_zone')}</span>
          </div>
          <div className="card-body flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {t('delete_workspace_help')}
            </div>
            <button
              className="btn btn-primary"
              onClick={deleteWorkspace}
              disabled={busyDelete}
              title={t('delete_workspace')}
            >
              <Trash2 className="w-4 h-4" />
              {busyDelete ? (t('deleting') || 'Deleting…') : t('delete_workspace')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
      {children}
    </button>
  )
}

function RoleBadge({ role }: { role: 'owner'|'manager'|'member' }) {
  const t = useT()
  const map = {
    owner:   { icon: <Crown className="w-3.5 h-3.5" />,   cls: 'border-amber-400/50' },
    manager: { icon: <Briefcase className="w-3.5 h-3.5" />, cls: 'border-sky-400/50' },
    member:  { icon: <UserIcon className="w-3.5 h-3.5" />,  cls: 'border-slate-300/60' },
  } as const
  return (
    <div className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 dark:border-slate-700 ${map[role].cls}`}>
      {map[role].icon}
      <span className="capitalize">{t(role)}</span>
    </div>
  )
}

function RoleGroup({
  value,
  onChange,
}: {
  value: 'owner'|'manager'|'member'
  onChange: (r: 'owner'|'manager'|'member') => void
}) {
  const t = useT()
  const opts: Array<{key:'owner'|'manager'|'member'; label:string; icon: JSX.Element}> = [
    { key: 'owner',   label: t('owner'),   icon: <Crown className="w-3.5 h-3.5" /> },
    { key: 'manager', label: t('manager'), icon: <Briefcase className="w-3.5 h-3.5" /> },
    { key: 'member',  label: t('member'),  icon: <UserIcon className="w-3.5 h-3.5" /> },
  ]
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 p-0.5">
      {opts.map(o => {
        const selected = o.key === value
        return (
          <button
            key={o.key}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1
                        ${selected
                          ? 'bg-white dark:bg-slate-900 shadow-sm border dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent'}`}
            onClick={() => !selected && onChange(o.key)}
            title={o.label}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function AvatarMini({ name, url }: { name?: string | null; url?: string | null }) {
  const t = useT()
  const label = name || ''
  const initial = (label || t('unknown') || 'U')[0]
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-5 h-5 rounded-full overflow-hidden bg-slate-300 relative">
        {url ? (
          <Image
            src={url}
            alt={label || 'avatar'}
            fill
            sizes="20px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="w-full h-full grid place-items-center text-[10px] text-slate-700">
            {initial}
          </span>
        )}
      </span>
      <span className="text-xs">{label || (t('unknown') || 'Unknown')}</span>
    </span>
  )
}
