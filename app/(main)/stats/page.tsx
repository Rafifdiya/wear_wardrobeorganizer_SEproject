'use client'

import { motion } from 'framer-motion'
import { useWear } from '@/lib/store'
import { COLOR_META } from '@/lib/colors'

const CAT_ICONS: Record<string, string> = {
  top: '👔', bottom: '👖', dress: '👗', outerwear: '🧥', footwear: '👟', accessory: '👜',
}
const SEA_ICONS: Record<string, string> = {
  all: '🌍', spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️',
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const cardAnim = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function StatsPage() {
  const { state } = useWear()
  const clothes = state.clothes

  const catData = ['top', 'bottom', 'dress', 'outerwear', 'footwear', 'accessory']
    .map(c => ({ label: c, count: clothes.filter(i => i.category === c).length, icon: CAT_ICONS[c] }))
    .filter(d => d.count > 0)

  const allColors = ['white', 'black', 'gray', 'navy', 'blue', 'red', 'pink', 'green', 'yellow', 'beige', 'brown', 'olive', 'denim', 'orange', 'purple']
  const colData = allColors
    .map(c => ({ label: c, count: clothes.filter(i => i.color === c).length, hex: COLOR_META[c as keyof typeof COLOR_META]?.hex || '#ccc' }))
    .filter(d => d.count > 0)

  const seaData = ['all', 'spring', 'summer', 'fall', 'winter']
    .map(s => ({ label: s, count: clothes.filter(i => i.season === s).length, icon: SEA_ICONS[s] }))
    .filter(d => d.count > 0)

  const total = state.aiCount + state.offlineCount

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={cardAnim} className="mb-9">
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>Style Statistics</h1>
        <p style={{ color: 'var(--wear-muted)', fontSize: 14, marginTop: 6 }}>Insights about your wardrobe.</p>
      </motion.div>

      {/* Responsive 2-column grid */}
      <div className="wear-stats-charts">
        <motion.div variants={cardAnim} className="rounded-2xl p-7 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Categories</h2>
          <BarChart data={catData} color="var(--warm)" />
        </motion.div>

        <motion.div variants={cardAnim} className="rounded-2xl p-7 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Colors</h2>
          <BarChart
            data={colData.map(d => ({ label: d.label, count: d.count, icon: <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: d.hex, border: '1px solid #ddd', verticalAlign: 'middle' }} /> }))}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            colorFn={(d) => (d as any).hex}
          />
        </motion.div>

        <motion.div variants={cardAnim} className="rounded-2xl p-7 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Seasons</h2>
          <BarChart data={seaData} color="#7BA7BC" />
        </motion.div>

        <motion.div variants={cardAnim} className="rounded-2xl p-7 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Generation Mode Usage</h2>
          {total === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--wear-muted)', fontSize: 13 }}>No outfits generated yet.</div>
          ) : (
            <div className="flex flex-col gap-4">
              <ModeBar label="AI Mode" count={state.aiCount} total={total} color="var(--ai)" />
              <ModeBar label="Offline Mode" count={state.offlineCount} total={total} color="var(--offline)" />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

function BarChart({ data, color, colorFn }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: { label: string; count: number; icon?: React.ReactNode | string }[]
  color?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colorFn?: (d: any) => string
}) {
  if (data.length === 0) {
    return <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--wear-muted)', fontSize: 13 }}>No data yet.</div>
  }
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex flex-col gap-3">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-2.5">
          <div style={{ width: 22, textAlign: 'center', fontSize: 14, flexShrink: 0 }}>
            {typeof d.icon === 'string' ? d.icon : d.icon ?? null}
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{d.label}</span>
              <span style={{ color: 'var(--wear-muted)' }}>{d.count}</span>
            </div>
            <div style={{ height: 8, background: 'var(--cream)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.count / max) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 4, background: colorFn ? colorFn(d) : color || 'var(--warm)' }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ModeBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / Math.max(total, 1)) * 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5" style={{ fontWeight: 600, color }}>
        <span>{label}</span>
      </div>
      <div style={{ height: 12, background: 'var(--cream)', borderRadius: 6, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 6 }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--wear-muted)', marginTop: 4 }}>{count} outfits ({pct}%)</div>
    </div>
  )
}
