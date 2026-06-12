import { ClothingItem } from './types'

export interface HistoryEntry {
  id: string
  name: string
  pieces: ClothingItem[]
  occasion: string
  season: string
  mode: 'ai' | 'offline'
  generatedAt: string
}

export type HistoryDuration = 0 | 3 | 7

const KEY = 'wear_outfit_history'
const DURATION_KEY = 'wear_history_duration'
const MAX = 20

export function getHistoryDuration(): HistoryDuration {
  if (typeof window === 'undefined') return 7
  const raw = localStorage.getItem(DURATION_KEY)
  if (raw === '0') return 0
  if (raw === '3') return 3
  return 7
}

export function setHistoryDuration(days: HistoryDuration): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DURATION_KEY, String(days))
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const duration = getHistoryDuration()
    if (duration === 0) return []
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const entries: HistoryEntry[] = JSON.parse(raw)
    const cutoff = Date.now() - duration * 24 * 60 * 60 * 1000
    return entries.filter(e => new Date(e.generatedAt).getTime() > cutoff)
  } catch {
    return []
  }
}

export function addToHistory(entry: Omit<HistoryEntry, 'id' | 'generatedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    if (getHistoryDuration() === 0) return
    const current = getHistory()
    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      generatedAt: new Date().toISOString(),
    }
    const updated = [newEntry, ...current].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {
    // ignore storage errors
  }
}

export function deleteFromHistory(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const entries: HistoryEntry[] = JSON.parse(raw)
    localStorage.setItem(KEY, JSON.stringify(entries.filter(e => e.id !== id)))
  } catch {
    // ignore
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
