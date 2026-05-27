'use client'

import { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react'
import { AppState, User, ClothingItem, Outfit } from './types'

const initial: AppState = {
  user: null,
  clothes: [],
  outfits: [],
  generatedCount: 0,
  aiCount: 0,
  offlineCount: 0,
}

type Action =
  | { type: 'SET_USER'; user: User }
  | { type: 'LOAD_DATA'; data: Partial<AppState> }
  | { type: 'ADD_CLOTH'; item: ClothingItem }
  | { type: 'DELETE_CLOTH'; id: number }
  | { type: 'UPDATE_CLOTH'; item: ClothingItem }
  | { type: 'ADD_OUTFIT'; outfit: Outfit }
  | { type: 'DELETE_OUTFIT'; id: number }
  | { type: 'INC_COUNTS'; mode: 'ai' | 'offline' }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'LOGOUT' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.user }
    case 'LOAD_DATA': return { ...state, ...action.data }
    case 'ADD_CLOTH': return { ...state, clothes: [...state.clothes, action.item] }
    case 'DELETE_CLOTH': return { ...state, clothes: state.clothes.filter(c => c.id !== action.id) }
    case 'UPDATE_CLOTH': return { ...state, clothes: state.clothes.map(c => c.id === action.item.id ? action.item : c) }
    case 'ADD_OUTFIT': return { ...state, outfits: [...state.outfits, action.outfit] }
    case 'DELETE_OUTFIT': return { ...state, outfits: state.outfits.filter(o => o.id !== action.id) }
    case 'INC_COUNTS': return {
      ...state,
      generatedCount: state.generatedCount + 1,
      aiCount: action.mode === 'ai' ? state.aiCount + 1 : state.aiCount,
      offlineCount: action.mode === 'offline' ? state.offlineCount + 1 : state.offlineCount,
    }
    case 'UPDATE_USER': return { ...state, user: action.user }
    case 'LOGOUT': return { ...initial }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(raw: any): ClothingItem {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    color: raw.color,
    season: raw.season,
    occasion: raw.occasion,
    styleTag: raw.style_tag ?? raw.styleTag ?? '',
    image: raw.image_url ?? raw.imageUrl ?? null,
    addedAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOutfit(raw: any): Outfit {
  return {
    id: raw.id,
    name: raw.name,
    pieces: (raw.pieces ?? []).map(mapItem),
    occasion: raw.occasion,
    season: raw.season,
    mode: raw.mode,
    savedAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  }
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Request failed')
  return data
}

interface WearContextValue {
  state: AppState
  login: (email: string, password: string, rememberDays?: number) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  addCloth: (item: Omit<ClothingItem, 'id' | 'addedAt'>) => Promise<void>
  deleteCloth: (id: number) => Promise<void>
  updateCloth: (item: ClothingItem) => Promise<void>
  addOutfit: (outfit: Omit<Outfit, 'id' | 'savedAt'>) => Promise<Outfit>
  deleteOutfit: (id: number) => Promise<void>
  incCounts: (mode: 'ai' | 'offline') => void
  updateUser: (data: { firstName?: string; lastName?: string; email?: string; username?: string; bio?: string }) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  uploadClothingImage: (file: File) => Promise<string>
  isReady: boolean
}

const WearContext = createContext<WearContextValue | null>(null)

export function WearProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const [isReady, setIsReady] = useReducer(() => true, false)

  useEffect(() => {
    async function init() {
      try {
        const { user } = await apiFetch('/api/auth/me')
        if (user) {
          dispatch({ type: 'SET_USER', user })
          const [{ items }, { outfits }] = await Promise.all([
            apiFetch('/api/items'),
            apiFetch('/api/outfits'),
          ])
          dispatch({
            type: 'LOAD_DATA', data: {
              clothes: items.map(mapItem),
              outfits: outfits.map(mapOutfit),
              generatedCount: user.generatedCount ?? 0,
              aiCount: user.aiCount ?? 0,
              offlineCount: user.offlineCount ?? 0,
            }
          })
        }
      } catch { /* not logged in */ }
      setIsReady()
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string, rememberDays?: number) => {
    const { user } = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberDays }),
    })
    dispatch({ type: 'SET_USER', user })
    const [{ items }, { outfits }] = await Promise.all([
      apiFetch('/api/items'),
      apiFetch('/api/outfits'),
    ])
    dispatch({
      type: 'LOAD_DATA', data: {
        clothes: items.map(mapItem),
        outfits: outfits.map(mapOutfit),
        generatedCount: user.generatedCount ?? 0,
        aiCount: user.aiCount ?? 0,
        offlineCount: user.offlineCount ?? 0,
      }
    })
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user } = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    dispatch({ type: 'SET_USER', user })
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    dispatch({ type: 'LOGOUT' })
  }, [])

  const addCloth = useCallback(async (item: Omit<ClothingItem, 'id' | 'addedAt'>) => {
    const { item: newItem } = await apiFetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: item.name, category: item.category, color: item.color, season: item.season, occasion: item.occasion, styleTag: item.styleTag, imageUrl: item.image }),
    })
    dispatch({ type: 'ADD_CLOTH', item: mapItem(newItem) })
  }, [])

  const deleteCloth = useCallback(async (id: number) => {
    await apiFetch(`/api/items/${id}`, { method: 'DELETE' })
    dispatch({ type: 'DELETE_CLOTH', id })
  }, [])

  const updateCloth = useCallback(async (item: ClothingItem) => {
    const { item: updated } = await apiFetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: item.name, category: item.category, color: item.color, season: item.season, occasion: item.occasion, styleTag: item.styleTag, imageUrl: item.image }),
    })
    dispatch({ type: 'UPDATE_CLOTH', item: mapItem(updated) })
  }, [])

  const addOutfit = useCallback(async (outfit: Omit<Outfit, 'id' | 'savedAt'>): Promise<Outfit> => {
    const { outfit: newOutfit } = await apiFetch('/api/outfits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: outfit.name, occasion: outfit.occasion, season: outfit.season, mode: outfit.mode, pieceIds: outfit.pieces.map(p => p.id) }),
    })
    const mapped: Outfit = { id: newOutfit.id, name: newOutfit.name, pieces: outfit.pieces, occasion: newOutfit.occasion, season: newOutfit.season, mode: newOutfit.mode, savedAt: newOutfit.created_at ?? new Date().toISOString() }
    dispatch({ type: 'ADD_OUTFIT', outfit: mapped })
    return mapped
  }, [])

  const deleteOutfit = useCallback(async (id: number) => {
    await apiFetch(`/api/outfits/${id}`, { method: 'DELETE' })
    dispatch({ type: 'DELETE_OUTFIT', id })
  }, [])

  const incCounts = useCallback((mode: 'ai' | 'offline') => {
    dispatch({ type: 'INC_COUNTS', mode })
    apiFetch('/api/profile/counts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    }).catch(() => {})
  }, [])

  const updateUser = useCallback(async (data: { firstName?: string; lastName?: string; email?: string; username?: string; bio?: string }) => {
    const { user } = await apiFetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    dispatch({ type: 'UPDATE_USER', user })
  }, [])

  const uploadAvatar = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { avatarUrl } = await apiFetch('/api/profile/avatar', { method: 'POST', body: formData })
    if (state.user) dispatch({ type: 'UPDATE_USER', user: { ...state.user, avatar: avatarUrl } })
  }, [state.user])

  const uploadClothingImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const { imageUrl } = await apiFetch('/api/items/upload', { method: 'POST', body: formData })
    return imageUrl
  }, [])

  return (
    <WearContext.Provider value={{
      state, login, register, logout,
      addCloth, deleteCloth, updateCloth,
      addOutfit, deleteOutfit, incCounts,
      updateUser, uploadAvatar, uploadClothingImage,
      isReady,
    }}>
      {children}
    </WearContext.Provider>
  )
}

export function useWear() {
  const ctx = useContext(WearContext)
  if (!ctx) throw new Error('useWear must be inside WearProvider')
  return ctx
}
