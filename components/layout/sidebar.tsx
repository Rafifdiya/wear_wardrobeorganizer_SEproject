'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useWear } from '@/lib/store'
import { LayoutDashboard, Shirt, Sparkles, User, BarChart2, LogOut, X } from 'lucide-react'
import { ModalType } from '@/app/(main)/layout'

const mainNav = [
  { path: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/wardrobe',  Icon: Shirt,            label: 'My Wardrobe' },
  { path: '/generator', Icon: Sparkles,         label: 'Outfit Generator' },
]

interface SidebarProps {
  onOpenModal: (modal: ModalType) => void
  activeModal: ModalType
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ onOpenModal, activeModal, isOpen, onClose }: SidebarProps) {
  const { state, logout } = useWear()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function handleLogout() {
    await logout()
    router.replace('/')
  }

  const user = state.user
  const initials = user?.name?.charAt(0).toUpperCase() ?? '?'
  const sidebarX = isMobile && !isOpen ? -240 : 0

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ x: sidebarX }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="flex flex-col z-50"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0,
          width: 240,
          background: 'var(--ink)',
          padding: '32px 0',
        }}
      >
        {/* Logo row */}
        <div style={{ padding: '0 28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: 'white' }}>
            WEAR<span style={{ color: 'var(--warm)' }}>.</span>
          </div>
          {isMobile && (
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={18} />
            </motion.button>
          )}
        </div>

        {/* Main nav */}
        <div style={{ padding: '24px 16px 8px', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,.3)' }}>
          Main
        </div>
        {mainNav.map(item => (
          <NavItem
            key={item.path}
            item={item}
            active={pathname === item.path && !activeModal}
            onClick={() => { router.push(item.path); if (isMobile) onClose() }}
          />
        ))}

        {/* You section */}
        <div style={{ padding: '24px 16px 8px', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,.3)' }}>
          You
        </div>
        <NavItem
          item={{ path: '/profile', Icon: User, label: 'Profile' }}
          active={activeModal === 'profile'}
          onClick={() => { onOpenModal('profile'); if (isMobile) onClose() }}
        />
        <NavItem
          item={{ path: '/stats', Icon: BarChart2, label: 'Style Stats' }}
          active={activeModal === 'stats'}
          onClick={() => { onOpenModal('stats'); if (isMobile) onClose() }}
        />

        {/* User card + logout at bottom */}
        <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <motion.div
            whileHover={{ background: 'rgba(255,255,255,.05)' }}
            onClick={() => { onOpenModal('profile'); if (isMobile) onClose() }}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
          >
            <div
              className="flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden font-bold text-sm"
              style={{ width: 36, height: 36, background: 'var(--warm)', color: 'white' }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</div>
              <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,.35)' }}>{user?.email ?? '—'}</div>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ background: 'rgba(255,255,255,.08)' }}
            onClick={handleLogout}
            className="flex items-center gap-2 w-full cursor-pointer rounded-xl text-sm"
            style={{
              padding: '10px 12px', marginTop: 4,
              color: 'rgba(255,255,255,.45)', background: 'transparent', border: 'none',
            }}
          >
            <LogOut size={15} />
            Log Out
          </motion.button>
        </div>
      </motion.aside>
    </>
  )
}

function NavItem({ item, active, onClick }: {
  item: { Icon: React.ElementType; label: string; path?: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      whileHover={{ background: active ? undefined : 'rgba(255,255,255,.05)' }}
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer text-sm"
      style={{
        padding: '12px 28px',
        color: active ? 'white' : 'rgba(255,255,255,.55)',
        background: active ? 'rgba(200,149,108,.15)' : 'transparent',
        borderLeft: active ? '3px solid var(--warm)' : '3px solid transparent',
        margin: '2px 0',
        transition: 'color .2s',
      }}
    >
      <item.Icon size={18} />
      {item.label}
    </motion.div>
  )
}
