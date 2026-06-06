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
}

const ThemeContext = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColor] = useState<ColorTheme>('light')
  const [fontTheme, setFont] = useState<FontTheme>('classic')

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

  return (
    <ThemeContext.Provider value={{ colorTheme, fontTheme, setColorTheme: setColor, setFontTheme: setFont }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
