import { z } from 'zod'

const seasonEnum = z.enum(['spring', 'summer', 'fall', 'winter'])

const occasionEnum = z.enum([
  'casual',
  'formal',
  'business',
  'party',
  'sport',
  'beach',
  'evening',
  'wedding',
])

export const colorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-F]{6}$/i),
  prevalence: z.number().min(0).max(1),
})

export const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
  colors: z.array(colorSchema),
  isPrimary: z.boolean().default(false),
})

export const wardrobeItemSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']),
  brand: z.string().optional(),
  price: z.number().min(0),
  size: z.string().optional(),
  material: z.string().optional(),
  condition: z.string().optional(),
  isOwned: z.boolean().default(true),
  notes: z.string().optional(),
  images: z.array(imageSchema).min(1),
  tags: z.array(z.string()),
  seasons: z.array(seasonEnum),
  occasions: z.array(occasionEnum),
})

export const outfitItemSchema = z.object({
  wardrobeItemId: z.string(),
  position: z.string(),
})

export const outfitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  items: z.array(z.object({
    wardrobeItemId: z.string(),
    position: z.string()
  })),
  tags: z.array(z.string()).default([]),
  rating: z.number().min(1).max(5).optional(),
  seasons: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([])
})

export const updateOutfitSchema = outfitSchema.partial()

export const lookbookSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  outfitIds: z.array(z.string()),
})

export const profileSchema = z.object({
  name: z.string().nullable(),
  username: z.string().nullable(),
  email: z.string().email(),
  image: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().nullable(),
  instagram: z.string().nullable(),
  pinterest: z.string().nullable(),
  tiktok: z.string().nullable(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD']),
  language: z.string(),
  emailNotifications: z.boolean(),
  publicProfile: z.boolean(),
  darkMode: z.boolean(),
}) 