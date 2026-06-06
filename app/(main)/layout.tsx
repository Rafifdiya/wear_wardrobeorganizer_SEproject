'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWear } from '@/lib/store'
import { useTheme } from '@/lib/theme'
import Sidebar from '@/components/layout/sidebar'
import { ToastProvider } from '@/components/shared/toast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Menu } from 'lucide-react'
import ProfilePage from './profile/page'
import StatsPage from './stats/page'

export type ModalType = 'profile' | 'stats' | null

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { state, isReady } = useWear()
  const { loadUserTheme } = useTheme()
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (isReady && !state.user) router.replace('/')
  }, [isReady, state.user, router])

  // Restore this account's saved theme whenever the logged-in user changes
  useEffect(() => {
    if (state.user?.id) loadUserTheme(String(state.user.id))
  }, [state.user?.id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setActiveModal(null); setSidebarOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = (activeModal || sidebarOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [activeModal, sidebarOpen])

  if (!isReady || !state.user) return null

  const modalTitle = activeModal === 'profile' ? 'Profile & Settings' : 'Style Stats'

  return (
    <ToastProvider>
      <div className="flex wear-app-shell">
        <Sidebar
          onOpenModal={setActiveModal}
          activeModal={activeModal}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="wear-main-wrapper" style={{ flex: 1, minWidth: 0 }}>
          {/* Mobile top bar */}
          <div className="wear-mobile-header">
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 4 }}
            >
              <Menu size={22} />
            </button>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'white' }}>
              WEAR<span style={{ color: 'var(--warm)' }}>.</span>
            </div>
            <div style={{ width: 30 }} />
          </div>

          <main className="wear-main-content">
            {children}
          </main>
        </div>
      </div>

      {/* Modal system for profile & stats */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveModal(null)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
              }}
            />
            <div style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(92vw, 1080px)',
              maxHeight: '90vh',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="hide-scrollbar wear-modal-inner"
              style={{
                  overflowY: 'auto',
                  maxHeight: '90vh',
                  background: 'var(--cream)',
                  borderRadius: 28,
                  padding: '40px 44px 44px',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
                }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>
                    {modalTitle}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveModal(null)}
                    style={{
                      background: 'var(--ink)', border: 'none', borderRadius: '50%',
                      width: 36, height: 36, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <X size={16} color="white" />
                  </motion.button>
                </div>

                {activeModal === 'profile' && <ProfilePage />}
                {activeModal === 'stats' && <StatsPage />}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ToastProvider>
  )
}
