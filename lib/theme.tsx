'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ColorTheme = 'light' | 'dark'
export type FontTheme = 'classic' | 'modern' | 'serif' | 'minimal'

export const FONT_THEME_OPTIONS: { value: FontTheme; label: string; desc: string }[] = [
  { value: 'classic', label: 'Classic', desc: 'Playfair Display + DM Sans' },
  { value: 'modern', label: 'Modern', desc: 'Plus Jakarta Sans' },
  { value: 'serif', label: 'Serif', desc: 'Cormorant Garamond + DM Sans' },
  { value: 'minimal', label: 'Minimal', desc: 'Space Grotesk' },
]

interface ThemeCtx {
  colorTheme: ColorTheme
  fontTheme: FontTheme
  setColorTheme: (t: ColorTheme) => void
  setFontTheme: (f: FontTheme) => void
  resetTheme: () => void
  loadUserTheme: (userId: string) => void
}

const ThemeContext = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColor] = useState<ColorTheme>('light')
  const [fontTheme, setFont] = useState<FontTheme>('classic')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Apply active theme from localStorage on first load (matches FOUC script)
  useEffect(() => {
    const c = localStorage.getItem('wear-color') as ColorTheme | null
    const f = localStorage.getItem('wear-font') as FontTheme | null
    if (c) setColor(c)
    if (f) setFont(f)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme)
    localStorage.setItem('wear-color', colorTheme)
  }, [colorTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontTheme)
    localStorage.setItem('wear-font', fontTheme)
  }, [fontTheme])

  // Wraps setColor so changes are also saved under the user's own key
  function setColorTheme(t: ColorTheme) {
    setColor(t)
    if (currentUserId) localStorage.setItem(`wear-color-${currentUserId}`, t)
  }

  function setFontTheme(f: FontTheme) {
    setFont(f)
    if (currentUserId) localStorage.setItem(`wear-font-${currentUserId}`, f)
  }

  // Called after login — restores that user's saved theme
  function loadUserTheme(userId: string) {
    setCurrentUserId(userId)
    const c = localStorage.getItem(`wear-color-${userId}`) as ColorTheme | null
    const f = localStorage.getItem(`wear-font-${userId}`) as FontTheme | null
    setColor(c ?? 'light')
    setFont(f ?? 'classic')
  }

  // Called on logout — resets to light without deleting the per-user saved keys
  function resetTheme() {
    setCurrentUserId(null)
    localStorage.removeItem('wear-color')
    localStorage.removeItem('wear-font')
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-font')
    setColor('light')
    setFont('classic')
  }

  return (
    <ThemeContext.Provider value={{ colorTheme, fontTheme, setColorTheme, setFontTheme, resetTheme, loadUserTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
