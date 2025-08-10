'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

type Props = {
  initialMode?: 'signin' | 'signup'
  returnTo?: string
  initialEmail?: string
}

function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as Record<string, unknown>).message
    if (typeof m === 'string') return m
  }
  try {
    return JSON.stringify(err)
  } catch {
    return 'Something went wrong'
  }
}

export default function AuthCard({
  initialMode = 'signin',
  returnTo = '/dashboard',
  initialEmail = '',
}: Props) {
  const router = useRouter()

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState(initialEmail)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  // keep state in sync if props change (e.g. Suspense resolves later)
  useEffect(() => setEmail(initialEmail), [initialEmail])
  useEffect(() => setMode(initialMode), [initialMode])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace(returnTo)
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo:
              typeof window !== 'undefined' ? `${location.origin}/dashboard` : undefined,
          },
        })
        if (error) throw error
        if (data.session) router.replace(returnTo)
        else alert('Check your email to confirm your account.')
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="w-full max-w-md rounded-2xl border bg-white/90 backdrop-blur p-5 shadow-lg
                    dark:bg-slate-900/90 dark:border-slate-700"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </div>
        <div className="ml-auto text-sm">
          <button
            type="button"
            className="underline underline-offset-4 text-slate-600 dark:text-slate-300"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === 'signup' && (
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-300">Name</label>
            <input
              className="input mt-1 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
        )}
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-300">Email</label>
          <input
            className="input mt-1 w-full"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-300">Password</label>
          <div className="relative">
            <input
              className="input mt-1 w-full pr-10"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              onClick={() => setShowPwd((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-slate-500 dark:text-slate-400"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing…
            </>
          ) : mode === 'signin' ? (
            'Sign in'
          ) : (
            'Sign up'
          )}
        </button>
      </form>

      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </div>
  )
}
