import * as z from "zod"

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50),
  username: z.string().min(2).max(30),
  bio: z.string().max(160).nullable(),
  location: z.string().max(30).nullable(),
  website: z.string().url().nullable().or(z.literal("")),
  instagram: z.string().max(30).nullable(),
  pinterest: z.string().max(30).nullable(),
  tiktok: z.string().max(30).nullable(),
  currency: z.enum(["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD"]),
  language: z.enum(["en", "hi", "es", "fr", "de", "ja"]),
  emailNotifications: z.boolean(),
  publicProfile: z.boolean(),
  darkMode: z.boolean(),
  image: z.string().nullable()
})

export type ProfileFormData = z.infer<typeof updateProfileSchema> 