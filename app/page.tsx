'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWear } from '@/lib/store'
import AuthCard from '@/components/auth/auth-card'

export default function AuthPage() {
  const { state, isReady } = useWear()
  const router = useRouter()

  useEffect(() => {
    if (isReady && state.user) {
      router.replace('/dashboard')
    }
  }, [isReady, state.user, router])

  if (!isReady) return null

  if (state.user) return null

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--ink)' }}
    >
      {/* Ambient glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,149,108,.15) 0%, transparent 70%)',
          top: -100, right: -100,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,149,108,.10) 0%, transparent 70%)',
          bottom: -80, left: -80,
        }}
      />
      <AuthCard />
    </div>
  )
}
