export type ClothingCategory = 
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories'

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'CAD' | 'AUD'

export type Season = 'spring' | 'summer' | 'fall' | 'winter'

export type Occasion = 
  | 'casual'
  | 'formal'
  | 'business'
  | 'party'
  | 'sport'
  | 'beach'
  | 'evening'
  | 'wedding'

export interface Color {
  hex: string
  prevalence: number
}

export interface Image {
  url: string
  publicId: string
  colors: Color[]
  isPrimary: boolean
}

export interface ClothingItem {
  id: string
  userId: string
  name: string
  category: ClothingCategory
  brand?: string
  price: number
  purchaseUrl?: string
  size?: string
  material?: string
  condition?: string
  isOwned: boolean
  seasons: Season[]
  occasions: Occasion[]
  tags: string[]
  notes?: string
  images: Image[]
  createdAt: Date
  updatedAt: Date
}

export interface OutfitItem {
  id: string
  outfitId: string
  wardrobeItemId: string
  position: string
  wardrobeItem: ClothingItem
}

export interface Outfit {
  id: string
  userId: string
  name: string
  description?: string
  items: OutfitItem[]
  tags: string[]
  occasions: Occasion[]
  seasons: Season[]
  rating?: number
  totalCost: number
  stats?: {
    timesWorn: number
    lastWorn?: Date
    favorited: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface Lookbook {
  id: string
  userId: string
  name: string
  description?: string
  outfits: Outfit[]
  tags: string[]
  isPublic: boolean
  stats?: {
    views: number
    likes: number
    shares: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  name: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  location: string | null
  website: string | null
  instagram: string | null
  pinterest: string | null
  tiktok: string | null
  currency: Currency
  language: string
  emailNotifications: boolean
  publicProfile: boolean
  darkMode: boolean
  stats: {
    totalSpent: number
    itemCount: number
    outfitCount: number
    lookbookCount: number
    mostExpensiveItem: number
  }
  createdAt: Date
  updatedAt: Date
} 