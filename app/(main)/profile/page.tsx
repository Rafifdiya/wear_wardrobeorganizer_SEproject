'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, LogOut, Save, X, Eye, EyeOff, Trash2, Sun, Moon } from 'lucide-react'
import { useWear } from '@/lib/store'
import { useToast } from '@/components/shared/toast'
import { useRouter } from 'next/navigation'
import { Occasion, Season, StyleMood } from '@/lib/types'
import { useTheme, FONT_THEME_OPTIONS } from '@/lib/theme'

const PREF_OCCASIONS: { value: Occasion; label: string }[] = [
  { value: 'casual', label: 'Casual' }, { value: 'work', label: 'Work' },
  { value: 'date', label: 'Date Night' }, { value: 'formal', label: 'Formal' },
  { value: 'gym', label: 'Gym' }, { value: 'travel', label: 'Travel' },
]
const PREF_SEASONS: { value: Season; label: string }[] = [
  { value: 'all', label: 'All Year' }, { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' }, { value: 'fall', label: 'Fall' }, { value: 'winter', label: 'Winter' },
]
const PREF_MOODS: { value: StyleMood; label: string }[] = [
  { value: 'balanced', label: 'Balanced' }, { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' }, { value: 'classic', label: 'Classic' },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function ProfilePage() {
  const { state, updateUser, deleteAccount, uploadAvatar, logout } = useWear()
  const { showToast } = useToast()
  const { colorTheme, setColorTheme, fontTheme, setFontTheme } = useTheme()
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
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const [prefOccasion, setPrefOccasion] = useState<Occasion>((user.prefOccasion as Occasion) ?? 'casual')
  const [prefSeason, setPrefSeason] = useState<Season>((user.prefSeason as Season) ?? 'all')
  const [prefMood, setPrefMood] = useState<StyleMood>((user.prefMood as StyleMood) ?? 'balanced')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

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

  async function handleSavePrefs() {
    try {
      await updateUser({ prefOccasion, prefSeason, prefMood })
      showToast('Style preferences saved!')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save preferences.', 'error')
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    try {
      await deleteAccount()
      router.replace('/')
    } catch {
      showToast('Failed to delete account.', 'error')
      setDeletingAccount(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.replace('/')
  }

  const initials = user.name.charAt(0).toUpperCase()

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-9">
        <p style={{ color: 'var(--wear-muted)', fontSize: 14 }}>Manage your info and preferences.</p>
      </motion.div>

      {/* Responsive layout: sidebar card left, settings right */}
      <div className="wear-profile-layout">
        {/* Profile card */}
        <motion.div variants={fadeUp} className="rounded-3xl p-8 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-bold text-4xl text-white cursor-pointer"
              style={{ background: 'var(--warm)' }}
              onClick={() => avatarRef.current?.click()}>
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <button onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 flex items-center justify-center rounded-full cursor-pointer"
              style={{ width: 28, height: 28, background: 'var(--ink)', border: '2px solid var(--card-bg)' }}>
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
        </motion.div>

        {/* Settings panel */}
        <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
          {/* Personal info */}
          <motion.div variants={fadeUp} className="p-7 border-b" style={{ borderColor: 'var(--wear-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="First Name"><input value={firstName} onChange={e => setFirstName(e.target.value)} style={iStyle} /></Field>
              <Field label="Last Name"><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="optional" style={iStyle} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={iStyle} /></Field>
              <Field label="Username"><input value={username} readOnly style={{ ...iStyle, background: 'var(--cream)', color: 'var(--wear-muted)', cursor: 'not-allowed' }} /></Field>
            </div>
            <Field label="Bio">
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                style={{ ...iStyle, resize: 'vertical', minHeight: 60 }} />
            </Field>
            <div className="flex justify-end gap-3 mt-5 flex-wrap">
              <motion.button whileHover={{ borderColor: 'var(--fg)' }} onClick={handleCancelProfile}
                className="flex items-center gap-1.5 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1.5px solid var(--wear-border)', background: 'transparent', color: 'var(--fg)' }}>
                <X size={14} /> Cancel
              </motion.button>
              <motion.button whileHover={{ y: -1 }} onClick={handleSaveProfile}
                className="flex items-center gap-1.5 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--warm)', border: 'none' }}>
                <Save size={14} /> Save Changes
              </motion.button>
            </div>
          </motion.div>

          {/* Style Preferences */}
          <motion.div variants={fadeUp} className="p-7 border-b" style={{ borderColor: 'var(--wear-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Style Preferences</h2>
            <p style={{ color: 'var(--wear-muted)', fontSize: 13, marginBottom: 20 }}>Used as defaults when generating outfits.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Default Occasion">
                <select value={prefOccasion} onChange={e => setPrefOccasion(e.target.value as Occasion)} style={iStyle}>
                  {PREF_OCCASIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Default Season">
                <select value={prefSeason} onChange={e => setPrefSeason(e.target.value as Season)} style={iStyle}>
                  {PREF_SEASONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Default Mood">
                <select value={prefMood} onChange={e => setPrefMood(e.target.value as StyleMood)} style={iStyle}>
                  {PREF_MOODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex justify-end">
              <motion.button whileHover={{ y: -1 }} onClick={handleSavePrefs}
                className="flex items-center gap-1.5 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--warm)', border: 'none' }}>
                <Save size={14} /> Save Preferences
              </motion.button>
            </div>
          </motion.div>

          {/* Appearance */}
          <motion.div variants={fadeUp} className="p-7 border-b" style={{ borderColor: 'var(--wear-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Appearance</h2>
            <p style={{ color: 'var(--wear-muted)', fontSize: 13, marginBottom: 20 }}>Choose a color mode and font style for the app.</p>

            {/* Color mode toggle */}
            <div className="mb-6">
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--wear-muted)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 10 }}>Color Mode</div>
              <div className="flex gap-3">
                {([
                  { v: 'light' as const, label: 'Light', Icon: Sun },
                  { v: 'dark' as const, label: 'Dark', Icon: Moon },
                ]).map(({ v, label, Icon }) => (
                  <motion.button key={v} whileTap={{ scale: 0.97 }}
                    onClick={() => setColorTheme(v)}
                    className="flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium"
                    style={{
                      border: `1.5px solid ${colorTheme === v ? 'var(--ink)' : 'var(--wear-border)'}`,
                      background: colorTheme === v ? 'var(--ink)' : 'transparent',
                      color: colorTheme === v ? 'white' : 'var(--fg)',
                    }}>
                    <Icon size={15} /> {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Font theme grid */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--wear-muted)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 10 }}>Font Style</div>
              <div className="grid grid-cols-2 gap-3">
                {FONT_THEME_OPTIONS.map(opt => (
                  <motion.button key={opt.value} whileTap={{ scale: 0.97 }}
                    onClick={() => setFontTheme(opt.value)}
                    className="text-left cursor-pointer px-4 py-3 rounded-xl"
                    style={{
                      border: `1.5px solid ${fontTheme === opt.value ? 'var(--warm)' : 'var(--wear-border)'}`,
                      background: fontTheme === opt.value ? 'rgba(200,149,108,.08)' : 'transparent',
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: fontTheme === opt.value ? 'var(--warm)' : 'var(--fg)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--wear-muted)', marginTop: 2 }}>{opt.desc}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Account / password */}
          <motion.div variants={fadeUp} className="p-7">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Account</h2>
            <div className="mb-4">
              <Field label="Current Password">
                <div className="relative">
                  <input type={showCurrentPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                    placeholder="Enter your current password" style={{ ...iStyle, paddingRight: 52 }} />
                  <button type="button" onClick={() => setShowCurrentPw(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wear-muted)', display: 'flex' }}>
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
            <div className="flex justify-between items-center mt-5 flex-wrap gap-3">
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

            {/* Delete Account */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--wear-border)' }}>
              {!showDeleteConfirm ? (
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Delete Account</div>
                    <div style={{ fontSize: 12, color: 'var(--wear-muted)', marginTop: 2 }}>Permanently delete your account and all data. This cannot be undone.</div>
                  </div>
                  <motion.button whileHover={{ opacity: 0.8 }} onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 cursor-pointer px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ border: '1.5px solid var(--error)', background: 'transparent', color: 'var(--error)' }}>
                    <Trash2 size={14} /> Delete Account
                  </motion.button>
                </div>
              ) : (
                <div className="rounded-2xl p-5" style={{ background: 'rgba(220,38,38,.08)', border: '1.5px solid var(--error)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--error)', marginBottom: 6 }}>⚠ Are you sure?</div>
                  <p style={{ fontSize: 13, color: 'var(--fg)', marginBottom: 16 }}>
                    This will permanently delete your account, all clothing items, outfits, and uploaded photos. This action <strong>cannot be undone</strong>.
                  </p>
                  <div className="flex gap-3 justify-end flex-wrap">
                    <motion.button whileHover={{ opacity: 0.8 }} onClick={() => setShowDeleteConfirm(false)}
                      className="cursor-pointer px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ border: '1.5px solid var(--wear-border)', background: 'transparent', color: 'var(--fg)' }}>
                      Cancel
                    </motion.button>
                    <motion.button whileHover={{ opacity: 0.8 }} onClick={handleDeleteAccount} disabled={deletingAccount}
                      className="flex items-center gap-1.5 cursor-pointer px-4 py-2 rounded-xl text-sm font-medium text-white"
                      style={{ background: 'var(--error)', border: 'none', opacity: deletingAccount ? 0.6 : 1 }}>
                      <Trash2 size={14} /> {deletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

const iStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1.5px solid var(--wear-border)', borderRadius: 12,
  fontFamily: 'var(--font-sans)', fontSize: 14, background: 'var(--input-bg)', color: 'var(--fg)', outline: 'none',
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
