'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Save, Search, Filter } from 'lucide-react'
import type { ClothingItem, Currency, Season, Occasion } from '@/app/models/types'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import OutfitBuilder from '@/app/components/OutfitBuilder'
import DraggableItem from '@/app/components/DraggableItem'

export default function CreateOutfitPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [outfitSlots, setOutfitSlots] = useState<Record<string, ClothingItem | null>>({
    headwear: null,
    top: null,
    outerwear: null,
    bottom: null,
    shoes: null
  })
  const [accessories, setAccessories] = useState<ClothingItem[]>([])
  const [availableItems, setAvailableItems] = useState<ClothingItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [profileResponse, itemsResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/items')
        ])

        if (!profileResponse.ok) throw new Error('Failed to fetch profile')
        const profileData = await profileResponse.json()
        setCurrency(profileData.currency || 'USD')

        if (!itemsResponse.ok) throw new Error('Failed to fetch items')
        const itemsData = await itemsResponse.json()
        setAvailableItems(itemsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSave = async () => {
    if (!name) {
      setError('Please enter an outfit name')
      return
    }

    const items = [
      ...Object.entries(outfitSlots)
        .filter(([_, item]) => item !== null)
        .map(([slot, item]) => ({
          wardrobeItemId: item!.id,
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

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          items,
          seasons: selectedSeasons,
          occasions: selectedOccasions
        })
      })

      if (!response.ok) throw new Error('Failed to create outfit')
      const outfit = await response.json()
      router.push(`/outfits/${outfit.id}`)
    } catch (error) {
      console.error('Error creating outfit:', error)
      setError(error instanceof Error ? error.message : 'Failed to create outfit')
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = (item: ClothingItem, slot: string) => {
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

  const handleAddAccessory = (item: ClothingItem) => {
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen pt-16 bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-[2fr_3fr] gap-6">
            {/* Left Column - Catalog */}
            <div>
              <div className="mb-6">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter outfit name..."
                  className="text-2xl font-display font-bold bg-transparent border-b-2 border-border focus:border-primary focus:outline-none transition-colors w-96 placeholder:text-muted-foreground"
                />
              </div>

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
            <div className="bg-card rounded-xl border border-border shadow-soft h-[calc(100vh-6rem)]">
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
              />
            </div>
          </div>

          {error && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
} 