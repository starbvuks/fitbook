'use client'

import { useState, useEffect } from 'react'
import type { ClothingItem, ClothingCategory, Season, Occasion, Currency } from '@/app/models/types'
import ColorPalette from './ColorPalette'
import ImageUpload from './ImageUpload'
import type { UploadResult } from '@/lib/images'
import Image from 'next/image'
import { X, ShoppingCart, CircleCheck } from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import PriceDisplay from './PriceDisplay'

interface AddItemFormProps {
  onSubmit: (formData: any) => void
  onCancel: () => void
  category: ClothingCategory
}

interface FormData {
  name: string
  category: ClothingCategory
  brand: string
  price: string
  priceCurrency: Currency
  purchaseUrl: string
  size: string
  material: string
  condition: string
  isOwned: boolean
  seasons: Season[]
  occasions: Occasion[]
  tags: string[]
  notes: string
  images: UploadResult[]
}

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="bg-background rounded-xl border border-border p-6">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

const categories: ClothingCategory[] = [
  'headwear',
  'outerwear',
  'tops',
  'bottoms',
  'shoes',
  'accessories'
]

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const seasons: Season[] = [
  { id: 'spring', name: 'spring' },
  { id: 'summer', name: 'summer' },
  { id: 'fall', name: 'fall' },
  { id: 'winter', name: 'winter' }
]

const occasions: Occasion[] = [
  { id: 'casual', name: 'casual' },
  { id: 'formal', name: 'formal' },
  { id: 'business', name: 'business' },
  { id: 'party', name: 'party' },
  { id: 'sport', name: 'sport' },
  { id: 'beach', name: 'beach' },
  { id: 'evening', name: 'evening' },
  { id: 'wedding', name: 'wedding' }
]

const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD']

