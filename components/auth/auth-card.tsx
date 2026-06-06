'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useWear } from '@/lib/store'

const PW_MIN = 5, PW_MAX = 30

function pwStrength(pw: string) {
  let score = 0
  if (pw.length >= PW_MIN) score++
  if (/[a-zA-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (pw.length >= 10) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  const levels = [
    { pct: 20, color: '#B5584A', text: 'Too weak' },
    { pct: 40, color: '#E07B39', text: 'Weak' },
    { pct: 60, color: '#F0B429', text: 'Fair' },
    { pct: 80, color: '#6B8F71', text: 'Strong' },
    { pct: 100, color: '#4A8F6F', text: 'Very strong' },
  ]
  return levels[Math.min(score, levels.length - 1)]
}

function validatePassword(pw: string): string | null {
  if (pw.length < PW_MIN) return `Min ${PW_MIN} characters.`
  if (pw.length > PW_MAX) return `Max ${PW_MAX} characters.`
  if (!/[a-zA-Z]/.test(pw)) return 'Must include a letter.'
  if (!/[0-9]/.test(pw)) return 'Must include a number.'
  return null
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

const formAnim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: 'easeIn' as const } },
}

export default function AuthCard() {
  const { login, register } = useWear()
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [showForgot, setShowForgot] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [rememberDays, setRememberDays] = useState(7)

  // Signup
  const [signName, setSignName] = useState('')
  const [signEmail, setSignEmail] = useState('')
  const [signPw, setSignPw] = useState('')
  const [signConfirm, setSignConfirm] = useState('')
  const [showSignPw, setShowSignPw] = useState(false)
  const [showSignConfirm, setShowSignConfirm] = useState(false)

  // Forgot
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  function showMsg(msg: string, type: 'success' | 'error' = 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleLogin() {
    if (!loginEmail || !loginPw) { showMsg('Please fill in all fields.'); return }
    if (!isValidEmail(loginEmail)) { showMsg('Enter a valid email address.'); return }
    setLoading(true)
    try {
      await login(loginEmail.trim().toLowerCase(), loginPw, rememberMe ? rememberDays : undefined)
      router.replace('/dashboard')
    } catch (e: unknown) {
      showMsg(e instanceof Error ? e.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup() {
    if (!signName || !signEmail || !signPw || !signConfirm) { showMsg('Please fill in all fields.'); return }
    if (signName.trim().length < 2) { showMsg('Name must be at least 2 characters.'); return }
    if (!isValidEmail(signEmail)) { showMsg('Enter a valid email address.'); return }
    const pwErr = validatePassword(signPw)
    if (pwErr) { showMsg(pwErr); return }
    if (signPw !== signConfirm) { showMsg('Passwords do not match.'); return }
    setLoading(true)
    try {
      await register(signName.trim(), signEmail.trim().toLowerCase(), signPw)
      router.replace('/dashboard')
    } catch (e: unknown) {
      showMsg(e instanceof Error ? e.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  function handleForgot() {
    if (!forgotEmail || !isValidEmail(forgotEmail)) {
      showMsg('Enter a valid email address.')
      return
    }
    setForgotSent(true)
  }

  const strength = signPw ? pwStrength(signPw) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
        layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      }}
      className="relative z-10"
      style={{
        background: 'var(--surface)',
        borderRadius: 24,
        padding: '44px 40px',
        width: 460,
        maxWidth: '92vw',
        boxShadow: '0 40px 80px rgba(0,0,0,.4)',
      }}
    >
      {/* Logo */}
      <div className="wear-auth-logo" style={{ fontFamily: 'var(--font-heading)', fontSize: 42, fontWeight: 700, color: 'var(--fg)' }}>
        WEAR<span style={{ color: 'var(--warm)' }}>.</span>
      </div>
      <div style={{ color: 'var(--wear-muted)', fontSize: 13, marginBottom: 8, marginTop: 4 }}>
        Your smart wardrobe organizer
      </div>

      {/* Mode badges */}
      <div className="flex gap-2 flex-wrap mb-6">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'var(--ai-light)', color: 'var(--ai)' }}>Online Mode</span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'var(--offline-light)', color: 'var(--offline)' }}>Offline Mode</span>
      </div>

      {/* Tabs — stable outside AnimatePresence to prevent layout jump */}
      <AnimatePresence>
        {!showForgot && (
          <motion.div
            key="tabs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-1 p-1 mb-6 w-fit border"
            style={{ background: 'var(--cream)', borderRadius: 12, borderColor: 'var(--wear-border)' }}
          >
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="cursor-pointer px-5 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  border: 'none',
                  background: tab === t ? 'var(--card-bg)' : 'transparent',
                  color: tab === t ? 'var(--fg)' : 'var(--wear-muted)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form content */}
      <AnimatePresence mode="wait">
        {showForgot ? (
          <motion.div key="forgot" {...formAnim}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, marginBottom: 20, color: 'var(--fg)' }}>
              Forgot Password
            </h2>
            {!forgotSent ? (
              <>
                <p style={{ fontSize: 14, color: 'var(--wear-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                  Enter your email and contact your admin to reset your password.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="Email address"
                  style={{ ...inputStyle, marginBottom: 12 }}
                />
                <motion.button
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                  onClick={handleForgot}
                  style={{ width: '100%', padding: '14px', background: 'var(--warm)', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 15, cursor: 'pointer', marginBottom: 12 }}
                >
                  Submit
                </motion.button>
              </>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--wear-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                ✓ Request received for <strong>{forgotEmail}</strong>. Contact your admin to reset your password.
              </p>
            )}
            <button
              onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail('') }}
              style={{ background: 'none', border: 'none', color: 'var(--warm)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14 }}
            >
              ← Back to login
            </button>
          </motion.div>

        ) : tab === 'login' ? (
          <motion.div key="login" {...formAnim}>
            <Field label="Email">
              <input
                type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                placeholder="your@email.com" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={inputStyle}
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showLoginPw ? 'text' : 'password'} value={loginPw} onChange={e => setLoginPw(e.target.value)}
                  placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowLoginPw(p => !p)} style={eyeBtn}>
                  {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {/* Remember Me */}
            <div className="flex items-center gap-3 mb-5">
              <input type="checkbox" id="remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="remember" style={{ fontSize: 14, color: 'var(--wear-muted)', cursor: 'pointer' }}>Remember me</label>
              {rememberMe && (
                <select
                  value={rememberDays} onChange={e => setRememberDays(Number(e.target.value))}
                  style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 8, border: '1.5px solid var(--wear-border)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--input-bg)', color: 'var(--fg)' }}
                >
                  <option value={1}>1 day</option>
                  <option value={7}>1 week</option>
                  <option value={30}>1 month</option>
                </select>
              )}
            </div>

            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={handleLogin} disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? 'var(--wear-muted)' : 'var(--warm)', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </motion.button>
            <button onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--warm)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
              Forgot password?
            </button>
          </motion.div>

        ) : (
          <motion.div key="signup" {...formAnim}>
            <Field label="Full Name">
              <input type="text" value={signName} onChange={e => setSignName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </Field>
            <Field label="Email">
              <input type="email" value={signEmail} onChange={e => setSignEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showSignPw ? 'text' : 'password'} value={signPw} onChange={e => setSignPw(e.target.value)}
                  placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowSignPw(p => !p)} style={eyeBtn}>
                  {showSignPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && signPw && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--wear-border)', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${strength.pct}%` }} style={{ height: '100%', background: strength.color, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: strength.color, marginTop: 4, fontWeight: 500 }}>{strength.text}</div>
                </div>
              )}
            </Field>
            <Field label="Confirm Password">
              <div className="relative">
                <input
                  type={showSignConfirm ? 'text' : 'password'} value={signConfirm} onChange={e => setSignConfirm(e.target.value)}
                  placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowSignConfirm(p => !p)} style={eyeBtn}>
                  {showSignConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {signConfirm && signPw !== signConfirm && (
                <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>Passwords do not match.</div>
              )}
            </Field>

            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={handleSignup} disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? 'var(--wear-muted)' : 'var(--warm)', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: 'absolute', bottom: 20, left: 20, right: 20, padding: '12px 16px', borderRadius: 12, background: toast.type === 'success' ? '#4A8F6F' : '#B5584A', color: 'white', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1.5px solid var(--wear-border)',
  borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 14,
  background: 'var(--input-bg)', color: 'var(--fg)', outline: 'none',
}

const eyeBtn: React.CSSProperties = {
  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wear-muted)', display: 'flex',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--wear-muted)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
