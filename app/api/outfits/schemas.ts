import { z } from 'zod'

export const outfitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  items: z.array(z.object({
    wardrobeItemId: z.string(),
    position: z.string()
  })),
  tags: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([]),
  seasons: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).nullable().optional(),
})

export const updateOutfitSchema = outfitSchema.partial() 