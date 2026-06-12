import { ClothingItem, GenOptions } from './types'
import { COLOR_META, COMPS } from './colors'

const OCC_FORMAL: Record<string, number> = {
  gym: 0, casual: 2, travel: 2, date: 4, work: 6, formal: 9,
}
const ITEM_FORMAL: Record<string, number> = {
  casual: 2, any: 4, work: 6, formal: 8,
}
const STYLE_FORMAL: Record<string, number> = {
  sporty: 1, casual: 2, bohemian: 3, streetwear: 3,
  minimalist: 5, classic: 7, formal: 9,
}

function scoredPick(
  candidates: ClothingItem[],
  picked: ClothingItem[],
  opts: GenOptions
): ClothingItem | null {
  if (!candidates.length) return null
  const fn = COMPS[opts.palette] ?? COMPS.harmony
  const scored = candidates.map(item => {
    let score = 0
    picked.forEach(p => { score += fn(item.color, p.color) })
    const tf = OCC_FORMAL[opts.occ] ?? 3
    score -= Math.abs(tf - (ITEM_FORMAL[item.occasion] ?? 4)) * 0.5
    score -= Math.abs(tf - (STYLE_FORMAL[item.styleTag] ?? 4)) * 0.3
    if (opts.mood === 'minimal' && COLOR_META[item.color as keyof typeof COLOR_META]?.neutral) score += 3
    if (opts.mood === 'bold' && !COLOR_META[item.color as keyof typeof COLOR_META]?.neutral) score += 3
    if (opts.mood === 'classic' && ['classic', 'formal'].includes(item.styleTag)) score += 3
    score += (Math.random() - 0.5) * 2
    return { item, score }
  })
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, Math.min(3, scored.length))
  const weights = top.map((_, i) => Math.max(3 - i, 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < top.length; i++) {
    r -= weights[i]
    if (r <= 0) return top[i].item
  }
  return top[0].item
}

export function generateOfflineOutfit(
  clothes: ClothingItem[],
  opts: GenOptions
): ClothingItem[] | null {
  if (clothes.length < 2) return null

  let pool = clothes.filter(c =>
    opts.season === 'all' || c.season === 'all' || c.season === opts.season
  )
  if (pool.length < 2) pool = clothes

  // Per-category: prefer occasion-matching items, fall back to full pool if category empty
  const oMatched = pool.filter(c =>
    c.occasion === 'any' || c.occasion === opts.occ || opts.occ === 'casual'
  )
  const bycat: Record<string, ClothingItem[]> = {}
  ;(['top','bottom','dress','outerwear','footwear','accessory'] as const).forEach(cat => {
    const matched = oMatched.filter(i => i.category === cat)
    bycat[cat] = matched.length > 0 ? matched : pool.filter(i => i.category === cat)
  })

  // Coverage guarantee — if still missing top/bottom/dress, pull from full wardrobe
  if (bycat.dress.length === 0) {
    if (bycat.top.length === 0) bycat.top = clothes.filter(i => i.category === 'top')
    if (bycat.bottom.length === 0) bycat.bottom = clothes.filter(i => i.category === 'bottom')
  }
  if (bycat.dress.length === 0 && bycat.top.length === 0)
    bycat.dress = clothes.filter(i => i.category === 'dress')

  const useDress = bycat.dress.length > 0 && (bycat.top.length === 0 || Math.random() > 0.5)
  const sel: ClothingItem[] = []

  if (useDress) {
    const d = scoredPick(bycat.dress, [], opts)
    if (d) sel.push(d)
  } else {
    const t = scoredPick(bycat.top, [], opts)
    if (t) sel.push(t)
    const b = scoredPick(bycat.bottom.filter(i => i !== sel[0]), sel, opts)
    if (b) sel.push(b)
  }

  if (opts.occ !== 'gym' && bycat.outerwear.length && Math.random() > 0.5) {
    const ow = scoredPick(bycat.outerwear, sel, opts)
    if (ow) sel.push(ow)
  }
  if (bycat.footwear.length) {
    const s = scoredPick(bycat.footwear, sel, opts)
    if (s) sel.push(s)
  }
  if (bycat.accessory.length && Math.random() > 0.6) {
    const a = scoredPick(bycat.accessory, sel, opts)
    if (a) sel.push(a)
  }

  return sel.length ? sel : null
}

const OCC_LABELS: Record<string, string> = {
  casual: 'casual everyday wear', work: 'a professional setting',
  date: 'a date night', formal: 'a formal event',
  gym: 'a gym session', travel: 'travel',
}
const SEASON_LABELS: Record<string, string> = {
  all: 'any season', spring: 'spring', summer: 'summer', fall: 'fall', winter: 'winter',
}

