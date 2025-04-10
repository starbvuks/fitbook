import { z } from 'zod'
import { ClothingCategory } from '@/app/models/types'

export const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(['headwear','tops', 'bottoms', 'outerwear', 'shoes', 'accessories'] as const),
  brand: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be positive").nullable().optional(),
  purchaseUrl: z.string().url().nullable().optional(),
  size: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  isOwned: z.boolean(),
  notes: z.string().nullable().optional(),
  images: z.array(z.object({
    id: z.string(),
    url: z.string(),
    publicId: z.string(),
    isPrimary: z.boolean(),
    colors: z.array(z.object({
      hex: z.string(),
      prevalence: z.number(),
      name: z.string().optional()
    }))
  })).default([]),
  tags: z.array(z.string()).default([]),
  seasons: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([])
})

export const updateItemSchema = itemSchema.partial() 