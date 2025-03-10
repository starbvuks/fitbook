'use client'

import { useState } from 'react'
import type { ClothingItem, ClothingCategory, Season, Occasion } from '@/app/models/types'
import ColorPalette from './ColorPalette'
import ImageUpload from './ImageUpload'
import type { UploadResult } from '@/lib/images'
import Image from 'next/image'
import { X, ShoppingCart, BookmarkPlus } from 'lucide-react'

interface AddItemFormProps {
  onSubmit: (item: Omit<ClothingItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  category: ClothingCategory
}

interface FormData {
  name: string
  category: ClothingCategory
  brand: string
  price: string
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
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
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

export default function AddItemForm({ onSubmit, onCancel, category }: AddItemFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category,
    brand: '',
    price: '',
    purchaseUrl: '',
    size: '',
    material: '',
    condition: 'new',
    isOwned: true,
    seasons: [],
    occasions: [],
    tags: [],
    notes: '',
    images: [],
  })

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name) {
      setError('Name is required')
      return
    }

    const item = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand || undefined,
      price: formData.price ? parseFloat(formData.price) : 0,
      purchaseUrl: formData.purchaseUrl || undefined,
      size: formData.size || undefined,
      material: formData.material || undefined,
      condition: formData.condition,
      isOwned: formData.isOwned,
      seasons: formData.seasons,
      occasions: formData.occasions,
      tags: formData.tags.map(tag => ({
        id: crypto.randomUUID(),
        name: tag
      })),
      notes: formData.notes || undefined,
      images: formData.images.map(image => ({
        id: crypto.randomUUID(),
        url: image.url,
        publicId: image.publicId,
        colors: image.colors || [],
        isPrimary: image === formData.images[0]
      }))
    }

    onSubmit(item)
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
      images: prev.images.filter((_, i) => i !== index),
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
              onUploadSuccess={(result) => handleImageUpload(result)}
              onUploadError={(error) => setError(error.message)}
            />
          </FormSection>

          <FormSection title="Basic Information">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 p-4 bg-background-soft rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isOwned: true })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    formData.isOwned
                      ? 'bg-green-100 text-green-600'
                      : 'bg-background text-foreground-soft'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>I Own This</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isOwned: false })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    !formData.isOwned
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-background text-foreground-soft'
                  }`}
                >
                  <BookmarkPlus className="w-5 h-5" />
                  <span>I Want This</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ClothingCategory })}
                  className="select h-9 text-sm w-full"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input h-9 text-sm w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="input h-9 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input h-9 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Purchase URL</label>
                <input
                  type="url"
                  value={formData.purchaseUrl}
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
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
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="input h-9 text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Material</label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="input h-9 text-sm w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="select h-9 text-sm w-full"
              >
                {conditions.map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>
          </FormSection>

          <FormSection title="Categories">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Seasons</label>
                <div className="grid grid-cols-2 gap-2">
                  {seasons.map((season) => (
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
                          : 'bg-background-soft text-foreground-soft'
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
                  {occasions.map((occasion) => (
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
                          : 'bg-background-soft text-foreground-soft'
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
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                placeholder="Enter tags separated by commas"
                className="input h-9 text-sm w-full"
              />
            </div>
          </FormSection>

          <FormSection title="Additional Information">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
        >
          Add Item
        </button>
      </div>
    </form>
  )
} 