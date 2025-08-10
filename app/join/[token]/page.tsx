'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Params = { token: string }

export default function JoinPage({ params }: { params: Promise<Params> }) {
  const router = useRouter()
  const [msg, setMsg] = useState('Checking invite…')
  const [token, setToken] = useState<string | null>(null)

  // Resolve async params (Next 15 passes params as a Promise)
  useEffect(() => {
    let alive = true
    Promise
      .resolve(params)
      .then(p => { if (alive) setToken(p?.token ?? null) })
      .catch(() => { if (alive) setMsg('Invalid invite link') })
    return () => { alive = false }
  }, [params])

  // Once we have the token, run the join flow on the client
  useEffect(() => {
    if (!token) return
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        // Send to sign-in page; include return path back to this invite
        const back = encodeURIComponent(`/join/${token}`)
        window.location.href = `/?returnTo=${back}`
        return
      }

      const { data: wid, error } = await supabase.rpc('accept_workspace_invite', {
        p_token: token,
      })
      if (error) {
        setMsg(error.message)
        return
      }

      try { localStorage.setItem('ws', String(wid)) } catch {}
      router.replace('/dashboard')
    })().catch(err => setMsg(err?.message ?? 'Something went wrong'))
  }, [token, router])

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 dark:bg-slate-900">
      <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-6">
        {msg}
      </div>
    </div>
  )
}
