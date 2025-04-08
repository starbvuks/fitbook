'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Save, Search, Filter } from 'lucide-react'
import type { ClothingItem, Currency, Season, Occasion, Outfit } from '@/app/models/types'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import OutfitBuilder from '@/app/components/OutfitBuilder'
import DraggableItem from '@/app/components/DraggableItem'

// Dynamically import DndProvider
const DndProvider = dynamic(
  () => import('react-dnd').then(mod => mod.DndProvider),
  { ssr: false }
)

interface EditOutfitPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditOutfitPage({ params }: EditOutfitPageProps) {
  const resolvedParams = use(params)
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

        const [profileResponse, itemsResponse, outfitResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/items'),
          fetch(`/api/outfits/${resolvedParams.id}`)
        ])

        if (!profileResponse.ok) throw new Error('Failed to fetch profile')
        const profileData = await profileResponse.json()
        setCurrency(profileData.currency || 'USD')

        if (!itemsResponse.ok) throw new Error('Failed to fetch items')
        const itemsData = await itemsResponse.json()
        setAvailableItems(itemsData)

        if (!outfitResponse.ok) throw new Error('Failed to fetch outfit')
        const outfitData: Outfit = await outfitResponse.json()
        
        // Set outfit data
        setName(outfitData.name)
        setDescription(outfitData.description || '')
        setSelectedSeasons(outfitData.seasons)
        setSelectedOccasions(outfitData.occasions)

        // Organize items into slots and accessories
        const slots: Record<string, ClothingItem | null> = {
          headwear: null,
          top: null,
          outerwear: null,
          bottom: null,
          shoes: null
        }
        const outfitAccessories: ClothingItem[] = []

        outfitData.items.forEach(item => {
          if (!item.wardrobeItem) return

          if (item.position.startsWith('accessory_')) {
            outfitAccessories.push(item.wardrobeItem)
          } else {
            slots[item.position] = item.wardrobeItem
          }
        })

        setOutfitSlots(slots)
        setAccessories(outfitAccessories)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  const handleSave = async (outfitName: string) => {
    if (!outfitName.trim()) {
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
      const response = await fetch(`/api/outfits/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: outfitName.trim(),
          description,
          items,
          seasons: selectedSeasons,
          occasions: selectedOccasions
        })
      })

      if (!response.ok) throw new Error('Failed to update outfit')
      
      router.push('/outfits')
    } catch (error) {
      console.error('Error updating outfit:', error)
      setError(error instanceof Error ? error.message : 'Failed to update outfit')
      throw error
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

  if (error && !loading) {
    return (
      <div className="min-h-screen pt-16 bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.refresh()}
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
        <div className="max-w-7xl mx-auto p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 sm:gap-6">
            {/* Left Column - Catalog - Hidden on Mobile */}
            <div className="hidden lg:block">
              <div className="bg-card rounded-xl border border-border shadow-soft flex flex-col h-[calc(100vh-8rem)] sm:h-full">
                <div className="p-3 sm:p-4 border-b border-border">
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

                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner text="Loading items..." />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No items found
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                      {filteredItems.map(item => (
                        <DraggableItem key={item.id} item={item} currency={currency} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Outfit Builder - Full Width on Mobile */}
            <div className="bg-card rounded-xl border border-border shadow-soft h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)]">
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
                onNameChange={setName}
                onDescriptionChange={setDescription}
                onSeasonsChange={setSelectedSeasons}
                onOccasionsChange={setSelectedOccasions}
                availableItems={availableItems}
              />
            </div>
          </div>

          {error && saving && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg border border-destructive/20 max-w-[90%] sm:max-w-md text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
} 