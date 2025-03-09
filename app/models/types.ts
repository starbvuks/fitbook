export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'CAD' | 'AUD'

export type ClothingCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories'

export interface Color {
  hex: string
  prevalence: number
  name?: string
}

export interface Image {
  id: string
  url: string
  publicId: string
  isPrimary: boolean
  colors: Color[]
}

export interface Tag {
  id: string
  name: string
}

export interface Season {
  id: string
  name: string
}

export interface Occasion {
  id: string
  name: string
}

export interface ClothingItem {
  id: string
  name: string
  category: ClothingCategory
  brand?: string | null
  price: number
  purchaseUrl?: string | null
  size?: string | null
  material?: string | null
  condition?: string | null
  isOwned: boolean
  notes?: string | null
  images: Image[]
  tags: Tag[]
  seasons: Season[]
  occasions: Occasion[]
  createdAt: string
  updatedAt: string
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

export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  currency: Currency
  language: string
  darkMode: boolean
}

export interface UserProfile extends User {
  bio?: string | null
  location?: string | null
  website?: string | null
  instagram?: string | null
  pinterest?: string | null
  tiktok?: string | null
  emailNotifications: boolean
  publicProfile: boolean
  totalSpent: number
  featuredOutfits: string[]
  featuredLookbook?: string | null
} 