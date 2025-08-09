'use client'
import { useSearchParams } from 'next/navigation'
import AuthCard from './AuthCard'

export default function AuthCardClient() {
  const sp = useSearchParams()
  const returnTo = sp.get('returnTo') || '/dashboard'
  const modeParam = sp.get('mode')
  const initialMode = modeParam === 'signup' ? 'signup' : 'signin'
  const initialEmail = sp.get('email') ?? ''

  return (
    <AuthCard
      initialMode={initialMode}
      returnTo={returnTo}
      initialEmail={initialEmail}
    />
  )
}