export function buildName(occ: string): string {
  const n: Record<string, string[]> = {
    casual: ['Weekend Edit', 'Easy Sunday', 'Laid-Back Look'],
    work: ['Power Move', 'Office Ready', 'The 9-to-5'],
    date: ['Date Night Glow', 'Golden Hour Look', 'Evening Charm'],
    formal: ['Black Tie Mood', 'Gala Ready', 'Elevated Elegance'],
    gym: ['Sweat Session', 'Active Mode', 'Gym Glow'],
    travel: ['Jet-Set Ready', 'The Commuter', 'Explorer Edit'],
  }
  const l = n[occ] ?? n.casual
  return l[Math.floor(Math.random() * l.length)]
}

export function buildColorExplain(sel: ClothingItem[]): string {
  const colors = sel.map(p => p.color).filter(Boolean)
  const neutrals = colors.filter(c => COLOR_META[c as keyof typeof COLOR_META]?.neutral)
  const accents = colors.filter(c => !COLOR_META[c as keyof typeof COLOR_META]?.neutral)
  if (!colors.length) return 'Items matched using category harmony.'
  if (!accents.length) return `An all-neutral palette of ${colors.join(', ')} — clean and versatile.`
  if (accents.length === 1) return `${neutrals.join(', ') || 'Neutral'} base with ${accents[0]} as a focal accent — a classic formula.`
  return `${colors.slice(0, -1).join(', ')} and ${colors.at(-1)} were paired based on color harmony theory.`
}

export function buildOccExplain(sel: ClothingItem[], opts: GenOptions): string {
  const tf = OCC_FORMAL[opts.occ] ?? 3
  const avg = sel.reduce((s, p) => s + (ITEM_FORMAL[p.occasion] ?? 4), 0) / sel.length
  if (Math.abs(tf - avg) <= 2) return `Each piece aligns with the formality level expected for ${OCC_LABELS[opts.occ]}.`
  if (avg > tf) return 'Slightly more formal than typical — you\'ll look polished.'
  return `Relaxed pieces make this comfortable for ${OCC_LABELS[opts.occ]}.`
}

export function buildSeasonExplain(sel: ClothingItem[], opts: GenOptions): string {
  if (opts.season === 'all') return `All ${sel.length} pieces are versatile year-round options.`
  const m = sel.filter(p => p.season === opts.season || p.season === 'all').length
  return `${m} of ${sel.length} pieces are tagged for ${SEASON_LABELS[opts.season]} — well-suited to the season.`
}

export function buildMoodExplain(mood: string): string {
  const map: Record<string, string> = {
    balanced: 'A well-balanced mix — adaptable across settings.',
    minimal: 'Clean and restrained — every piece earns its place.',
    bold: 'Statement colors were prioritised for a confident look.',
    classic: 'Timeless pieces that never go out of style.',
  }
  return map[mood] ?? ''
}

export function buildTip(occ: string): string {
  const tips: Record<string, string[]> = {
    casual: ['Tuck in just the front for a relaxed French tuck.', 'Roll your sleeves for an effortless look.'],
    work: ['Ensure your shoes are polished — they carry the whole look.', 'Keep accessories minimal for a clean impression.'],
    date: ['Wear a confident color closest to your face.', 'Fitted pieces show more intention.'],
    formal: ['Ensure everything is ironed and well-fitted.', 'Black shoes are always safe for formal settings.'],
    gym: ['Prioritize stretch and moisture-wicking fabrics.'],
    travel: ['Layer up to adapt to temperature changes.', 'Stick to wrinkle-resistant fabrics.'],
  }
  const l = tips[occ] ?? tips.casual
  return l[Math.floor(Math.random() * l.length)]
}

export function buildScores(sel: ClothingItem[], opts: GenOptions) {
  const fn = COMPS[opts.palette] ?? COMPS.harmony
  let cs = 70
  for (let i = 0; i < sel.length; i++) {
    for (let j = i + 1; j < sel.length; j++) {
      cs += fn(sel[i].color, sel[j].color) * 2
    }
  }
  cs = Math.min(Math.round(cs / (sel.length + 1) * 10), 99)

  const tf = OCC_FORMAL[opts.occ] ?? 3
  let os = 100
  sel.forEach(p => { os -= Math.abs(tf - (ITEM_FORMAL[p.occasion] ?? 4)) * 5 })
  os = Math.max(Math.min(os, 99), 40)

  const hasCover = sel.some(p => p.category === 'top' || p.category === 'dress')
  const hasBot = sel.some(p => p.category === 'bottom' || p.category === 'dress')
  const hasShoe = sel.some(p => p.category === 'footwear')
  const comp = Math.min(60 + (hasCover ? 15 : 0) + (hasBot ? 15 : 0) + (hasShoe ? 10 : 0), 99)
  const variety = Math.min(new Set(sel.map(p => p.category)).size * 20 + 20, 99)

  return [
    { label: 'Color Harmony', val: cs, color: '#4A8F6F' },
    { label: 'Occasion Fit', val: Math.min(os, 99), color: '#7BA7BC' },
    { label: 'Completeness', val: comp, color: '#6B8F71' },
    { label: 'Variety', val: variety, color: '#C87BA7' },
  ]
}
