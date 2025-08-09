export type Role = { id: string; name: string; rate: number }

export type EntryRow = {
  id: string
  date: string
  hours: number
  note?: string
  roleId?: string   // <— new: which role this entry uses
}


export type Workspace = {
  id: string
  name: string
  owner: string
  created_at: string
}

export type WorkspaceMember = {
  workspace_id: string
  user_id: string
  role: 'owner' | 'manager' | 'member'
  invited_by?: string | null
  created_at: string
}

export type Tab = {
  id: string
  workspace_id: string
  assignee_id: string
  owner: string
  name: string
  hours: number
  entries: EntryRow[]
  roles: Role[]     // <— new: list of roles for this tab
  invoice: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
