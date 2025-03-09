import { z } from 'zod'
import { Currency } from '@/app/models/types'

export const userProfileSchema = z.object({
  name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  instagram: z.string().nullable().optional(),
  pinterest: z.string().nullable().optional(),
  tiktok: z.string().nullable().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD'] as const),
  language: z.string(),
  darkMode: z.boolean(),
  emailNotifications: z.boolean(),
  publicProfile: z.boolean()
})

export const updateUserProfileSchema = userProfileSchema.partial() 