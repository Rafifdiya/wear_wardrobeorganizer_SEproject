'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shirt, Sparkles, Sun, Wand2, Plus } from 'lucide-react'
import { useWear } from '@/lib/store'
import { catIcon } from '@/lib/colors'
import AddClothingModal from '@/components/wardrobe/add-clothing-modal'
import OnboardingTour from '@/components/onboarding/OnboardingTour'

const TIPS = [
  "In Jakarta's tropical climate, breathable fabrics like linen and cotton are always smart.",
  "Try the '3-color rule': no more than 3 colors per outfit for a cohesive look.",
  "Neutrals (black, white, beige) go with everything — they're the foundation of any wardrobe.",
  "Monochromatic dressing is the easiest way to look effortlessly put-together.",
  "Invest in fit: a well-fitted basic always beats an ill-fitting designer piece.",
  "Accessories transform any outfit — try a belt, watch, or bag you haven't used lately.",
  "Good shoes elevate the whole look. Keep them clean and in good shape.",
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function DashboardPage() {
  const { state, completeOnboarding } = useWear()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const user = state.user!
  const clothes = state.clothes
  const outfits = state.outfits

  const month = new Date().getMonth()
  const curSeason = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'fall'
  const inSeason = clothes.filter(c => c.season === 'all' || c.season === curSeason).length
  const recentItems = clothes.slice(-8).reverse()
  const tip = TIPS[new Date().getDay() % TIPS.length]

  const stats = [
    { Icon: Shirt,    value: clothes.length,       label: 'Total Pieces' },
    { Icon: Sparkles, value: outfits.length,        label: 'Saved Outfits' },
    { Icon: Sun,      value: inSeason,              label: 'In-Season' },
    { Icon: Wand2,    value: state.generatedCount,  label: 'Generated' },
  ]

  return (
    <>
      <AnimatePresence>
        {state.user && !state.user.onboardingCompleted && (
          <OnboardingTour onComplete={completeOnboarding} />
        )}
      </AnimatePresence>

      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start justify-between mb-9">
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>
              {greeting()}, {user.name.split(' ')[0]}!
            </h1>
            <p style={{ color: 'var(--wear-muted)', fontSize: 14, marginTop: 6 }}>Your wardrobe overview for today.</p>
          </div>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--warm)', border: 'none' }}>
            <Plus size={16} /> Add Clothing
          </motion.button>
        </motion.div>

        {/* Stat cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-5 mb-10">
          {stats.map(s => (
            <motion.div key={s.label} whileHover={{ y: -2, boxShadow: 'var(--shadow)' }}
              className="rounded-2xl p-6 border"
              style={{ background: 'white', borderColor: 'var(--wear-border)', transition: 'all .2s' }}>
              <s.Icon size={24} style={{ color: 'var(--warm)', marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--wear-muted)', marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main grid */}
        <motion.div variants={fadeUp} className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>
          <div className="rounded-2xl p-7 border" style={{ background: 'white', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Recently Added</h2>
            {recentItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--wear-muted)' }}>
                No clothes yet.{' '}
                <button onClick={() => setModalOpen(true)} className="cursor-pointer" style={{ color: 'var(--warm)', background: 'none', border: 'none', fontWeight: 500 }}>
                  Add your first piece →
                </button>
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {recentItems.map(c => (
                  <motion.div key={c.id} whileHover={{ scale: 1.03 }}
                    onClick={() => router.push('/wardrobe')}
                    className="cursor-pointer rounded-xl overflow-hidden relative"
                    style={{ aspectRatio: '3/4', background: 'var(--cream)' }}>
                    {c.image
                      ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">{catIcon(c.category)}</div>
                    }
                    <div className="absolute bottom-2 left-2 right-2 text-white text-center"
                      style={{ background: 'rgba(26,23,20,.7)', fontSize: 11, padding: '4px 8px', borderRadius: 6 }}>
                      {c.name}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #2E2A26 100%)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--warm)', marginBottom: 8 }}>
                Jakarta · Tropical
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Today's Style Tip</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.7 }}>{tip}</div>
            </div>
            <div className="rounded-2xl p-7 border" style={{ background: 'white', borderColor: 'var(--wear-border)', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Dual-Mode Engine</h3>
              <p style={{ fontSize: 13, color: 'var(--wear-muted)', lineHeight: 1.7 }}>
                Switch between <strong style={{ color: 'var(--ai)' }}>Online Mode</strong> and{' '}
                <strong style={{ color: 'var(--offline)' }}>Offline Mode</strong> (smart rule-based engine — works without internet).
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AddClothingModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
