'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import type { Outfit, Currency, Season, Occasion, SeasonName, OccasionName } from '@/app/models/types'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import OutfitBuilder from '@/app/components/OutfitBuilder'
import { Search, Filter } from 'lucide-react'
import DraggableItem from '@/app/components/DraggableItem'

export default function EditOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [outfitSlots, setOutfitSlots] = useState<Record<string, any | null>>({
    headwear: null,
    top: null,
    outerwear: null,
    bottom: null,
    shoes: null
  })
  const [accessories, setAccessories] = useState<any[]>([])
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [availableItems, setAvailableItems] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [profileResponse, outfitResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch(`/api/outfits/${resolvedParams.id}`)
        ])

        if (!profileResponse.ok) throw new Error('Failed to fetch profile')
        const profileData = await profileResponse.json()
        setCurrency(profileData.currency || 'USD')

        if (!outfitResponse.ok) throw new Error('Failed to fetch outfit')
        const outfitData = await outfitResponse.json()
        setOutfit(outfitData)
        setName(outfitData.name)
        setDescription(outfitData.description || '')
        setSelectedSeasons(outfitData.seasons || [])
        setSelectedOccasions(outfitData.occasions || [])
        setSelectedTags(outfitData.tags?.map((t: any) => t.name) || [])

        // Set up outfit slots and accessories
        const slots: Record<string, any | null> = {
          headwear: null,
          top: null,
          outerwear: null,
          bottom: null,
          shoes: null
        }
        const accessoryItems: any[] = []

        outfitData.items.forEach((item: any) => {
          if (item.position.startsWith('accessory_')) {
            accessoryItems.push(item.wardrobeItem)
          } else {
            slots[item.position] = item.wardrobeItem
          }
        })

        setOutfitSlots(slots)
        setAccessories(accessoryItems)

        // Fetch available items
        const itemsResponse = await fetch('/api/items')
        if (!itemsResponse.ok) throw new Error('Failed to fetch items')
        const itemsData = await itemsResponse.json()
        setAvailableItems(itemsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load outfit')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  const handleSave = async (name: string) => {
    if (!outfit || saving) return
    setSaving(true)
    setError(null)

    try {
      const items = [
        ...Object.entries(outfitSlots)
          .filter(([_, item]) => item !== null)
          .map(([slot, item]) => ({
            wardrobeItemId: item.id,
            position: slot
          })),
        ...accessories.map((item, index) => ({
          wardrobeItemId: item.id,
          position: `accessory_${index}`
        }))
      ]

      if (items.length === 0) {
        setError('Please add at least one item to your outfit')
        return
      }

      const response = await fetch(`/api/outfits/${outfit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          items,
          seasons: selectedSeasons.map(season => season.name),
          occasions: selectedOccasions.map(occasion => occasion.name),
          tags: selectedTags.length > 0 ? selectedTags.map(tag => ({ name: tag })) : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update outfit')
      }
      router.push(`/outfits/${outfit.id}`)
    } catch (error) {
      console.error('Error updating outfit:', error)
      setError(error instanceof Error ? error.message : 'Failed to update outfit')
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = (item: any, slot: string) => {
    setOutfitSlots(prev => ({
      ...prev,
      [slot]: item
    }))
  }

  const handleRemoveItem = (slot: string) => {
    setOutfitSlots(prev => ({
      ...prev,
      [slot]: null
    }))
  }

  const handleAddAccessory = (item: any) => {
    setAccessories(prev => [...prev, item])
  }

  const handleRemoveAccessory = (index: number) => {
    setAccessories(prev => prev.filter((_, i) => i !== index))
  }

  const filteredItems = availableItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) return (
    <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
      <LoadingSpinner text="Loading outfit..." />
    </div>
  )

  if (error) {
    return (
      <div className="min-h-screen pt-16 bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!outfit) return null

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-[2fr_3fr] gap-6">
            {/* Left Column - Catalog */}
            <div>
              <div className="bg-card rounded-xl border border-border shadow-soft flex flex-col h-[calc(100vh-11rem)]">
                <div className="p-4 border-b border-border">
                  <h2 className="text-lg font-semibold mb-3">Available Items</h2>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-9 h-9 text-sm w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="select h-9 text-sm flex-1"
                      >
                        <option value="all">All Categories</option>
                        <option value="headwear">Headwear</option>
                        <option value="tops">Tops</option>
                        <option value="outerwear">Outerwear</option>
                        <option value="bottoms">Bottoms</option>
                        <option value="shoes">Shoes</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner text="Loading items..." />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No items found
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {filteredItems.map(item => (
                        <DraggableItem key={item.id} item={item} currency={currency} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Outfit Builder */}
            <div className="bg-card rounded-xl border border-border shadow-soft h-[calc(100vh-11rem)]">
              <OutfitBuilder
                slots={outfitSlots}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                accessories={accessories}
                onAddAccessory={handleAddAccessory}
                onRemoveAccessory={handleRemoveAccessory}
                currency={currency}
                onSave={handleSave}
                isSaving={saving}
                initialName={name}
                initialDescription={description}
                initialSeasons={selectedSeasons}
                initialOccasions={selectedOccasions}
                initialTags={selectedTags}
                onNameChange={setName}
                onDescriptionChange={setDescription}
                onSeasonsChange={setSelectedSeasons}
                onOccasionsChange={setSelectedOccasions}
                onTagsChange={setSelectedTags}
              />
            </div>
          </div>
        </DndProvider>

        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}
      </div>
    </div>
  )
} 