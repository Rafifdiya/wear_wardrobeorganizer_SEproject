'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useWear } from '@/lib/store'
import { useToast } from '@/components/shared/toast'
import { catIcon } from '@/lib/colors'
import AddClothingModal from '@/components/wardrobe/add-clothing-modal'
import OutfitDetailModal from '@/components/wardrobe/outfit-detail-modal'
import { ClothingItem, Outfit } from '@/lib/types'

type TabType = 'clothes' | 'outfits'
type FilterType = 'all' | ClothingItem['category']

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'top', label: 'Tops' },
  { value: 'bottom', label: 'Bottoms' },
  { value: 'dress', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'accessory', label: 'Accessories' },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const cardAnim = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.25 } } }

export default function WardrobePage() {
  const { state, deleteCloth, deleteOutfit } = useWear()
  const { showToast } = useToast()
  const [tab, setTab] = useState<TabType>('clothes')
  const [filter, setFilter] = useState<FilterType>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<ClothingItem | undefined>(undefined)
  const [detailOutfit, setDetailOutfit] = useState<Outfit | null>(null)

  const filteredClothes = filter === 'all' ? state.clothes : state.clothes.filter(c => c.category === filter)

  function handleDeleteCloth(id: number, name: string) {
    deleteCloth(id)
    showToast(`"${name}" removed.`)
  }

  function handleDeleteOutfit(id: number) {
    deleteOutfit(id)
    showToast('Outfit removed.')
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-9">
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>My Wardrobe</h1>
            <p style={{ color: 'var(--wear-muted)', fontSize: 14, marginTop: 6 }}>All your clothing pieces and saved outfits.</p>
          </div>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--warm)', border: 'none' }}>
            <Plus size={16} /> Add Piece
          </motion.button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 mb-7 w-fit border" style={{ background: 'var(--card-bg)', borderRadius: 14, borderColor: 'var(--wear-border)' }}>
          {(['clothes', 'outfits'] as TabType[]).map((t, i) => (
            <button key={t} onClick={() => setTab(t)}
              className="cursor-pointer px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: 'none',
                background: tab === t ? 'var(--ink)' : 'transparent',
                color: tab === t ? 'white' : 'var(--wear-muted)',
              }}>
              {i === 0 ? 'Clothing Pieces' : 'Saved Outfits'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'clothes' ? (
            <motion.div key="clothes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {/* Filter chips */}
              <div className="wear-filter-row mb-6">
                <span style={{ fontSize: 13, color: 'var(--wear-muted)', fontWeight: 500, marginRight: 4, flexShrink: 0 }}>Filter:</span>
                {filterOptions.map(f => (
                  <motion.button key={f.value} whileHover={{ borderColor: 'var(--ink)', color: 'var(--fg)' }}
                    onClick={() => setFilter(f.value)}
                    className="cursor-pointer text-sm transition-all"
                    style={{
                      padding: '7px 16px', borderRadius: 30,
                      border: `1.5px solid ${filter === f.value ? 'var(--ink)' : 'var(--wear-border)'}`,
                      background: filter === f.value ? 'var(--cream)' : 'var(--card-bg)',
                      color: filter === f.value ? 'var(--fg)' : 'var(--wear-muted)',
                    }}>
                    {f.label}
                  </motion.button>
                ))}
              </div>

              {/* Clothes grid */}
              <motion.div variants={container} initial="hidden" animate="show"
                className="wear-cloth-grid">
                {/* Add card */}
                <motion.button variants={cardAnim}
                  whileHover={{ borderColor: 'var(--warm)', color: 'var(--warm)' }}
                  onClick={() => setModalOpen(true)}
                  className="cursor-pointer w-full"
                  style={{
                    border: '2px dashed var(--wear-border)', borderRadius: 16,
                    background: 'transparent', padding: 0, overflow: 'hidden',
                    fontFamily: 'var(--font-sans)', color: 'var(--wear-muted)',
                    display: 'block',
                  }}>
                  <div className="flex flex-col items-center justify-center gap-2"
                    style={{ aspectRatio: '3/4', background: 'rgba(200,149,108,.05)' }}>
                    <Plus size={26} style={{ opacity: 0.55 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>Add Clothing</span>
                  </div>
                </motion.button>

                {filteredClothes.map(c => (
                  <ClothCard key={c.id} item={c}
                    onDelete={handleDeleteCloth}
                    onEdit={item => { setEditItem(item); setModalOpen(true) }}
                  />
                ))}
              </motion.div>

              {filteredClothes.length === 0 && state.clothes.length > 0 && (
                <EmptyState icon={<Plus size={56} />} title="No items in this category" desc="Try a different filter or add a new piece." onClick={() => setModalOpen(true)} />
              )}
            </motion.div>
          ) : (
            <motion.div key="outfits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {state.outfits.length === 0 ? (
                <EmptyState title="No saved outfits yet" desc="Generate and save outfits you love." />
              ) : (
                <motion.div variants={container} initial="hidden" animate="show"
                  className="wear-outfit-grid">
                  {state.outfits.map(o => (
                    <motion.div key={o.id} variants={cardAnim} whileHover={{ y: -3, boxShadow: 'var(--shadow-lg)' }}
                      onClick={() => setDetailOutfit(o)}
                      className="rounded-2xl overflow-hidden border transition-all cursor-pointer"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)' }}>
                      {/* Preview grid */}
                      <div className="grid grid-cols-2 gap-2 p-3" style={{ background: 'var(--cream)' }}>
                        {o.pieces.slice(0, 4).map((p, i) => (
                          <div key={i} className="rounded-xl overflow-hidden flex items-center justify-center"
                            style={{ background: 'var(--wear-border)', aspectRatio: '1' }}>
                            {p.image
                              ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              : <span className="text-2xl">{catIcon(p.category)}</span>
                            }
                          </div>
                        ))}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{o.name}</div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: o.mode === 'ai' ? 'var(--ai-light)' : 'var(--offline-light)', color: o.mode === 'ai' ? 'var(--ai)' : 'var(--offline)' }}>
                            {o.mode === 'ai' ? 'AI' : 'Offline'}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-3">
                          <Tag>{o.occasion}</Tag>
                          <Tag>{o.season}</Tag>
                        </div>
                        <div className="flex justify-end">
                          <motion.button whileHover={{ scale: 1.1 }}
                            onClick={e => { e.stopPropagation(); handleDeleteOutfit(o.id) }}
                            className="flex items-center justify-center rounded-full cursor-pointer"
                            style={{ width: 30, height: 30, background: 'var(--card-bg)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                            <Trash2 size={14} style={{ color: 'var(--error)' }} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AddClothingModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(undefined) }}
        editItem={editItem}
      />
      <OutfitDetailModal
        outfit={detailOutfit}
        onClose={() => setDetailOutfit(null)}
        onDelete={handleDeleteOutfit}
      />
    </>
  )
}

function ClothCard({ item, onDelete, onEdit }: {
  item: ClothingItem
  onDelete: (id: number, name: string) => void
  onEdit: (item: ClothingItem) => void
}) {
  return (
    <motion.div variants={cardAnim} whileHover={{ y: -3, boxShadow: 'var(--shadow-lg)' }}
      className="relative rounded-2xl overflow-hidden border group transition-all"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--wear-border)' }}>
      <div className="flex items-center justify-center" style={{ aspectRatio: '3/4', background: 'var(--cream)' }}>
        {item.image
          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          : <span style={{ fontSize: 52, lineHeight: 1 }}>{catIcon(item.category)}</span>
        }
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
        <div style={{ fontSize: 11, color: 'var(--wear-muted)', marginTop: 4 }}>{item.color}</div>
        <div className="flex gap-1 flex-wrap mt-2">
          <Tag>{item.season}</Tag>
          <Tag>{item.occasion}</Tag>
        </div>
      </div>
      {/* Edit + Delete on hover */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.button whileHover={{ scale: 1.1 }} onClick={() => onEdit(item)}
          className="flex items-center justify-center rounded-full cursor-pointer"
          style={{ width: 30, height: 30, background: 'var(--card-bg)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
          <Pencil size={13} style={{ color: 'var(--fg)' }} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} onClick={() => onDelete(item.id, item.name)}
          className="flex items-center justify-center rounded-full cursor-pointer"
          style={{ width: 30, height: 30, background: 'var(--card-bg)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
          <Trash2 size={13} style={{ color: 'var(--error)' }} />
        </motion.button>
      </div>
    </motion.div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ padding: '3px 8px', background: 'var(--cream)', borderRadius: 20, fontSize: 10, color: 'var(--wear-muted)', fontWeight: 500 }}>
      {children}
    </span>
  )
}

function EmptyState({ icon, title, desc, onClick }: { icon?: React.ReactNode; title: string; desc?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center text-center gap-3 transition-all"
      style={{ padding: '80px 40px', color: 'var(--wear-muted)', cursor: onClick ? 'pointer' : 'default', borderRadius: 16 }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'rgba(200,149,108,.05)' }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <div style={{ opacity: 0.4 }}>{icon && icon}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--fg)' }}>{title}</div>
      {desc && <div style={{ fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>{desc}</div>}
    </div>
  )
}
