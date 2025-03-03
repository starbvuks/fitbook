'use client'

import { useState } from 'react'
import type { ClothingItem, ClothingCategory, Season, Occasion } from '@/app/models/types'
import ColorPalette from './ColorPalette'
import ImageUpload from './ImageUpload'
import type { UploadResult } from '@/lib/images'
import Image from 'next/image'
import { X } from 'lucide-react'

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

const seasons: Season[] = ['spring', 'summer', 'fall', 'winter']
const occasions: Occasion[] = [
  'casual',
  'formal',
  'business',
  'party',
  'sport',
  'beach',
  'evening',
  'wedding'
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
      tags: formData.tags,
      notes: formData.notes || undefined,
      images: formData.images.map(image => ({
        url: image.url,
        publicId: image.publicId,
        colors: image.colors || [],
        isPrimary: image === formData.images[0]
      }))
    } as const

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
              <div className="flex items-center space-x-4 mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={formData.isOwned}
                    onChange={() => setFormData({ ...formData, isOwned: true })}
                    className="form-radio text-accent-purple focus:ring-accent-purple"
                  />
                  <span className="ml-2">I own this</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={!formData.isOwned}
                    onChange={() => setFormData({ ...formData, isOwned: false })}
                    className="form-radio text-accent-purple focus:ring-accent-purple"
                  />
                  <span className="ml-2">I want this</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ClothingCategory })}
                  className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
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
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Purchase URL</label>
                <input
                  type="url"
                  value={formData.purchaseUrl}
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                  placeholder="https://"
                  className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
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
                <label className="block text-sm font-medium mb-2">Size</label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Material</label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
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
                <label className="block text-sm font-medium mb-2">Seasons</label>
                <div className="grid grid-cols-2 gap-2">
                  {seasons.map((season) => (
                    <label
                      key={season}
                      className="flex items-center space-x-2 px-3 py-2 bg-background-soft rounded-lg cursor-pointer hover:bg-background-softer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.seasons.includes(season)}
                        onChange={(e) => {
                          const newSeasons = e.target.checked
                            ? [...formData.seasons, season]
                            : formData.seasons.filter(s => s !== season)
                          setFormData({ ...formData, seasons: newSeasons })
                        }}
                        className="rounded border-border text-accent-purple focus:ring-accent-purple"
                      />
                      <span className="capitalize">{season}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Occasions</label>
                <div className="grid grid-cols-2 gap-2">
                  {occasions.map((occasion) => (
                    <label
                      key={occasion}
                      className="flex items-center space-x-2 px-3 py-2 bg-background-soft rounded-lg cursor-pointer hover:bg-background-softer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.occasions.includes(occasion)}
                        onChange={(e) => {
                          const newOccasions = e.target.checked
                            ? [...formData.occasions, occasion]
                            : formData.occasions.filter(o => o !== occasion)
                          setFormData({ ...formData, occasions: newOccasions })
                        }}
                        className="rounded border-border text-accent-purple focus:ring-accent-purple"
                      />
                      <span className="capitalize">{occasion}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Tags">
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                placeholder="Enter tags separated by commas"
                className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
            </div>
          </FormSection>

          <FormSection title="Additional Information">
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
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