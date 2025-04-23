'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Save, Search, Filter } from 'lucide-react'
import type { ClothingItem, Currency, Season, Occasion, Outfit, Tag } from '@/app/models/types'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import OutfitBuilder from '@/app/components/OutfitBuilder'
import DraggableItem from '@/app/components/DraggableItem'
import PriceDisplay from '@/app/components/PriceDisplay'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// Dynamically import DndProvider
const DndProvider = dynamic(
  () => import('react-dnd').then(mod => mod.DndProvider),
  { ssr: false }
)

interface EditOutfitClientProps {
  initialOutfit: Outfit;
  initialAvailableItems: ClothingItem[];
  initialCurrency: Currency;
}

// Define categories constant
const categories = ['all', 'headwear', 'outerwear', 'tops', 'bottoms', 'shoes', 'accessories'] as const;

export default function EditOutfitClient({ 
  initialOutfit, 
  initialAvailableItems, 
  initialCurrency 
}: EditOutfitClientProps) {
  const router = useRouter()
  const [name, setName] = useState(initialOutfit.name || '')
  const [description, setDescription] = useState(initialOutfit.description || '')
  const [outfitSlots, setOutfitSlots] = useState<Record<string, ClothingItem | null>>({
    headwear: null,
    top: null,
    outerwear: null,
    bottom: null,
    shoes: null
  })
  const [accessories, setAccessories] = useState<ClothingItem[]>([])
  const [availableItems, setAvailableItems] = useState<ClothingItem[]>(initialAvailableItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>(initialOutfit.seasons || [])
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>(initialOutfit.occasions || [])
  const [tags, setTags] = useState<string[]>(initialOutfit.tags ? initialOutfit.tags.map((t: Tag) => t.name) : [])
  const [isPublic, setIsPublic] = useState(initialOutfit.isPublic || false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currency = initialCurrency // Use prop directly

  // Populate initial slots and accessories from initialOutfit
  useEffect(() => {
    const slots: Record<string, ClothingItem | null> = {
      headwear: null,
      top: null,
      outerwear: null,
      bottom: null,
      shoes: null
    };
    const outfitAccessories: ClothingItem[] = [];

    if (initialOutfit.items && Array.isArray(initialOutfit.items)) {
      initialOutfit.items.forEach(item => {
        if (!item.wardrobeItem) return;

        if (item.position.startsWith('accessory_')) {
          outfitAccessories.push(item.wardrobeItem);
        } else if (slots.hasOwnProperty(item.position)) { // Check if position is a valid slot
          slots[item.position] = item.wardrobeItem;
        }
      });
    }

    setOutfitSlots(slots);
    setAccessories(outfitAccessories);
  }, [initialOutfit.items]); // Depend only on items

  // Auto-dismiss error after 5 seconds or when user starts typing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Clear error when user starts typing name
  useEffect(() => {
    setError(null)
  }, [name])

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
      const response = await fetch(`/api/outfits/${initialOutfit.id}`, { // Use initialOutfit.id
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: outfitName.trim(),
          description,
          items,
          seasons: selectedSeasons.map(s => s.name),
          occasions: selectedOccasions.map(o => o.name),
          tags: tags,
          isPublic: isPublic
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update outfit')
      }
      
      // Navigate to the specific outfit page after successful save
      router.push(`/outfits/${initialOutfit.id}`)
      router.refresh() // Optional: force refresh if needed

    } catch (error) {
      console.error('Error updating outfit:', error)
      setError(error instanceof Error ? error.message : 'Failed to update outfit')
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

  const filteredItems = useMemo(() => {
    return availableItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availableItems, searchQuery, selectedCategory]);

  // No full page loading needed here as data is passed via props
  // Error handling specific to save operation is done within handleSave

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen pt-16 bg-background">
        <div className="max-w-7xl mx-auto p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 sm:gap-6">
            {/* Left Column - Catalog - Hidden on Mobile */}
            <div className="hidden lg:block">
              <div className="bg-card rounded-xl border border-border shadow-soft flex flex-col">
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
                        className="w-full pl-9 pr-4 py-2 bg-background rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent-purple text-sm"
                      />
                    </div>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-background rounded-lg border border-border hover:border-accent-purple transition-colors"
                      >
                        <DraggableItem item={item} currency={currency}>
                          <div className="text-white space-y-1">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xs opacity-75">{item.brand || 'No Brand'}</div>
                            <div className="text-sm font-semibold">
                              <PriceDisplay
                                amount={item.price}
                                currency={item.priceCurrency || 'INR'}
                                userCurrency={currency}
                                showOriginal={false}
                                showTooltip={true}
                              />
                            </div>
                          </div>
                        </DraggableItem>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Outfit Builder */}
            <div className="flex flex-col gap-4">
              <div className="bg-card rounded-xl border border-border shadow-soft p-3 sm:p-4">
                <h2 className="text-lg font-semibold mb-3">Edit Outfit</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Outfit Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-background rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-background rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none h-24"
                  />
                </div>
              </div>

              <OutfitBuilder
                slots={outfitSlots}
                accessories={accessories}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onAddAccessory={handleAddAccessory}
                onRemoveAccessory={handleRemoveAccessory}
                currency={currency}
                onSave={handleSave}
                isSaving={saving}
                initialName={name}
                initialDescription={description}
                onNameChange={setName}
                onDescriptionChange={setDescription}
                availableItems={initialAvailableItems}
              />

              <div className="bg-card rounded-xl border border-border shadow-soft p-3 sm:p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Total Cost</h3>
                  <div className="text-xl font-semibold">
                    <PriceDisplay
                      amount={Object.values(outfitSlots)
                        .filter((item): item is ClothingItem => item !== null)
                        .concat(accessories)
                        .reduce((sum, item) => sum + item.price, 0)}
                      currency={initialOutfit.costCurrency || 'INR'}
                      userCurrency={currency}
                      showOriginal={false}
                      showTooltip={true}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleSave(name)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
                {error && (
                  <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  )
} 