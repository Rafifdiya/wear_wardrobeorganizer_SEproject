'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RotateCcw, Bookmark, Wand2, Loader2 } from 'lucide-react'
import { useWear } from '@/lib/store'
import { useToast } from '@/components/shared/toast'
import { catIcon, COLOR_META } from '@/lib/colors'
import {
  generateOfflineOutfit, buildName, buildColorExplain, buildOccExplain,
  buildSeasonExplain, buildMoodExplain, buildTip, buildScores,
} from '@/lib/engine'
import { ClothingItem, GenOptions, GeneratorMode, Occasion, Season, ColorStrategy, StyleMood, Outfit } from '@/lib/types'

type OutfitResult = {
  name: string
  pieces: ClothingItem[]
  mode: GeneratorMode
  reasoning?: string
  stylingTip?: string
  colorExplain?: string
  occExplain?: string
  seasonExplain?: string
  moodExplain?: string
  scores?: { label: string; val: number; color: string }[]
  paletteColors?: string[]
}

const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: 'casual', label: 'Casual' }, { value: 'work', label: 'Work' },
  { value: 'date', label: 'Date Night' }, { value: 'formal', label: 'Formal' },
  { value: 'gym', label: 'Gym' }, { value: 'travel', label: 'Travel' },
]
const SEASONS: { value: Season; label: string }[] = [
  { value: 'all', label: 'All Year' }, { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' }, { value: 'fall', label: 'Fall' }, { value: 'winter', label: 'Winter' },
]
const PALETTES: { value: ColorStrategy; label: string }[] = [
  { value: 'harmony', label: 'Auto Harmony' }, { value: 'neutral', label: 'Neutral' },
  { value: 'monochrome', label: 'Monochrome' }, { value: 'contrast', label: 'Contrast' },
  { value: 'earth', label: 'Earth Tones' },
]
const MOODS: { value: StyleMood; label: string }[] = [
  { value: 'balanced', label: 'Balanced' }, { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' }, { value: 'classic', label: 'Classic' },
]

export default function GeneratorPage() {
  const { state, addOutfit, incCounts } = useWear()
  const { showToast } = useToast()

  const [mode, setMode] = useState<GeneratorMode>('ai')
  const [opts, setOpts] = useState<GenOptions>({ occ: 'casual', season: 'all', palette: 'harmony', mood: 'balanced' })
  const [optsInit, setOptsInit] = useState(false)
  const [vibe, setVibe] = useState('')

  useEffect(() => {
    if (state.user && !optsInit) {
      setOpts(prev => ({
        ...prev,
        occ: (state.user!.prefOccasion as Occasion) || 'casual',
        season: (state.user!.prefSeason as Season) || 'all',
        mood: (state.user!.prefMood as StyleMood) || 'balanced',
      }))
      setOptsInit(true)
    }
  }, [state.user, optsInit])

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OutfitResult | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)

  function setOpt<K extends keyof GenOptions>(key: K, val: GenOptions[K]) {
    setOpts(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    if (!result || savedId !== null) return
    try {
      const saved = await addOutfit({ name: result.name, pieces: result.pieces, occasion: opts.occ, season: opts.season, mode: result.mode })
      setSavedId(saved.id)
      showToast(`"${result.name}" saved!`)
    } catch {
      showToast('Failed to save outfit.', 'error')
    }
  }

  async function handleGenerate() {
    if (state.clothes.length < 2) { showToast('Add at least 2 clothing items first.', 'error'); return }
    if (mode === 'ai') await generateAI()
    else runOffline()
  }

  function runOffline() {
    const pieces = generateOfflineOutfit(state.clothes, opts)
    if (!pieces) { showToast('Not enough variety for this filter.', 'error'); return }
    incCounts('offline')
    setSavedId(null)
    setResult({
      name: buildName(opts.occ),
      pieces,
      mode: 'offline',
      colorExplain: buildColorExplain(pieces),
      occExplain: buildOccExplain(pieces, opts),
      seasonExplain: buildSeasonExplain(pieces, opts),
      moodExplain: buildMoodExplain(opts.mood),
      stylingTip: buildTip(opts.occ),
      scores: buildScores(pieces, opts),
      paletteColors: [...new Set(pieces.map(p => p.color).filter(Boolean))],
    })
  }

  async function generateAI() {
    setLoading(true)
    setSavedId(null)
    setResult(null)

    let pool = state.clothes.filter(c => {
      const sOk = opts.season === 'all' || c.season === 'all' || c.season === opts.season
      const oOk = opts.occ === 'casual' || c.occasion === 'any' || c.occasion === (opts.occ as string)
      return sOk && oOk
    })
    if (pool.length < 2) pool = state.clothes

    const clothesList = pool.map(c => `- ${c.name} (${c.category}, ${c.color || 'unspecified color'}, ${c.occasion} occasion, ${c.season} season)`).join('\n')
    const prompt = `You are a professional fashion stylist. The user's wardrobe:\n${clothesList}\n\nCreate ONE stylish outfit for: ${opts.occ} occasion, ${opts.season} season, ${opts.palette} color palette.${vibe ? `\nContext: "${vibe}"` : ''}\n\nRespond ONLY in this JSON (no markdown, no extra text):\n{"outfitName":"short creative name","pieces":["exact item name from list","...up to 4 items"],"styleReasoning":"2-3 sentences on why this combo works","stylingTip":"one practical tip"}`

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const parsed = JSON.parse(data.text.replace(/```json|```/g, '').trim())

      const matched = (parsed.pieces as string[]).map(name => {
        return pool.find(c =>
          c.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
          name.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
        ) ?? ({ name, category: 'top', color: '', season: 'all', occasion: 'casual', styleTag: 'classic', image: null, id: 0, addedAt: '' } as ClothingItem)
      })

      incCounts('ai')
      setResult({ name: parsed.outfitName, pieces: matched, mode: 'ai', reasoning: parsed.styleReasoning, stylingTip: parsed.stylingTip })
    } catch {
      showToast('AI unavailable — switching to Offline Mode.', 'error')
      setTimeout(() => { setMode('offline'); runOffline() }, 600)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>Outfit Generator</h1>
        <p style={{ color: 'var(--wear-muted)', fontSize: 14, marginTop: 6 }}>Choose a mode based on your current situation.</p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-0 w-fit mb-7 border"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)', borderRadius: 16, padding: 5, boxShadow: 'var(--shadow)' }}>
        {([
          { v: 'ai' as GeneratorMode, label: 'Online Mode', sub: 'Needs internet', Icon: Wifi },
          { v: 'offline' as GeneratorMode, label: 'Offline Mode', sub: 'No internet needed', Icon: WifiOff },
        ]).map(({ v, label, sub, Icon }) => (
          <motion.button key={v} whileTap={{ scale: 0.97 }}
            onClick={() => { setMode(v); setResult(null); setSavedId(null) }}
            className="flex items-center gap-2.5 cursor-pointer"
            style={{
              padding: '12px 22px', borderRadius: 12, border: 'none',
              background: mode === v ? (v === 'ai' ? 'var(--ai)' : 'var(--offline)') : 'transparent',
              color: mode === v ? 'white' : 'var(--wear-muted)',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
              transition: 'all .25s',
            }}>
            <Icon size={18} />
            <span className="flex flex-col items-start gap-0.5">
              <strong style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>{label}</strong>
              <span style={{ fontSize: 11, opacity: .75, lineHeight: 1 }}>{sub}</span>
            </span>
          </motion.button>
        ))}
      </div>

      {/* Mode indicator */}
      <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl text-sm font-medium w-fit"
        style={{
          background: mode === 'ai' ? 'var(--ai-light)' : 'var(--offline-light)',
          color: mode === 'ai' ? 'var(--ai)' : 'var(--offline)',
        }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: mode === 'ai' ? 'var(--ai)' : 'var(--offline)', display: 'inline-block' }} />
        {mode === 'ai' ? 'Online Mode — AI-powered outfit suggestions' : 'Offline Mode — Smart rule-based engine, no internet required'}
      </div>

      {/* Responsive layout: controls left, result right on desktop; stacked on mobile */}
      <div className="wear-gen-layout">
        {/* Controls */}
        <div style={{ position: 'sticky', top: 40 }}>
          <ControlCard title="Occasion">
            <ToggleGroup options={OCCASIONS} value={opts.occ} onChange={v => setOpt('occ', v as Occasion)} />
          </ControlCard>
          <ControlCard title="Season">
            <ToggleGroup options={SEASONS} value={opts.season} onChange={v => setOpt('season', v as Season)} />
          </ControlCard>
          <ControlCard title="Color Strategy">
            <ToggleGroup options={PALETTES} value={opts.palette} onChange={v => setOpt('palette', v as ColorStrategy)} />
          </ControlCard>

          {mode === 'ai' && (
            <ControlCard title="Describe the Vibe">
              <textarea value={vibe} onChange={e => setVibe(e.target.value)} rows={3}
                placeholder="e.g. 'smart casual for a creative office meeting'"
                style={{ width: '100%', border: '1.5px solid var(--wear-border)', borderRadius: 12, padding: 12, fontFamily: 'var(--font-sans)', fontSize: 13, resize: 'vertical', outline: 'none', color: 'var(--fg)', background: 'var(--input-bg)', minHeight: 80 }} />
            </ControlCard>
          )}

          {mode === 'offline' && (
            <ControlCard title="Style Mood">
              <ToggleGroup options={MOODS} value={opts.mood} onChange={v => setOpt('mood', v as StyleMood)} />
            </ControlCard>
          )}

          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={handleGenerate} disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 cursor-pointer font-bold"
            style={{
              padding: 16, borderRadius: 14, border: 'none', color: 'white',
              background: mode === 'ai' ? 'var(--ai)' : 'var(--offline)',
              fontFamily: 'var(--font-heading)', fontSize: 17,
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : mode === 'ai' ? '0 8px 20px rgba(123,94,167,.3)' : '0 8px 20px rgba(74,143,111,.3)',
            }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
            {loading ? 'Generating...' : mode === 'ai' ? 'Generate with AI' : 'Generate Offline'}
          </motion.button>
        </div>

        {/* Result area */}
        <div className="md:min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 text-center"
                style={{ padding: '80px 40px', color: 'var(--wear-muted)' }}>
                <Loader2 size={40} className="animate-spin" style={{ color: mode === 'ai' ? 'var(--ai)' : 'var(--offline)' }} />
                <div>{mode === 'ai' ? 'AI is curating your perfect outfit...' : 'Building your outfit...'}</div>
              </motion.div>
            )}

            {!loading && !result && (
              <motion.div key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="hidden md:flex flex-col items-center justify-center gap-3 text-center"
                style={{ padding: '80px 40px', color: 'var(--wear-muted)' }}>
                <Wand2 size={56} style={{ opacity: 0.35 }} />
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--fg)' }}>Ready to style you</div>
                <div style={{ fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>Pick a mode, set your preferences, then hit Generate.</div>
              </motion.div>
            )}

            {!loading && result && (
              <motion.div key="result"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl p-8 border"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
                {/* Result header */}
                <div className="flex items-start justify-between gap-5 mb-6">
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full mb-2"
                      style={{ background: result.mode === 'ai' ? 'var(--ai-light)' : 'var(--offline-light)', color: result.mode === 'ai' ? 'var(--ai)' : 'var(--offline)' }}>
                      {result.mode === 'ai' ? <Wifi size={12} /> : <WifiOff size={12} />}
                      {result.mode === 'ai' ? 'AI Generated' : 'Rule-Based · Offline'}
                    </span>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700 }}>{result.name}</h2>
                    {result.paletteColors && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {result.paletteColors.map(c => (
                          <div key={c} title={c} className="rounded-full border-2 border-white"
                            style={{ width: 24, height: 24, background: COLOR_META[c as keyof typeof COLOR_META]?.hex || 'var(--warm)', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />
                        ))}
                        <span style={{ fontSize: 12, color: 'var(--wear-muted)' }}>Color palette</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <motion.button whileHover={{ borderColor: 'var(--fg)' }} whileTap={{ scale: 0.97 }}
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 cursor-pointer text-sm font-medium px-4 py-2 rounded-xl"
                      style={{ border: '1.5px solid var(--wear-border)', background: 'transparent', color: 'var(--fg)' }}>
                      <RotateCcw size={14} /> Again
                    </motion.button>
                    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                      onClick={handleSave} disabled={savedId !== null}
                      className="flex items-center gap-1.5 cursor-pointer text-sm font-medium px-4 py-2 rounded-xl text-white"
                      style={{ background: savedId !== null ? 'var(--success)' : 'var(--warm)', border: 'none', opacity: savedId !== null ? 0.85 : 1 }}>
                      <Bookmark size={14} />
                      {savedId !== null ? 'Saved!' : 'Save'}
                    </motion.button>
                  </div>
                </div>

                {/* Pieces */}
                <div className="flex gap-4 mb-6 flex-wrap">
                  {result.pieces.map((p, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 100, maxWidth: 160 }}>
                      <div className="flex items-center justify-center rounded-2xl overflow-hidden border mb-2.5"
                        style={{ aspectRatio: '3/4', background: 'var(--cream)', borderColor: 'var(--wear-border)' }}>
                        {p.image
                          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          : <span className="text-5xl">{catIcon(p.category)}</span>
                        }
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--wear-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }}>{p.category}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{p.name}</div>
                      {p.color && <div style={{ fontSize: 11, color: 'var(--wear-muted)', marginTop: 2 }}>{p.color}</div>}
                    </div>
                  ))}
                </div>

                {/* AI reasoning */}
                {result.mode === 'ai' && result.reasoning && (
                  <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--ai-light)', borderLeft: '4px solid var(--ai)' }}>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--ai)' }}>
                      <Wand2 size={12} /> AI Reasoning
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.7 }}>{result.reasoning}</p>
                    {result.stylingTip && (
                      <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(123,94,167,.2)' }}>
                        <strong>Tip:</strong> {result.stylingTip}
                      </p>
                    )}
                  </div>
                )}

                {/* Offline reasoning cards */}
                {result.mode === 'offline' && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <ReasonCard style={{ background: 'rgba(200,149,108,.1)', borderLeft: '3px solid var(--warm)' }} label="Color Harmony" text={result.colorExplain!} />
                      <ReasonCard style={{ background: 'rgba(123,167,188,.1)', borderLeft: '3px solid #7BA7BC' }} label="Occasion Fit" text={result.occExplain!} />
                      <ReasonCard style={{ background: 'rgba(107,143,113,.1)', borderLeft: '3px solid var(--success)' }} label="Season Match" text={result.seasonExplain!} />
                      <ReasonCard style={{ background: 'rgba(200,123,167,.1)', borderLeft: '3px solid #C87BA7' }} label="Style Mood" text={result.moodExplain!} />
                    </div>
                    {result.stylingTip && (
                      <div className="rounded-2xl p-4 text-white mb-4"
                        style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #2E2A26 100%)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6, color: 'rgba(255,255,255,.6)' }}>Styling Tip</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{result.stylingTip}</div>
                      </div>
                    )}
                    {result.scores && (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--wear-border)' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Outfit Score</div>
                        {result.scores.map(s => (
                          <div key={s.label} className="flex items-center gap-3 mb-2">
                            <span style={{ fontSize: 12, color: 'var(--wear-muted)', width: 110, flexShrink: 0 }}>{s.label}</span>
                            <div style={{ flex: 1, height: 8, background: 'var(--cream)', borderRadius: 4, overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${s.val}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                                style={{ height: '100%', background: s.color, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, width: 30, textAlign: 'right' }}>{s.val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Tags */}
                <div className="flex gap-2 flex-wrap mt-4">
                  {[opts.occ, opts.season, opts.palette, ...(result.mode === 'offline' ? [opts.mood] : [])].map(t => (
                    <span key={t} style={{ padding: '5px 12px', background: 'var(--cream)', borderRadius: 20, fontSize: 12, fontWeight: 500, color: 'var(--wear-muted)' }}>{t}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function ControlCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 border mb-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function ToggleGroup<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <motion.button key={o.value} whileTap={{ scale: 0.96 }}
          onClick={() => onChange(o.value)}
          className="cursor-pointer text-sm"
          style={{
            padding: '8px 16px', borderRadius: 30,
            border: `1.5px solid ${value === o.value ? 'var(--ink)' : 'var(--wear-border)'}`,
            background: value === o.value ? 'var(--ink)' : 'transparent',
            color: value === o.value ? 'white' : 'var(--wear-muted)',
            fontFamily: 'var(--font-sans)',
          }}>
          {o.label}
        </motion.button>
      ))}
    </div>
  )
}

function ReasonCard({ style, label, text }: { style: React.CSSProperties; label: string; text: string }) {
  return (
    <div className="rounded-2xl p-4" style={style}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>{text}</div>
    </div>
  )
}
