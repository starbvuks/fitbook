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
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search wardrobe..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input pl-9 h-9 text-sm w-full"
                        />
                      </div>
                      <div className="w-1/3">
                        <Select
                          value={selectedCategory}
                          onValueChange={(value) => setSelectedCategory(value)}
                        >
                          <SelectTrigger className="h-9 text-sm w-full">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent className="font-sans">
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat} className="capitalize">
                                {cat === 'all' ? 'All Categories' : cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-y-auto p-3 sm:p-4 max-h-[calc(100vh-16rem)]">
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    {filteredItems.map(item => (
                      <DraggableItem key={item.id} item={item} currency={currency} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Builder */}
            <div className="bg-card rounded-xl border border-border shadow-soft h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)]">
              <OutfitBuilder
                initialName={name}
                onNameChange={setName}
                slots={outfitSlots}
                accessories={accessories}
                initialSeasons={selectedSeasons}
                initialOccasions={selectedOccasions}
                initialTags={tags}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onAddAccessory={handleAddAccessory}
                onRemoveAccessory={handleRemoveAccessory}
                onSeasonsChange={setSelectedSeasons}
                onOccasionsChange={setSelectedOccasions}
                onTagsChange={setTags}
                onSave={handleSave}
                isSaving={saving}
                currency={currency}
                initialDescription={description}
                onDescriptionChange={setDescription}
                initialIsPublic={isPublic}
                onIsPublicChange={setIsPublic}
                availableItems={initialAvailableItems}
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