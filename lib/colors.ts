export type ColorKey =
  | 'white' | 'black' | 'gray' | 'beige' | 'navy' | 'blue' | 'denim'
  | 'red' | 'pink' | 'green' | 'olive' | 'yellow' | 'orange'
  | 'purple' | 'brown' | 'multicolor'

export interface ColorMeta {
  neutral: boolean
  warm: boolean
  family: string
  hex: string
}

export const COLOR_META: Record<ColorKey, ColorMeta> = {
  white:      { neutral: true,  warm: false, family: 'white',   hex: '#F0EEE8' },
  black:      { neutral: true,  warm: false, family: 'dark',    hex: '#1A1714' },
  gray:       { neutral: true,  warm: false, family: 'gray',    hex: '#9E9E9E' },
  beige:      { neutral: true,  warm: true,  family: 'neutral', hex: '#D4C5A9' },
  navy:       { neutral: false, warm: false, family: 'blue',    hex: '#1B2A4A' },
  blue:       { neutral: false, warm: false, family: 'blue',    hex: '#4A90D9' },
  denim:      { neutral: false, warm: false, family: 'blue',    hex: '#5B7FA6' },
  red:        { neutral: false, warm: true,  family: 'red',     hex: '#C0392B' },
  pink:       { neutral: false, warm: true,  family: 'red',     hex: '#E91E8C' },
  green:      { neutral: false, warm: false, family: 'green',   hex: '#27AE60' },
  olive:      { neutral: false, warm: true,  family: 'green',   hex: '#6B7B3A' },
  yellow:     { neutral: false, warm: true,  family: 'yellow',  hex: '#F1C40F' },
  orange:     { neutral: false, warm: true,  family: 'orange',  hex: '#E67E22' },
  purple:     { neutral: false, warm: false, family: 'purple',  hex: '#9B59B6' },
  brown:      { neutral: false, warm: true,  family: 'brown',   hex: '#8B6914' },
  multicolor: { neutral: true,  warm: false, family: 'multi',   hex: '#C8956C' },
}

type CompareFn = (a: string, b: string) => number

const complement: Record<string, string> = {
  blue: 'orange', orange: 'blue',
  red: 'green', green: 'red',
  purple: 'yellow', yellow: 'purple',
}

export const COMPS: Record<string, CompareFn> = {
  harmony: (a, b) => {
    const ma = COLOR_META[a as ColorKey], mb = COLOR_META[b as ColorKey]
    if (!ma || !mb) return 5
    if (ma.neutral || mb.neutral) return 9
    if (ma.family === mb.family) return 6
    if (complement[ma.family] === mb.family) return 8
    return ma.warm === mb.warm ? 7 : 4
  },
  neutral: (a, b) => {
    const ma = COLOR_META[a as ColorKey], mb = COLOR_META[b as ColorKey]
    if (!ma || !mb) return 5
    return (ma.neutral && mb.neutral) ? 10 : (ma.neutral || mb.neutral) ? 6 : 2
  },
  monochrome: (a, b) => {
    const ma = COLOR_META[a as ColorKey], mb = COLOR_META[b as ColorKey]
    if (!ma || !mb) return 5
    return ma.family === mb.family ? 10 : (ma.neutral || mb.neutral) ? 5 : 1
  },
  contrast: (a, b) => {
    const ma = COLOR_META[a as ColorKey], mb = COLOR_META[b as ColorKey]
    if (!ma || !mb) return 5
    if ((ma.family === 'dark' || ma.family === 'white') && (mb.family === 'dark' || mb.family === 'white')) return 10
    return complement[ma.family] === mb.family ? 9 : 4
  },
  earth: (a, b) => {
    const ef = ['brown', 'green', 'orange', 'red', 'neutral']
    const ma = COLOR_META[a as ColorKey], mb = COLOR_META[b as ColorKey]
    if (!ma || !mb) return 5
    const aE = ef.includes(ma.family) || ma.neutral
    const bE = ef.includes(mb.family) || mb.neutral
    return (aE && bE) ? 9 : (aE || bE) ? 6 : 2
  },
}

export function catIcon(cat: string): string {
  const icons: Record<string, string> = {
    top: '👔', bottom: '👖', dress: '👗',
    outerwear: '🧥', footwear: '👟', accessory: '👜',
  }
  return icons[cat] ?? '👕'
}
