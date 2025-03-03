'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OutfitBuilder from '@/app/components/OutfitBuilder'
import OutfitAnalysis from '@/app/components/OutfitAnalysis'
import type { ClothingItem } from '@/app/models/types'

export default function CreateOutfitPage() {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [rating, setRating] = useState<number>(0)
  const [seasons, setSeasons] = useState<string[]>([])
  const [occasions, setOccasions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          items: selectedItems.map((item, index) => ({
            wardrobeItemId: item.id,
            position: `position_${index + 1}`,
          })),
          tags,
          rating,
          seasons,
          occasions,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create outfit')
      }

      router.push('/outfits')
    } catch (error) {
      console.error('Error creating outfit:', error)
      setError(error instanceof Error ? error.message : 'Failed to create outfit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Create New Outfit</h1>
          <p className="text-foreground-soft">Build your perfect outfit combination</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Outfit Builder */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 text-red-500 bg-red-50 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-background rounded-lg border border-border p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Summer Beach Day"
                    required
                    className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Perfect for a casual day at the beach..."
                    rows={3}
                    className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <input
                    type="text"
                    value={tags.join(', ')}
                    onChange={e => setTags(e.target.value.split(',').map(tag => tag.trim()))}
                    placeholder="casual, summer, beach"
                    className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Seasons</label>
                    <select
                      multiple
                      value={seasons}
                      onChange={e => setSeasons(Array.from(e.target.selectedOptions, option => option.value))}
                      className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    >
                      <option value="spring">Spring</option>
                      <option value="summer">Summer</option>
                      <option value="fall">Fall</option>
                      <option value="winter">Winter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Occasions</label>
                    <select
                      multiple
                      value={occasions}
                      onChange={e => setOccasions(Array.from(e.target.selectedOptions, option => option.value))}
                      className="w-full px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    >
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                      <option value="work">Work</option>
                      <option value="party">Party</option>
                      <option value="sport">Sport</option>
                      <option value="beach">Beach</option>
                      <option value="evening">Evening</option>
                      <option value="wedding">Wedding</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl ${
                          star <= rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <OutfitBuilder onOutfitChange={setSelectedItems} />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || selectedItems.length === 0}
                  className="px-6 py-3 bg-accent-purple text-white rounded-lg font-medium hover:bg-accent-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Outfit'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Outfit Analysis */}
          <div>
            <OutfitAnalysis items={selectedItems} />
          </div>
        </div>
      </div>
    </div>
  )
} 