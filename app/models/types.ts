export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'CAD' | 'AUD'

export type ClothingCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories' | 'headwear'

export type SeasonName = 'spring' | 'summer' | 'fall' | 'winter'
export type OccasionName = 'casual' | 'formal' | 'business' | 'party' | 'sport' | 'beach' | 'evening' | 'wedding'

export interface Color {
  hex: string
  prevalence: number
  name?: string
}

export interface Image {
  id: string
  url: string
  publicId: string
  colors: Color[]
  isPrimary: boolean
}

export interface Tag {
  id: string
  name: string
}

export interface Season {
  id: string
  name: SeasonName
}

export interface Occasion {
  id: string
  name: OccasionName
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
  notes?: string
  images: Image[]
  tags: Tag[]
  seasons: Season[]
  occasions: Occasion[]
  createdAt: Date
  updatedAt: Date
}

export interface OutfitItem {
  id: string
  outfitId: string
  wardrobeItemId: string
  position: string
  wardrobeItem?: ClothingItem
}

export interface Outfit {
  id: string
  name: string
  description?: string
  totalCost: number
  rating?: number
  createdAt: string
  updatedAt: string
  userId: string
  user?: User
  items: OutfitItem[]
  seasons: Season[]
  occasions: Occasion[]
  tags: Tag[]
  stats?: {
    timesWorn: number
  }
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
  stats?: {
    itemCount: number
    outfitCount: number
    lookbookCount: number
    totalSpent: number
    mostExpensiveItem: number
  }
} 