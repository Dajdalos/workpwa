'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function JoinPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [msg, setMsg] = useState('Checking invite…')

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        // send to your sign-in page; include return path
        const back = encodeURIComponent(`/join/${params.token}`)
        window.location.href = `/?returnTo=${back}`
        return
      }

      const { data: wid, error } = await supabase.rpc('accept_workspace_invite', {
        p_token: params.token,
      })
      if (error) { setMsg(error.message); return }

      // remember in local storage and go to dashboard
      localStorage.setItem('ws', wid as string)
      router.replace('/dashboard')
    })()
  }, [params.token, router])

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 dark:bg-slate-900">
      <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-6">
        {msg}
      </div>
    </div>
  )
}
