export interface User {
  id: number
  name: string
  email: string
  username: string
  bio: string
  avatar: string | null
  generatedCount: number
  aiCount: number
  offlineCount: number
  prefOccasion: string
  prefSeason: string
  prefMood: string
  onboardingCompleted: boolean
}

export interface ClothingItem {
  id: number
  name: string
  category: 'top' | 'bottom' | 'dress' | 'outerwear' | 'footwear' | 'accessory'
  color: string
  season: 'all' | 'spring' | 'summer' | 'fall' | 'winter'
  occasion: 'casual' | 'work' | 'formal' | 'gym' | 'any'
  styleTag: string
  image: string | null
  addedAt: string
}

export interface Outfit {
  id: number
  name: string
  pieces: ClothingItem[]
  occasion: string
  season: string
  mode: 'ai' | 'offline'
  savedAt: string
}

export interface AppState {
  user: User | null
  clothes: ClothingItem[]
  outfits: Outfit[]
  generatedCount: number
  aiCount: number
  offlineCount: number
}

export type GeneratorMode = 'ai' | 'offline'
export type Occasion = 'casual' | 'work' | 'date' | 'formal' | 'gym' | 'travel'
export type Season = 'all' | 'spring' | 'summer' | 'fall' | 'winter'
export type ColorStrategy = 'harmony' | 'neutral' | 'monochrome' | 'contrast' | 'earth'
export type StyleMood = 'balanced' | 'minimal' | 'bold' | 'classic'

export interface GenOptions {
  occ: Occasion
  season: Season
  palette: ColorStrategy
  mood: StyleMood
}
