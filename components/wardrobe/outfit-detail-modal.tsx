'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import { Outfit } from '@/lib/types'
import { catIcon } from '@/lib/colors'

interface Props {
  outfit: Outfit | null
  onClose: () => void
  onDelete: (id: number) => void
}

export default function OutfitDetailModal({ outfit, onClose, onDelete }: Props) {
  if (!outfit) return null

  function handleDelete() {
    onDelete(outfit!.id)
    onClose()
  }

  const savedDate = new Date(outfit.savedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <AnimatePresence>
      {outfit && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{ background: 'rgba(26,23,20,.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25 }}
            className="hide-scrollbar"
            style={{ background: 'white', borderRadius: 24, width: 560, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-7 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: outfit.mode === 'ai' ? 'var(--ai-light)' : 'var(--offline-light)', color: outfit.mode === 'ai' ? 'var(--ai)' : 'var(--offline)' }}>
                    {outfit.mode === 'ai' ? 'AI Generated' : 'Offline'}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700 }}>{outfit.name}</h2>
                <div className="flex gap-2 flex-wrap mt-2">
                  <Tag>{outfit.occasion}</Tag>
                  <Tag>{outfit.season}</Tag>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} onClick={onClose}
                className="flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
                style={{ width: 36, height: 36, border: '1.5px solid var(--wear-border)', background: 'transparent' }}>
                <X size={18} />
              </motion.button>
            </div>

            {/* Pieces */}
            <div className="px-7 pb-3">
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--wear-muted)', marginBottom: 14 }}>
                {outfit.pieces.length} Piece{outfit.pieces.length !== 1 ? 's' : ''}
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {outfit.pieces.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-center rounded-2xl overflow-hidden border mb-2"
                      style={{ aspectRatio: '3/4', background: 'var(--cream)', borderColor: 'var(--wear-border)' }}>
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-4xl">{catIcon(p.category)}</span>
                      }
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--wear-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>{p.category}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{p.name}</div>
                    {p.color && <div style={{ fontSize: 11, color: 'var(--wear-muted)', marginTop: 2 }}>{p.color}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-7 py-5 mt-2 border-t" style={{ borderColor: 'var(--wear-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--wear-muted)' }}>Saved {savedDate}</span>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleDelete}
                className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl text-sm font-medium"
                style={{ border: '1.5px solid var(--error)', background: 'transparent', color: 'var(--error)' }}>
                <Trash2 size={14} /> Delete Outfit
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ padding: '4px 10px', background: 'var(--cream)', borderRadius: 20, fontSize: 12, color: 'var(--wear-muted)', fontWeight: 500 }}>
      {children}
    </span>
  )
}
