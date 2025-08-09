'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ProfilePage() {
  const [userId, setUserId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/'; return }
      setUserId(data.user.id)
      setEmail(data.user.email || '')
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      if (prof) {
        setDisplayName(prof.display_name || '')
        setAvatarUrl(prof.avatar_url || '')
      }
    })()
  }, [])

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
    setSaving(false)
    if (error) return alert(error.message)
    alert('Saved!')
  }

  async function pickAvatar(file: File) {
    if (!userId || !file) return
    const path = `${userId}/avatar-${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: false })
    if (error) return alert(error.message)
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="max-w-xl mx-auto p-6">
        <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-6 space-y-4">
          <h1 className="text-xl font-semibold">Profile</h1>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border dark:border-slate-700 bg-slate-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-slate-500">{(displayName || email || 'U')[0]}</div>
              )}
            </div>
            <label className="btn">
              Change avatar
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) pickAvatar(f)
              }} />
            </label>
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-300">Display name</label>
            <input className="input mt-1" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-300">Email</label>
            <input className="input mt-1" value={email} readOnly />
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <a className="btn" href="/dashboard">Back</a>
          </div>
        </div>
      </div>
    </div>
  )
}
