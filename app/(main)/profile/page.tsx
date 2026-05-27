'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, LogOut, Save, X, Eye, EyeOff } from 'lucide-react'
import { useWear } from '@/lib/store'
import { useToast } from '@/components/shared/toast'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { state, updateUser, uploadAvatar, logout } = useWear()
  const { showToast } = useToast()
  const router = useRouter()
  const avatarRef = useRef<HTMLInputElement>(null)

  const user = state.user!
  const nameParts = user.name.split(' ')

  const [firstName, setFirstName] = useState(nameParts[0] ?? '')
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') ?? '')
  const [email, setEmail] = useState(user.email)
  const [username, setUsername] = useState(user.username)
  const [bio, setBio] = useState(user.bio)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  async function handleSaveProfile() {
    if (!firstName.trim()) { showToast('First name required.', 'error'); return }
    try {
      await updateUser({ firstName: firstName.trim(), lastName: lastName.trim(), email, username, bio })
      showToast('Profile updated!')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to update profile.', 'error')
    }
  }

  function handleCancelProfile() {
    const parts = user.name.split(' ')
    setFirstName(parts[0] ?? '')
    setLastName(parts.slice(1).join(' ') ?? '')
    setEmail(user.email)
    setUsername(user.username)
    setBio(user.bio)
  }

  async function handleChangePassword() {
    if (!currentPw) { showToast('Enter your current password.', 'error'); return }
    if (!newPw) { showToast('Enter a new password.', 'error'); return }
    if (newPw.length < 5) { showToast('New password must be at least 5 characters.', 'error'); return }
    if (newPw !== confirmPw) { showToast('Passwords do not match.', 'error'); return }
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed.', 'error'); return }
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      showToast('Password updated!')
    } catch {
      showToast('Failed to update password.', 'error')
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    try {
      await uploadAvatar(f)
      showToast('Photo updated!')
    } catch {
      showToast('Failed to upload photo.', 'error')
    }
  }

  async function handleLogout() {
    await logout()
    router.replace('/')
  }

  const initials = user.name.charAt(0).toUpperCase()

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-9">
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>Profile & Settings</h1>
        <p style={{ color: 'var(--wear-muted)', fontSize: 14, marginTop: 6 }}>Manage your info and preferences.</p>
      </div>

      <div className="grid gap-7" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start' }}>
        {/* Profile card */}
        <div className="rounded-3xl p-8 border text-center" style={{ background: 'white', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-bold text-4xl text-white cursor-pointer"
              style={{ background: 'var(--warm)' }}
              onClick={() => avatarRef.current?.click()}>
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <button onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 flex items-center justify-center rounded-full cursor-pointer"
              style={{ width: 28, height: 28, background: 'var(--ink)', border: '2px solid white' }}>
              <Camera size={14} color="white" />
            </button>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700 }}>{user.name}</div>
          <div style={{ color: 'var(--wear-muted)', fontSize: 13, marginTop: 4 }}>{user.username || '@user'}</div>

          {/* Stats */}
          <div className="flex justify-center gap-6 my-5 py-4 border-t border-b" style={{ borderColor: 'var(--wear-border)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>{state.clothes.length}</div>
              <div style={{ fontSize: 11, color: 'var(--wear-muted)' }}>Pieces</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>{state.outfits.length}</div>
              <div style={{ fontSize: 11, color: 'var(--wear-muted)' }}>Outfits</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>{state.generatedCount}</div>
              <div style={{ fontSize: 11, color: 'var(--wear-muted)' }}>Generated</div>
            </div>
          </div>

          {/* Mode badges */}
          <div className="flex justify-center gap-2 flex-wrap mt-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--ai-light)', color: 'var(--ai)' }}>
              {state.aiCount} AI
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--offline-light)', color: 'var(--offline)' }}>
              {state.offlineCount} Offline
            </span>
          </div>
        </div>

        {/* Settings card */}
        <div className="rounded-3xl border overflow-hidden" style={{ background: 'white', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
          {/* Personal info */}
          <div className="p-7 border-b" style={{ borderColor: 'var(--wear-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Personal Information</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="First Name"><input value={firstName} onChange={e => setFirstName(e.target.value)} style={iStyle} /></Field>
              <Field label="Last Name"><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="optional" style={iStyle} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={iStyle} /></Field>
              <Field label="Username"><input value={username} readOnly style={{ ...iStyle, background: 'var(--cream)', color: 'var(--wear-muted)', cursor: 'not-allowed' }} /></Field>
            </div>
            <Field label="Bio">
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                style={{ ...iStyle, resize: 'vertical', minHeight: 60 }} />
            </Field>
            <div className="flex justify-end gap-3 mt-5">
              <motion.button whileHover={{ borderColor: 'var(--ink)' }} onClick={handleCancelProfile}
                className="flex items-center gap-1.5 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1.5px solid var(--wear-border)', background: 'transparent', color: 'var(--ink)' }}>
                <X size={14} /> Cancel
              </motion.button>
              <motion.button whileHover={{ y: -1 }} onClick={handleSaveProfile}
                className="flex items-center gap-1.5 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--warm)', border: 'none' }}>
                <Save size={14} /> Save Changes
              </motion.button>
            </div>
          </div>

          {/* Account / password */}
          <div className="p-7">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Account</h2>
            <div className="mb-4">
              <Field label="Current Password">
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter your current password" style={iStyle} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="New Password">
                <div className="relative">
                  <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                    placeholder="Min. 5 characters" style={{ ...iStyle, paddingRight: 52 }} />
                  <button type="button" onClick={() => setShowNewPw(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wear-muted)', display: 'flex' }}>
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm New Password">
                <div className="relative">
                  <input type={showConfirmPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password" style={{ ...iStyle, paddingRight: 52 }} />
                  <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wear-muted)', display: 'flex' }}>
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>
            {newPw && confirmPw && newPw !== confirmPw && (
              <p style={{ fontSize: 12, color: 'var(--error)', marginBottom: 8 }}>Passwords do not match.</p>
            )}
            <div className="flex justify-between items-center mt-5">
              <motion.button whileHover={{ opacity: 0.8 }} onClick={handleLogout}
                className="flex items-center gap-1.5 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1.5px solid var(--error)', background: 'transparent', color: 'var(--error)' }}>
                <LogOut size={14} /> Log Out
              </motion.button>
              <motion.button whileHover={{ y: -1 }} onClick={handleChangePassword}
                className="flex items-center gap-1.5 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--warm)', border: 'none' }}>
                <Save size={14} /> Update Password
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const iStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1.5px solid var(--wear-border)', borderRadius: 12,
  fontFamily: 'var(--font-sans)', fontSize: 14, background: 'white', color: 'var(--ink)', outline: 'none',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--wear-muted)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
