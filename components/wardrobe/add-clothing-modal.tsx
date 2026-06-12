'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2, ChevronDown, Camera, Sparkles, Check } from 'lucide-react'
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
  { value: 'any', label: 'Any Occasion' },
  { value: 'casual', label: 'Casual' }, { value: 'work', label: 'Work' },
  { value: 'formal', label: 'Formal' }, { value: 'gym', label: 'Gym' },
]

const STYLES = [
  { value: 'all', label: 'All Styles' },
  { value: 'classic', label: 'Classic / Timeless' }, { value: 'casual', label: 'Casual / Relaxed' },
  { value: 'streetwear', label: 'Streetwear' }, { value: 'minimalist', label: 'Minimalist' },
  { value: 'formal', label: 'Formal / Smart' }, { value: 'bohemian', label: 'Bohemian' },
  { value: 'sporty', label: 'Sporty / Athletic' },
]


interface Props {
  open: boolean
  onClose: () => void
  editItem?: ClothingItem
}

export default function AddClothingModal({ open, onClose, editItem }: Props) {
  const { addCloth, updateCloth, uploadClothingImage } = useWear()
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const isEdit = !!editItem

  const [name, setName] = useState('')
  const [category, setCategory] = useState<ClothingItem['category']>('top')
  const [color, setColor] = useState('white')
  const [season, setSeason] = useState('all')
  const [occasion, setOccasion] = useState('any')
  const [styleTag, setStyleTag] = useState('classic')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [dragover, setDragover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

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
    setOccasion('any'); setStyleTag('all'); setImagePreview(null); setImageFile(null)
    setAnalyzing(false)
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  function handleClose() { if (!isEdit) reset(); onClose() }

  function readFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    const r = new FileReader()
    r.onload = async ev => {
      const dataUrl = ev.target?.result as string
      setImagePreview(dataUrl)
      if (!name) setName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))

      // Auto-detect color and category via Gemini Vision
      setAnalyzing(true)
      try {
        const base64 = dataUrl.split(',')[1]
        const res = await fetch('/api/items/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        })
        if (res.ok) {
          const { color: detectedColor, category: detectedCategory } = await res.json()
          if (detectedColor) setColor(detectedColor)
          if (detectedCategory) setCategory(detectedCategory as ClothingItem['category'])
        }
      } catch {
        // silently fail — user can still pick manually
      } finally {
        setAnalyzing(false)
      }
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
              <div className="mb-6">
                <div
                  onDrop={e => { e.preventDefault(); setDragover(false); const f = e.dataTransfer.files[0]; if (f) readFile(f) }}
                  onDragOver={e => { e.preventDefault(); setDragover(true) }}
                  onDragLeave={() => setDragover(false)}
                  className="flex flex-col items-center justify-center text-center mb-3 transition-all"
                  style={{
                    border: `2px dashed ${dragover ? 'var(--warm)' : 'var(--wear-border)'}`,
                    borderRadius: 16, padding: '32px 24px',
                    background: dragover ? 'rgba(200,149,108,.04)' : 'transparent',
                    color: dragover ? 'var(--warm)' : 'var(--wear-muted)',
                  }}
                >
                  <Upload size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Drop photo here</div>
                  <div style={{ fontSize: 12 }}>or choose an option below</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center justify-center gap-2 cursor-pointer py-3 rounded-xl text-sm font-medium"
                    style={{ border: '1.5px solid var(--wear-border)', background: 'var(--input-bg)', color: 'var(--fg)' }}>
                    <Upload size={15} /> Gallery
                  </motion.button>
                  <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => cameraRef.current?.click()}
                    className="flex items-center justify-center gap-2 cursor-pointer py-3 rounded-xl text-sm font-medium"
                    style={{ border: '1.5px solid var(--wear-border)', background: 'var(--input-bg)', color: 'var(--fg)' }}>
                    <Camera size={15} /> Take Photo
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="mb-6 relative">
                <img src={imagePreview} alt="Preview" className="w-full rounded-xl border" style={{ maxHeight: 280, objectFit: 'contain', borderColor: 'var(--wear-border)' }} />
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setImagePreview(null); setImageFile(null) }}
                  className="absolute top-2 right-2 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ width: 32, height: 32, background: 'var(--card-bg)', border: '1px solid var(--wear-border)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                  <X size={14} />
                </motion.button>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => fileRef.current?.click()} className="text-xs cursor-pointer"
                    style={{ background: 'none', border: 'none', color: 'var(--warm)', fontWeight: 500 }}>
                    Change photo
                  </button>
                  <button onClick={() => cameraRef.current?.click()} className="text-xs cursor-pointer"
                    style={{ background: 'none', border: 'none', color: 'var(--warm)', fontWeight: 500 }}>
                    Retake
                  </button>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f) }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f) }} />

            <Field label="Item Name">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. White Linen Shirt"
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--wear-border)', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 14, background: 'var(--input-bg)', color: 'var(--fg)', outline: 'none' }} />
            </Field>

            {analyzing && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(200,149,108,.1)', border: '1px solid rgba(200,149,108,.3)' }}>
                <Sparkles size={14} style={{ color: 'var(--warm)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--warm)', fontWeight: 500 }}>Detecting color & category…</span>
                <Loader2 size={13} className="animate-spin ml-auto" style={{ color: 'var(--warm)' }} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label={analyzing ? 'Category (detecting…)' : 'Category'}>
                <SelectWrap>
                  <select value={category} onChange={e => setCategory(e.target.value as ClothingItem['category'])} style={{ ...selStyle, opacity: analyzing ? 0.6 : 1 }} disabled={analyzing}>
                    {CATEGORIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </SelectWrap>
              </Field>
              <Field label={analyzing ? 'Color (detecting…)' : 'Color'}>
                <SelectWrap>
                  <select value={color} onChange={e => setColor(e.target.value)} style={{ ...selStyle, opacity: analyzing ? 0.6 : 1 }} disabled={analyzing}>
                    {COLORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </SelectWrap>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Season">
                <MultiCheckDropdown options={SEASONS} value={season} onChange={setSeason} allValue="all" />
              </Field>
              <Field label="Occasion">
                <MultiCheckDropdown options={OCCASIONS} value={occasion} onChange={setOccasion} allValue="any" />
              </Field>
            </div>

            <Field label="Style Tag">
              <MultiCheckDropdown options={STYLES} value={styleTag} onChange={setStyleTag} allValue="all" />
            </Field>

            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={handleSave} disabled={saving || analyzing}
              className="w-full py-4 mt-2 cursor-pointer font-medium flex items-center justify-center gap-2"
              style={{ background: (saving || analyzing) ? 'var(--wear-muted)' : 'var(--warm)', color: 'white', border: 'none', borderRadius: 14, fontFamily: 'var(--font-sans)', fontSize: 15 }}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Saving…' : analyzing ? 'Analyzing image…' : isEdit ? 'Save Changes' : 'Add to Wardrobe'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const selStyle: React.CSSProperties = {
  width: '100%', padding: '12px 40px 12px 16px', border: '1.5px solid var(--wear-border)', borderRadius: 12,
  fontFamily: 'var(--font-sans)', fontSize: 14, background: 'var(--input-bg)', color: 'var(--fg)',
  outline: 'none', appearance: 'none', cursor: 'pointer',
}

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--wear-muted)', pointerEvents: 'none' }} />
    </div>
  )
}

