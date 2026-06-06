'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, Shirt, Sparkles, BarChart2, User, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: '👋',
    title: 'Welcome to WEAR!',
    description: 'Your smart wardrobe organizer. WEAR helps you manage your clothing items and generate outfit ideas — powered by AI or an offline rule engine.',
    color: 'var(--warm)',
  },
  {
    icon: <Shirt size={36} color="var(--warm)" />,
    title: 'My Wardrobe',
    description: 'Add your clothing items with photos, category, color, and season. Your entire wardrobe, organized in one place.',
    color: '#e8f4fd',
  },
  {
    icon: <Sparkles size={36} color="#7c3aed" />,
    title: 'Outfit Generator',
    description: 'Generate outfit combinations using AI (describe your vibe) or Offline Mode (rule-based engine). Save outfits you love.',
    color: '#f3f0ff',
  },
  {
    icon: <BarChart2 size={36} color="#059669" />,
    title: 'Style Stats',
    description: 'See breakdowns of your wardrobe by category, color, season, and how often you use AI vs Offline mode.',
    color: '#ecfdf5',
  },
  {
    icon: <CheckCircle size={36} color="var(--warm)" />,
    title: "You're all set!",
    description: "Start by adding your first clothing item. Once you have a few pieces, generate your first outfit!",
    color: 'var(--warm)',
  },
]

interface OnboardingTourProps {
  onComplete: () => void
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  function next() {
    if (step === steps.length - 1) {
      onComplete()
      return
    }
    setDirection(1)
    setStep(s => s + 1)
  }

  function prev() {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const current = steps[step]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(90vw, 480px)',
        zIndex: 201,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--card-bg)',
            borderRadius: 28,
            padding: '40px 36px 32px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Skip button */}
          <button
            onClick={onComplete}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'var(--cream)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'var(--wear-muted)',
            }}
          >
            <X size={14} />
          </button>

          {/* Step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.2 }}
            >
              {/* Icon */}
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: typeof current.color === 'string' && current.color.startsWith('var') ? '#fff5ee' : current.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24, fontSize: 36,
              }}>
                {typeof current.icon === 'string' ? current.icon : current.icon}
              </div>

              {/* Title */}
              <h2 style={{
                fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700,
                color: 'var(--fg)', marginBottom: 12, lineHeight: 1.2,
              }}>
                {current.title}
              </h2>

              {/* Description */}
              <p style={{
                fontSize: 15, color: 'var(--wear-muted)', lineHeight: 1.6,
                marginBottom: 32,
              }}>
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                background: i === step ? 'var(--warm)' : 'var(--wear-border)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <button
              onClick={prev}
              disabled={step === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 12, cursor: step === 0 ? 'not-allowed' : 'pointer',
                border: '1.5px solid var(--wear-border)', background: 'transparent',
                color: step === 0 ? 'var(--wear-border)' : 'var(--fg)',
                fontSize: 14, fontWeight: 500,
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={next}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
                border: 'none', background: 'var(--warm)',
                color: 'white', fontSize: 14, fontWeight: 600,
              }}
            >
              {step === steps.length - 1 ? "Let's Start!" : 'Next'}
              {step < steps.length - 1 && <ChevronRight size={16} />}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  )
}