export default function AddItemForm({ onSubmit, onCancel, category }: AddItemFormProps) {
  const [userCurrency, setUserCurrency] = useState<Currency>('INR')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: category || 'headwear',
    brand: '',
    price: '',
    priceCurrency: 'INR',
    purchaseUrl: '',
    size: '',
    material: '',
    condition: 'new',
    isOwned: true,
    seasons: [],
    occasions: [],
    tags: [],
    notes: '',
    images: []
  })

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch user's currency preference
  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          const currency = data.currency || 'INR'
          setUserCurrency(currency)
          setFormData(prev => ({ ...prev, priceCurrency: currency }))
        }
      } catch (error) {
        console.error('Error fetching user currency:', error)
      }
    }

    fetchUserCurrency()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name) {
      setError('Name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const item = {
        name: formData.name,
        category: formData.category,
        brand: formData.brand || undefined,
        price: formData.price ? parseFloat(formData.price) : 0,
        priceCurrency: formData.priceCurrency,
        purchaseUrl: formData.purchaseUrl || undefined,
        size: formData.size || undefined,
        material: formData.material || undefined,
        condition: formData.condition,
        isOwned: formData.isOwned,
        seasons: formData.seasons.map(season => season.name),
        occasions: formData.occasions.map(occasion => occasion.name),
        tags: formData.tags,
        notes: formData.notes || undefined,
        images: formData.images.map(image => ({
          url: image.url,
          publicId: image.publicId,
          colors: image.colors || [],
          isPrimary: image === formData.images[0]
        }))
      }

      onSubmit(item)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (result: UploadResult) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, result],
    }))
  }

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i: number) => i !== index),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
      {error && (
        <div className="p-4 mb-6 text-red-500 bg-red-50 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <FormSection title="Images">
            <ImageUpload
              onUploadSuccess={(result: UploadResult) => handleImageUpload(result)}
              onUploadError={(error: Error) => setError(error.message)}
            />
            
            {/* Display uploaded images */}
            {formData.images.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-3">Uploaded Images ({formData.images.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={image.url}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FormSection>

          <FormSection title="Basic Information">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 py-4 bg-background-soft rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isOwned: true })}
                  className={`flex items-center gap-2 md:px-4 md:py-2 px-2 py-1.5 rounded-lg transition-colors ${
                    formData.isOwned
                      ? 'bg-green-100 text-green-600'
                      : 'bg-background text-foreground-soft'
                  }`}
                >
                  <CircleCheck className="w-5 h-5" />
                  <span>I Own This</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isOwned: false })}
                  className={`flex items-center gap-2 md:px-4 md:py-2 px-2 py-1.5 rounded-lg transition-colors ${
                    !formData.isOwned
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-background text-foreground-soft'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Want to Buy</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ClothingCategory) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="font-sans">
                    {categories.map((cat: ClothingCategory) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  className="input h-9 text-sm w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Brand</label>
                <input
                  type="text"
                  id="brand"
                  value={formData.brand}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, brand: e.target.value })}
                  className="input h-9 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Price</label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: e.target.value })}
                  className="input h-9 text-sm w-full"
                  step="0.01"
                  placeholder="Enter price"
                />
                {formData.price && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">Preview: </span>
                    <PriceDisplay
                      amount={parseFloat(formData.price)}
                      currency={formData.priceCurrency}
                      userCurrency="USD" // You might want to get this from user profile
                      showTooltip={true}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Price Currency</label>
                <Select
                  value={formData.priceCurrency}
                  onValueChange={(value: Currency) => setFormData({ ...formData, priceCurrency: value })}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent className="font-sans">
                    {currencies.map((currency: Currency) => (
                      <SelectItem key={currency} value={currency} className="capitalize">
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Purchase URL</label>
                <input
                  type="url"
                  id="purchaseUrl"
                  value={formData.purchaseUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                  placeholder="https://"
                  className="input h-9 text-sm w-full"
                />
              </div>
            </div>
          </FormSection>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <FormSection title="Details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Size</label>
                <input
                  type="text"
                  id="size"
                  value={formData.size}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, size: e.target.value })}
                  className="input h-9 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Material</label>
                <input
                  type="text"
                  id="material"
                  value={formData.material}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, material: e.target.value })}
                  className="input h-9 text-sm w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Condition</label>
              <Select
                value={formData.condition}
                onValueChange={(value: string) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
                <SelectContent className="font-sans">
                  {conditions.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          <FormSection title="Categories">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Seasons</label>
                <div className="grid grid-cols-2 gap-2">
                  {seasons.map((season: Season) => (
                    <button
                      key={season.id}
                      type="button"
                      onClick={() => {
                        const newSeasons = formData.seasons.includes(season)
                          ? formData.seasons.filter(s => s.id !== season.id)
                          : [...formData.seasons, season]
                        setFormData({ ...formData, seasons: newSeasons })
                      }}
                      className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                        formData.seasons.some(s => s.id === season.id)
                          ? 'bg-accent-purple text-white'
                          : 'bg-accent-purple/10 text-foreground-soft'
                      } hover:bg-accent-purple-dark`}
                    >
                      <span className="capitalize">{season.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Occasions</label>
                <div className="grid grid-cols-2 gap-2">
                  {occasions.map((occasion: Occasion) => (
                    <button
                      key={occasion.id}
                      type="button"
                      onClick={() => {
                        const newOccasions = formData.occasions.includes(occasion)
                          ? formData.occasions.filter(o => o.id !== occasion.id)
                          : [...formData.occasions, occasion]
                        setFormData({ ...formData, occasions: newOccasions })
                      }}
                      className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                        formData.occasions.some(o => o.id === occasion.id)
                          ? 'bg-accent-purple text-white'
                          : 'bg-accent-purple/10 text-foreground-soft'
                      } hover:bg-accent-purple-dark`}
                    >
                      <span className="capitalize">{occasion.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Tags">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags</label>
              
              {/* Display existing tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-accent-purple text-white flex items-center gap-1 group"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tags: prev.tags.filter((_, i) => i !== index)
                        }))
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              <input
                type="text"
                id="tags"
                placeholder="Enter tags, separated by commas"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === ',' || e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.currentTarget
                    const value = input.value.trim()
                    if (value && !formData.tags.includes(value)) {
                      setFormData(prev => ({
                        ...prev,
                        tags: [...prev.tags, value]
                      }))
                      input.value = ''
                    }
                  }
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const value = e.target.value.trim()
                  if (value && !formData.tags.includes(value)) {
                    setFormData(prev => ({
                      ...prev,
                      tags: [...prev.tags, value]
                    }))
                    e.target.value = ''
                  }
                }}
                className="input h-9 text-sm w-full"
              />
            </div>
          </FormSection>

          <FormSection title="Additional Information">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="input text-sm w-full min-h-[80px] resize-none"
              />
            </div>
          </FormSection>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-foreground-soft hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Item'}
        </button>
      </div>
    </form>
  )
} 