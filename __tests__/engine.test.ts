import {
  generateOfflineOutfit,
  buildColorExplain,
  buildMoodExplain,
  buildOccExplain,
  buildSeasonExplain,
  buildScores,
  buildName,
  buildTip,
} from '@/lib/engine'
import type { ClothingItem, GenOptions } from '@/lib/types'

// --- Fixtures ---

let _id = 100
const makeItem = (overrides: Partial<ClothingItem> = {}): ClothingItem => ({
  id: ++_id,
  name: 'Test Item',
  category: 'top',
  color: 'white',
  season: 'all',
  occasion: 'any',
  styleTag: 'casual',
  image: null,
  addedAt: '2024-01-01',
  ...overrides,
})

const defaultOpts: GenOptions = {
  occ: 'casual',
  season: 'all',
  palette: 'harmony',
  mood: 'balanced',
}

const makeWardrobe = (): ClothingItem[] => [
  makeItem({ category: 'top',      color: 'white', occasion: 'casual' }),
  makeItem({ category: 'bottom',   color: 'navy',  occasion: 'casual' }),
  makeItem({ category: 'footwear', color: 'black', occasion: 'any'    }),
]

// --- generateOfflineOutfit ---

describe('generateOfflineOutfit', () => {
  it('returns null for empty wardrobe', () => {
    expect(generateOfflineOutfit([], defaultOpts)).toBeNull()
  })

  it('returns null for single item wardrobe', () => {
    expect(generateOfflineOutfit([makeItem()], defaultOpts)).toBeNull()
  })

  it('returns non-null array for sufficient wardrobe', () => {
    const result = generateOfflineOutfit(makeWardrobe(), defaultOpts)
    expect(result).not.toBeNull()
    expect(Array.isArray(result)).toBe(true)
  })

  it('result contains at least 1 item', () => {
    const result = generateOfflineOutfit(makeWardrobe(), defaultOpts)!
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('result items all come from the wardrobe', () => {
    const wardrobe = makeWardrobe()
    const ids = new Set(wardrobe.map(i => i.id))
    const result = generateOfflineOutfit(wardrobe, defaultOpts)!
    result.forEach(item => expect(ids.has(item.id)).toBe(true))
  })

  it('works with dress-only wardrobe (no separate top/bottom)', () => {
    const wardrobe = [
      makeItem({ category: 'dress',    color: 'pink', occasion: 'casual' }),
      makeItem({ category: 'footwear', color: 'white', occasion: 'any'  }),
    ]
    const result = generateOfflineOutfit(wardrobe, defaultOpts)
    expect(result).not.toBeNull()
  })

  it('returns null when no season-matching items and wardrobe < 2', () => {
    const wardrobe = [
      makeItem({ season: 'winter', category: 'top', occasion: 'any' }),
    ]
    expect(generateOfflineOutfit(wardrobe, { ...defaultOpts, season: 'summer' })).toBeNull()
  })
})

// --- buildColorExplain ---

describe('buildColorExplain', () => {
  it('returns category-harmony fallback for empty list', () => {
    expect(buildColorExplain([])).toContain('category harmony')
  })

  it('returns all-neutral message when all colors are neutral', () => {
    const items = [
      makeItem({ color: 'white' }),
      makeItem({ color: 'black' }),
      makeItem({ color: 'beige' }),
    ]
    const result = buildColorExplain(items)
    expect(result).toContain('neutral')
  })

  it('returns single-accent message when only 1 non-neutral color', () => {
    const items = [
      makeItem({ color: 'white' }),
      makeItem({ color: 'navy'  }),
    ]
    const result = buildColorExplain(items)
    expect(result).toContain('accent')
  })

  it('returns multi-color harmony message when 2+ accents', () => {
    const items = [
      makeItem({ color: 'red'   }),
      makeItem({ color: 'blue'  }),
      makeItem({ color: 'green' }),
    ]
    const result = buildColorExplain(items)
    expect(result).toContain('color harmony')
  })
})

// --- buildMoodExplain ---

describe('buildMoodExplain', () => {
  it.each([
    ['balanced', 'balanced'],
    ['minimal',  'restrained'],
    ['bold',     'Statement'],
    ['classic',  'Timeless'],
  ])('mood "%s" response contains "%s"', (mood, expected) => {
    expect(buildMoodExplain(mood)).toContain(expected)
  })

  it('returns empty string for unknown mood', () => {
    expect(buildMoodExplain('unknown')).toBe('')
  })
})

// --- buildOccExplain ---

describe('buildOccExplain', () => {
  it('returns a non-empty string', () => {
    const items = [
      makeItem({ occasion: 'casual' }),
      makeItem({ occasion: 'casual' }),
    ]
    const result = buildOccExplain(items, { ...defaultOpts, occ: 'casual' })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns "polished" when items are more formal than occasion', () => {
    const items = [
      makeItem({ occasion: 'formal' }),
      makeItem({ occasion: 'work'   }),
    ]
    const result = buildOccExplain(items, { ...defaultOpts, occ: 'casual' })
    expect(result).toContain('polished')
  })

  it('returns "comfortable" when items are less formal than occasion', () => {
    const items = [
      makeItem({ occasion: 'casual' }),
      makeItem({ occasion: 'casual' }),
    ]
    const result = buildOccExplain(items, { ...defaultOpts, occ: 'formal' })
    expect(result).toContain('Relaxed')
  })
})

// --- buildSeasonExplain ---

describe('buildSeasonExplain', () => {
  it('returns year-round message when season is "all"', () => {
    const items = [makeItem(), makeItem()]
    const result = buildSeasonExplain(items, defaultOpts)
    expect(result).toContain('year-round')
  })

  it('counts matching season items correctly', () => {
    const items = [
      makeItem({ season: 'summer' }),
      makeItem({ season: 'all'    }),
      makeItem({ season: 'winter' }),
    ]
    const result = buildSeasonExplain(items, { ...defaultOpts, season: 'summer' })
    expect(result).toContain('2 of 3')
  })

  it('returns 0 match message when no items fit season', () => {
    const items = [
      makeItem({ season: 'winter' }),
      makeItem({ season: 'winter' }),
    ]
    const result = buildSeasonExplain(items, { ...defaultOpts, season: 'summer' })
    expect(result).toContain('0 of 2')
  })
})

// --- buildScores ---

describe('buildScores', () => {
  it('returns exactly 4 score metrics', () => {
    const scores = buildScores(makeWardrobe(), defaultOpts)
    expect(scores).toHaveLength(4)
  })

  it('all score values are between 0 and 99 inclusive', () => {
    const scores = buildScores(makeWardrobe(), defaultOpts)
    scores.forEach(s => {
      expect(s.val).toBeGreaterThanOrEqual(0)
      expect(s.val).toBeLessThanOrEqual(99)
    })
  })

  it('returns the 4 expected metric labels', () => {
    const scores = buildScores(makeWardrobe(), defaultOpts)
    const labels = scores.map(s => s.label)
    expect(labels).toContain('Color Harmony')
    expect(labels).toContain('Occasion Fit')
    expect(labels).toContain('Completeness')
    expect(labels).toContain('Variety')
  })

  it('each metric has a color hex string', () => {
    const scores = buildScores(makeWardrobe(), defaultOpts)
    scores.forEach(s => {
      expect(s.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })
})

// --- buildName ---

describe('buildName', () => {
  it.each(['casual', 'work', 'date', 'formal', 'gym', 'travel'])(
    'returns non-empty string for occasion "%s"',
    (occ) => {
      const name = buildName(occ)
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  )

  it('falls back gracefully for unknown occasion', () => {
    expect(typeof buildName('unknown')).toBe('string')
    expect(buildName('unknown').length).toBeGreaterThan(0)
  })
})

// --- buildTip ---

describe('buildTip', () => {
  it.each(['casual', 'work', 'date', 'formal', 'gym', 'travel'])(
    'returns non-empty string for occasion "%s"',
    (occ) => {
      const tip = buildTip(occ)
      expect(typeof tip).toBe('string')
      expect(tip.length).toBeGreaterThan(0)
    }
  )

  it('falls back gracefully for unknown occasion', () => {
    expect(typeof buildTip('unknown')).toBe('string')
  })
})
