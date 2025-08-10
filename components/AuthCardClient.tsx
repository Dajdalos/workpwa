'use client'
import { useSearchParams } from 'next/navigation'
import AuthCard from './AuthCard'

// null-safe helpers for Next 15
const getParam = (sp: ReturnType<typeof useSearchParams> | null, key: string) =>
  sp?.get(key) ?? null

export default function AuthCardClient() {
  const sp = useSearchParams()

  // Safely read params (sp can be null in types)
  const returnToParam = getParam(sp, 'returnTo')
  const returnTo =
    returnToParam && returnToParam.startsWith('/') ? returnToParam : '/dashboard'

  const modeParam = getParam(sp, 'mode')
  const initialMode: 'signup' | 'signin' = modeParam === 'signup' ? 'signup' : 'signin'

  const initialEmail = getParam(sp, 'email') ?? ''
  
  return (
    <AuthCard
      initialMode={initialMode}
      returnTo={returnTo}
      initialEmail={initialEmail}
    />
  )
}
