'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2 } from 'lucide-react'
import { useWear } from '@/lib/store'
import { useToast } from '@/components/shared/toast'
import { ClothingItem } from '@/lib/types'

const CATEGORIES = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'dress', label: 'Dress / Jumpsuit' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'accessory', label: 'Accessory' },
]

const COLORS = [
  { value: 'white', label: 'White' }, { value: 'black', label: 'Black' },
  { value: 'gray', label: 'Gray' }, { value: 'navy', label: 'Navy' },
  { value: 'blue', label: 'Blue' }, { value: 'red', label: 'Red' },
  { value: 'pink', label: 'Pink' }, { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' }, { value: 'orange', label: 'Orange' },
  { value: 'purple', label: 'Purple' }, { value: 'brown', label: 'Brown' },
  { value: 'beige', label: 'Beige / Cream' }, { value: 'olive', label: 'Olive' },
  { value: 'denim', label: 'Denim' }, { value: 'multicolor', label: 'Multicolor' },
]

const SEASONS = [
  { value: 'all', label: 'All Seasons' }, { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' }, { value: 'fall', label: 'Fall' }, { value: 'winter', label: 'Winter' },
]

const OCCASIONS = [
  { value: 'casual', label: 'Casual' }, { value: 'work', label: 'Work' },
  { value: 'formal', label: 'Formal' }, { value: 'gym', label: 'Gym' }, { value: 'any', label: 'Any' },
]

const STYLES = [
  { value: 'classic', label: 'Classic / Timeless' }, { value: 'casual', label: 'Casual / Relaxed' },
  { value: 'streetwear', label: 'Streetwear' }, { value: 'minimalist', label: 'Minimalist' },
  { value: 'formal', label: 'Formal / Smart' }, { value: 'bohemian', label: 'Bohemian' },
  { value: 'sporty', label: 'Sporty / Athletic' },
]

const selStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1.5px solid var(--wear-border)', borderRadius: 12,
  fontFamily: 'var(--font-sans)', fontSize: 14, background: 'var(--input-bg)', color: 'var(--fg)',
  outline: 'none', appearance: 'none',
}

interface Props {
  open: boolean
  onClose: () => void
  editItem?: ClothingItem
}

export default function AddClothingModal({ open, onClose, editItem }: Props) {
  const { addCloth, updateCloth, uploadClothingImage } = useWear()
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = !!editItem

  const [name, setName] = useState('')
  const [category, setCategory] = useState<ClothingItem['category']>('top')
  const [color, setColor] = useState('white')
  const [season, setSeason] = useState<ClothingItem['season']>('all')
  const [occasion, setOccasion] = useState<ClothingItem['occasion']>('casual')
  const [styleTag, setStyleTag] = useState('classic')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [dragover, setDragover] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editItem) {
      setName(editItem.name)
      setCategory(editItem.category)
      setColor(editItem.color)
      setSeason(editItem.season)
      setOccasion(editItem.occasion)
      setStyleTag(editItem.styleTag)
      setImagePreview(editItem.image)
      setImageFile(null)
    }
  }, [editItem])

  function reset() {
    setName(''); setCategory('top'); setColor('white'); setSeason('all')
    setOccasion('casual'); setStyleTag('classic'); setImagePreview(null); setImageFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() { if (!isEdit) reset(); onClose() }

  function readFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    const r = new FileReader()
    r.onload = ev => {
      setImagePreview(ev.target?.result as string)
      if (!name) setName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
    }
    r.readAsDataURL(file)
  }

  async function handleSave() {
    if (!name.trim()) { showToast('Please enter an item name.', 'error'); return }
    setSaving(true)
    try {
      let imageUrl: string | null = isEdit ? (editItem?.image ?? null) : null

      if (imageFile) {
        imageUrl = await uploadClothingImage(imageFile)
      } else if (!isEdit) {
        imageUrl = null
      }

      if (isEdit && editItem) {
        await updateCloth({ ...editItem, name: name.trim(), category, color, season, occasion, styleTag, image: imageUrl })
        showToast(`"${name.trim()}" updated!`)
      } else {
        await addCloth({ name: name.trim(), category, color, season, occasion, styleTag, image: imageUrl })
        showToast(`"${name.trim()}" added!`)
        reset()
      }
      onClose()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{ background: 'rgba(26,23,20,.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25 }}
            className="hide-scrollbar"
            style={{ background: 'var(--card-bg)', borderRadius: 24, padding: 36, width: 500, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700 }}>
                {isEdit ? 'Edit Clothing Piece' : 'Add Clothing Piece'}
              </h2>
              <motion.button whileHover={{ scale: 1.1 }} onClick={handleClose}
                className="flex items-center justify-center rounded-full cursor-pointer"
                style={{ width: 36, height: 36, border: '1.5px solid var(--wear-border)', background: 'transparent' }}>
                <X size={18} />
              </motion.button>
            </div>

            {/* Upload zone */}
            {!imagePreview ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); setDragover(false); const f = e.dataTransfer.files[0]; if (f) readFile(f) }}
                onDragOver={e => { e.preventDefault(); setDragover(true) }}
                onDragLeave={() => setDragover(false)}
                className="flex flex-col items-center justify-center text-center cursor-pointer mb-6 transition-all"
                style={{
                  border: `2px dashed ${dragover ? 'var(--warm)' : 'var(--wear-border)'}`,
                  borderRadius: 16, padding: '48px 24px',
                  background: dragover ? 'rgba(200,149,108,.04)' : 'transparent',
                  color: dragover ? 'var(--warm)' : 'var(--wear-muted)',
                }}
              >
                <Upload size={40} style={{ marginBottom: 12, opacity: 0.6 }} />
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop photo here or click to upload</div>
                <div style={{ fontSize: 13 }}>JPG, PNG — max 10MB</div>
              </div>
            ) : (
              <div className="mb-6 relative">
                <img src={imagePreview} alt="Preview" className="w-full rounded-xl border" style={{ maxHeight: 280, objectFit: 'contain', borderColor: 'var(--wear-border)' }} />
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setImagePreview(null); setImageFile(null) }}
                  className="absolute top-2 right-2 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ width: 32, height: 32, background: 'var(--card-bg)', border: '1px solid var(--wear-border)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                  <X size={14} />
                </motion.button>
                <button onClick={() => fileRef.current?.click()}
                  className="mt-2 text-xs cursor-pointer"
                  style={{ background: 'none', border: 'none', color: 'var(--warm)', fontWeight: 500 }}>
                  Change photo
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f) }} />

            <Field label="Item Name">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. White Linen Shirt"
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--wear-border)', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 14, background: 'var(--input-bg)', color: 'var(--fg)', outline: 'none' }} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select value={category} onChange={e => setCategory(e.target.value as ClothingItem['category'])} style={selStyle}>
                  {CATEGORIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Color">
                <select value={color} onChange={e => setColor(e.target.value)} style={selStyle}>
                  {COLORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Season">
                <select value={season} onChange={e => setSeason(e.target.value as ClothingItem['season'])} style={selStyle}>
                  {SEASONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Occasion">
                <select value={occasion} onChange={e => setOccasion(e.target.value as ClothingItem['occasion'])} style={selStyle}>
                  {OCCASIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Style Tag">
              <select value={styleTag} onChange={e => setStyleTag(e.target.value)} style={selStyle}>
                {STYLES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={handleSave} disabled={saving}
              className="w-full py-4 mt-2 cursor-pointer font-medium flex items-center justify-center gap-2"
              style={{ background: saving ? 'var(--wear-muted)' : 'var(--warm)', color: 'white', border: 'none', borderRadius: 14, fontFamily: 'var(--font-sans)', fontSize: 15 }}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add to Wardrobe'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--wear-muted)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
