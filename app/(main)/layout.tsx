'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWear } from '@/lib/store'
import Sidebar from '@/components/layout/sidebar'
import { ToastProvider } from '@/components/shared/toast'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { state, isReady } = useWear()
  const router = useRouter()

  useEffect(() => {
    if (isReady && !state.user) {
      router.replace('/')
    }
  }, [isReady, state.user, router])

  if (!isReady || !state.user) return null

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main style={{ marginLeft: 240, padding: '40px 48px', flex: 1, minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