function MultiCheckDropdown({
  options, value, onChange, allValue,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  allValue: string
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? value.split(',') : [allValue]
  const isAll = selected.includes(allValue)

  function toggle(optValue: string) {
    if (optValue === allValue) { onChange(allValue); return }
    let next = selected.filter(v => v !== allValue)
    next = next.includes(optValue) ? next.filter(v => v !== optValue) : [...next, optValue]
    onChange(next.length === 0 ? allValue : next.join(','))
  }

  const displayLabel = isAll
    ? (options.find(o => o.value === allValue)?.label ?? allValue)
    : options.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          border: '1.5px solid var(--wear-border)',
          borderRadius: open ? '12px 12px 0 0' : 12,
          fontFamily: 'var(--font-sans)', fontSize: 14,
          background: 'var(--input-bg)', color: 'var(--fg)',
          outline: 'none', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayLabel}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ display: 'inline-flex', flexShrink: 0, color: 'var(--wear-muted)' }}>
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              overflow: 'hidden',
              border: '1.5px solid var(--wear-border)', borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              background: 'var(--card-bg)',
            }}
          >
            {options.map(opt => {
              const isChecked = selected.includes(opt.value)
              return (
                <div
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px',
                    cursor: 'pointer',
                    fontSize: 13, color: 'var(--fg)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(200,149,108,.07)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${isChecked ? 'var(--warm)' : 'var(--wear-border)'}`,
                    background: isChecked ? 'var(--warm)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.12s',
                  }}>
                    {isChecked && <Check size={10} color="white" strokeWidth={3} />}
                  </div>
                  {opt.label}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
