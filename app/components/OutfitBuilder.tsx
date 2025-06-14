'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useDrop } from 'react-dnd'
import Image from 'next/image'
import { X, Save, ShoppingCart, CircleCheck, Plus, List, Grid, DollarSign, Search } from 'lucide-react'
import type { ClothingItem, Currency, Season, Occasion, SeasonName, OccasionName } from '@/app/models/types'
import { formatPrice, cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import PriceDisplay from './PriceDisplay'
import { getDominantCurrency } from '@/lib/currency'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type ClothingItemWithPosition = ClothingItem & { position?: string }

export interface OutfitBuilderProps {
  slots: Record<string, ClothingItem | null>
  onAddItem: (item: ClothingItem, slot: string) => void
  onRemoveItem: (slot: string) => void
  accessories: ClothingItemWithPosition[]
  onAddAccessory: (item: ClothingItemWithPosition) => void
  onRemoveAccessory: (index: number) => void
  currency: Currency
  onSave: (name: string) => Promise<void>
  isSaving: boolean
  initialName?: string
  initialDescription?: string
  initialSeasons?: Season[]
  initialOccasions?: Occasion[]
  initialTags?: string[]
  onNameChange?: (name: string) => void
  onDescriptionChange?: (description: string) => void
  onSeasonsChange?: (seasons: Season[]) => void
  onOccasionsChange?: (occasions: Occasion[]) => void
  onTagsChange?: (tags: string[]) => void
  initialIsPublic?: boolean
  onIsPublicChange?: (isPublic: boolean) => void
  availableItems?: ClothingItem[]
}

const SLOT_LABELS = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  headwear: 'Headwear',
  accessory: 'Accessory'
} as const

type OutfitSlot = keyof typeof SLOT_LABELS

export default function OutfitBuilder({
  slots,
  onAddItem,
  onRemoveItem,
  accessories,
  onAddAccessory,
  onRemoveAccessory,
  currency,
  onSave,
  isSaving,
  initialName = '',
  initialDescription = '',
  initialSeasons = [],
  initialOccasions = [],
  initialTags = [],
  onNameChange,
  onDescriptionChange,
  onSeasonsChange,
  onOccasionsChange,
  onTagsChange,
  initialIsPublic = false,
  onIsPublicChange,
  availableItems = []
}: OutfitBuilderProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [outfitName, setOutfitName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [seasons, setSeasons] = useState<Season[]>(initialSeasons)
  const [occasions, setOccasions] = useState<Occasion[]>(initialOccasions)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isItemPickerOpen, setIsItemPickerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<HTMLDivElement | null>(null)
  const [availablePickerItems, setAvailablePickerItems] = useState<ClothingItem[]>([])

  // Update local name when initialName changes
  useEffect(() => {
    if (initialName !== outfitName) {
      setOutfitName(initialName);
    }
  }, [initialName]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update parent state when local state changes
  useEffect(() => {
    if (onNameChange) onNameChange(outfitName)
  }, [outfitName, onNameChange])

  useEffect(() => {
    if (onDescriptionChange) onDescriptionChange(description)
  }, [description, onDescriptionChange])

  useEffect(() => {
    if (onSeasonsChange) onSeasonsChange(seasons)
  }, [seasons, onSeasonsChange])

  useEffect(() => {
    if (onOccasionsChange) onOccasionsChange(occasions)
  }, [occasions, onOccasionsChange])

  useEffect(() => {
    if (onTagsChange) onTagsChange(tags)
  }, [tags, onTagsChange])

  useEffect(() => {
    if (onIsPublicChange) onIsPublicChange(isPublic)
  }, [isPublic, onIsPublicChange])

  const [{ isOver }, dropRef] = useDrop<ClothingItemWithPosition, void, { isOver: boolean }>(() => ({
    accept: 'CLOTHING_ITEM',
    hover: (item, monitor) => {
      if (isMobile) return // Disable hover effects on mobile
      if (item.category === 'accessories') {
        const targetSlot = getTargetSlot(monitor.getClientOffset()?.y)
        setHoveredSlot(`${targetSlot}_accessory`)
      } else {
        const slot = item.category === 'tops' ? 'top' : 
                    item.category === 'bottoms' ? 'bottom' : 
                    item.category === 'headwear' ? 'headwear' :
                    item.category === 'outerwear' ? 'outerwear' :
                    item.category === 'shoes' ? 'shoes' : null
        setHoveredSlot(slot)
      }
    },
    drop: (item: ClothingItemWithPosition, monitor) => {
      if (isMobile) return // Disable drop on mobile
      if (item.category === 'accessories') {
        const targetSlot = getTargetSlot(monitor.getClientOffset()?.y)
        onAddAccessory({ ...item, position: targetSlot })
      } else {
        const slot = item.category === 'tops' ? 'top' : 
                    item.category === 'bottoms' ? 'bottom' : 
                    item.category === 'headwear' ? 'headwear' :
                    item.category === 'outerwear' ? 'outerwear' :
                    item.category === 'shoes' ? 'shoes' : null
        if (slot) onAddItem(item, slot)
      }
      setHoveredSlot(null)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }))

  // Helper function to determine which slot the accessory is being dropped into
  const getTargetSlot = (y: number | undefined): string => {
    if (!y) return 'headwear'
    const slots = ['headwear', 'top', 'outerwear', 'bottom', 'shoes']
    const slotHeight = window.innerHeight / slots.length
    const index = Math.min(Math.floor((y - 100) / slotHeight), slots.length - 1)
    return slots[Math.max(0, index)]
  }

  const handleSlotClick = (slot: string) => {
    if (!isMobile) return
    setSelectedSlot(slot)
    setIsItemPickerOpen(true)
  }

  const handleItemSelect = (item: ClothingItem) => {
    if (!selectedSlot) return
    
    // Only accessories should have this restriction, not headwear
    if (selectedSlot === 'accessory' && item.category !== 'accessories') {
      setError('Only accessories can be added as accessories')
      return
    }
    
    if (selectedSlot === 'accessory') {
      onAddAccessory({ ...item, position: 'accessory' })
    } else {
      onAddItem(item, selectedSlot)
    }
    setIsItemPickerOpen(false)
    setSelectedSlot(null)
  }

  const totalCost = Object.values(slots)
    .filter((item): item is ClothingItem => item !== null)
    .reduce((sum: number, item: ClothingItem | null) => sum + (item?.price || 0), 0) +
    accessories.reduce((sum: number, item: ClothingItemWithPosition) => sum + item.price, 0)

  const ItemDisplay = ({ item, onRemove, isAccessory = false }: { 
    item: ClothingItem
    onRemove: () => void
    isAccessory?: boolean 
  }) => (
    <div className="relative h-full group">
      <div className={`flex h-full ${isAccessory ? 'w-full' : ''}`}>
        {/* Image container */}
        <div className={`relative ${isAccessory ? 'w-full h-full' : 'w-[100px] h-[96px] flex-shrink-0'}`}>
          <Image
            src={item.images[0].url}
            alt={item.name}
            fill
            className={`object-cover ${isAccessory ? 'rounded-lg' : 'rounded-l-lg'}`}
          />
        </div>
        
        {isAccessory ? (
          // Simple accessory hover overlay
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
            <div className="text-center px-2">
              <p className="text-white text-xs font-medium line-clamp-2">{item.name}</p>
              <div className="text-sm font-semibold text-white mt-1">
                <PriceDisplay
                  amount={item.price}
                  currency={item.priceCurrency || 'INR'}
                  userCurrency={currency}
                  showOriginal={false}
                  showTooltip={true}
                />
              </div>
            </div>
            <button
              onClick={onRemove}
              className="absolute top-1 right-1 btn btn-ghost h-6 w-6 p-0 bg-black/40 hover:bg-black/60"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          // Main item details - always visible
          <div className="flex-1 bg-background-soft/80 p-2 rounded-r-lg">
            <div className="flex flex-col h-full group-hover:bg-background-soft transition-colors duration-200 rounded-r-lg p-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0"> {/* min-w-0 ensures truncation works */}
                  <h4 className="text-sm font-medium truncate">{item.name}</h4>
                  {item.brand && (
                    <p className="text-xs text-foreground-soft truncate">{item.brand}</p>
                  )}
                </div>
                <button
                  onClick={onRemove}
                  className="ml-2 btn btn-ghost h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between text-xs">
                <div className="text-sm font-semibold text-white mt-1">
                  <PriceDisplay
                    amount={item.price}
                    currency={item.priceCurrency || 'INR'}
                    userCurrency={currency}
                    showOriginal={false}
                    showTooltip={true}
                  />
                </div>
                {item.isOwned ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CircleCheck className="w-3 h-3" />
                    <span>Owned</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-blue-600">
                    <ShoppingCart className="w-3 h-3" />
                    <span>Want</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const handleSave = async () => {
    if (!outfitName.trim()) {
      setError('Outfit name is required.');
      return;
    }
    setError(null); // Clear previous errors
    try {
      await onSave(outfitName); // Call the parent's save function
      // Optionally show success feedback here if needed
    } catch (err) {
      // The parent's handleSave already sets the error state in CreateOutfitPage
      // but we might want a local error state for the builder too.
      setError(err instanceof Error ? err.message : 'Failed to save outfit');
    }
    // isSaving is set by the parent component
  };

  const filterItemsBySlot = (item: ClothingItem) => {
    if (selectedSlot === 'headwear') return item.category === 'headwear'
    if (selectedSlot === 'top') return item.category === 'tops'
    if (selectedSlot === 'bottom') return item.category === 'bottoms'
    if (selectedSlot === 'outerwear') return item.category === 'outerwear'
    if (selectedSlot === 'shoes') return item.category === 'shoes'
    if (selectedSlot === 'accessory') return item.category === 'accessories'
    return false
  }

  const OUTFIT_SLOTS: OutfitSlot[] = [
    'headwear',
    'outerwear',
    'top',
    'bottom',
    'shoes',
  ]

  const categories = ['all', 'tops', 'bottoms', 'headwear', 'outerwear', 'shoes', 'accessories'];

  // Fetch items (initial and paginated)
  const fetchItems = useCallback(async (cursor?: string) => {
    try {
      setIsFetchingMore(true)
      const url = new URL('/api/items', window.location.origin)
      url.searchParams.set('limit', '30')
      if (cursor) url.searchParams.set('cursor', cursor)
      const itemsResponse = await fetch(url.toString())
      if (!itemsResponse.ok) throw new Error('Failed to fetch items')
      const itemsData = await itemsResponse.json()
      const itemsArray = Array.isArray(itemsData.items) ? itemsData.items : Array.isArray(itemsData) ? itemsData : [];
      if (cursor) {
        setAvailablePickerItems(prev => [...prev, ...itemsArray])
      } else {
        setAvailablePickerItems(itemsArray)
      }
      setNextCursor(itemsData.nextCursor || null)
      setHasMore(!!itemsData.nextCursor)
    } catch (error) {
      console.error('Error fetching data:', error)
      setHasMore(false)
    } finally {
      setIsFetchingMore(false)
    }
  }, [])

  // Initial fetch for mobile picker
  useEffect(() => {
    if (isItemPickerOpen && availablePickerItems.length === 0) {
      fetchItems()
    }
  }, [isItemPickerOpen, fetchItems, availablePickerItems.length])

  // Infinite scroll observer for mobile picker
  useEffect(() => {
    if (!hasMore || isFetchingMore || !isItemPickerOpen) return
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor) {
          fetchItems(nextCursor)
        }
      },
      { root: null, rootMargin: '0px', threshold: 1.0 }
    )
    if (observerRef.current) {
      observer.observe(observerRef.current)
    }
    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current)
    }
  }, [hasMore, isFetchingMore, nextCursor, fetchItems, isItemPickerOpen])

  return (
    <div 
      ref={isMobile ? undefined : dropRef as any} // Only enable drop on desktop
      className="flex flex-col h-full p-3 sm:p-4 bg-card rounded-xl border-2 border-border"
      onMouseLeave={() => setHoveredSlot(null)}
    >
      {/* Header: Name, Price, Save (NO Download) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
        <input
          type="text"
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
          placeholder="Enter outfit name..."
          className="text-lg font-semibold bg-transparent border-b-2 border-border focus:border-primary focus:outline-none focus:ring-0 placeholder-muted-foreground w-full sm:w-[70%]"
        />
        <div className="flex items-center justify-end gap-2 mt-3 sm:mt-0">
          <div className="flex items-center gap-1.5 text-lg">
            <span>{formatPrice(totalCost, currency)}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !outfitName.trim()}
            className={cn(
              "btn btn-primary h-8 px-3 flex items-center gap-1.5",
              isSaving && "opacity-75 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && <p className="text-sm text-red-500 mb-2">Error: {error}</p>}
      
      {/* Builder Area */}
      <div 
        className="flex-1 overflow-y-auto"
        onMouseLeave={() => setHoveredSlot(null)}
      >
        {/* Mobile Outfit Preview */}
        <div className="sm:hidden p-3 bg-background-soft border-b border-border">
          <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-border">
            <OutfitThumbnail 
              items={Object.values(slots)
                .filter((item): item is ClothingItem => item !== null)
                .concat(accessories)}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Outfit Builder Main Content */}
        <div className="p-3 space-y-4">
          {/* Main Items */}
          <div className="flex flex-col gap-4 md:gap-6">
            {OUTFIT_SLOTS.map((slot) => (
              <div key={slot} className="relative">
                <div
                  className={cn(
                    "relative flex items-center gap-4 rounded-lg border p-4 transition-colors",
                    "hover:bg-muted/80",
                    slots[slot] ? "bg-card" : "bg-muted/50",
                    hoveredSlot === slot && "ring-2 ring-primary"
                  )}
                  onClick={() => handleSlotClick(slot)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setHoveredSlot(slot)
                  }}
                  onDragLeave={() => setHoveredSlot(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setHoveredSlot(null)
                    const item = JSON.parse(e.dataTransfer.getData('item'))
                    handleItemSelect(item)
                  }}
                >
                  {slots[slot] ? (
                    <>
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={slots[slot]!.images[0].url}
                          alt={slots[slot]!.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{slots[slot]!.name}</p>
                        <p className="text-sm text-muted-foreground">
                          <PriceDisplay
                            amount={slots[slot]!.price}
                            currency={slots[slot]!.priceCurrency || 'INR'}
                            userCurrency={currency}
                            showOriginal={false}
                            showTooltip={true}
                          />
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveItem(slot)
                        }}
                        className="absolute right-2 top-2 rounded-full p-1 hover:bg-accent"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {SLOT_LABELS[slot as keyof typeof SLOT_LABELS]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Accessories */}
          <div className="mt-6">
            <h3 className="mb-4 text-lg font-medium">Accessories</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {accessories.map((item, index) => (
                <div key={index} className="relative">
                  <div className="relative flex items-center gap-4 rounded-lg border bg-card p-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.images[0].url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{item.name}</p>
                      <div className="text-sm font-semibold text-white mt-1">
                        <PriceDisplay
                          amount={item.price}
                          currency={item.priceCurrency || 'INR'}
                          userCurrency={currency}
                          showOriginal={false}
                          showTooltip={true}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveAccessory(index)}
                      className="absolute right-2 top-2 rounded-full p-1 hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {/* Empty accessory slots */}
              {[...Array(Math.max(1, 3 - accessories.length))].map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className={cn(
                    "relative flex items-center gap-4 rounded-lg border p-4 transition-colors",
                    "hover:bg-muted/80 bg-muted/50",
                    hoveredSlot === 'accessory' && "ring-2 ring-primary"
                  )}
                  onClick={() => handleSlotClick('accessory')}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setHoveredSlot('accessory')
                  }}
                  onDragLeave={() => setHoveredSlot(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setHoveredSlot(null)
                    const item = JSON.parse(e.dataTransfer.getData('item'))
                    handleItemSelect(item)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Plus className="h-6 w-6 text-muted-foreground md:hidden" />
                    </div>
                    <p className="text-sm text-muted-foreground md:hidden">
                      Tap to add accessory
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4 pt-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this outfit..."
                className="w-full h-20 p-2.5 bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none text-sm"
              />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Seasons</h3>
              <div className="flex flex-wrap gap-1.5">
                {(['spring', 'summer', 'fall', 'winter'] as SeasonName[]).map((season: SeasonName) => (
                  <button
                    key={season}
                    onClick={() => {
                      const isSelected = seasons.some(s => s.name === season)
                      setSeasons(prev => 
                        isSelected 
                          ? prev.filter(s => s.name !== season)
                          : [...prev, { id: season, name: season }]
                      )
                    }}
                    className={`px-2.5 py-1 rounded-full text-sm capitalize transition-colors ${
                      seasons.some(s => s.name === season)
                        ? 'bg-accent-purple text-white'
                        : 'bg-accent-blue/10 text-foreground-soft hover:bg-background'
                    }`}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Occasions</h3>
              <div className="flex flex-wrap gap-1.5">
                {(['casual', 'formal', 'business', 'party', 'sport', 'beach', 'evening', 'wedding'] as OccasionName[]).map((occasion: OccasionName) => (
                  <button
                    key={occasion}
                    onClick={() => {
                      const isSelected = occasions.some(o => o.name === occasion)
                      setOccasions(prev => 
                        isSelected 
                          ? prev.filter(o => o.name !== occasion)
                          : [...prev, { id: occasion, name: occasion }]
                      )
                    }}
                    className={`px-2.5 py-1 rounded-full text-sm capitalize transition-colors ${
                      occasions.some(o => o.name === occasion)
                        ? 'bg-accent-purple text-white'
                        : 'bg-accent-blue/10 text-foreground-soft hover:bg-background'
                    }`}
                  >
                    {occasion}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Tags</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag: string) => (
                    <div
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-sm bg-accent-purple text-white flex items-center gap-1 group"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                        className="opacity-70 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tags (separate with commas)..."
                  className="w-full p-2.5 bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple text-sm"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === ',' || e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.currentTarget
                      const value = input.value.trim()
                      if (value && !tags.includes(value)) {
                        setTags(prev => [...prev, value])
                        input.value = ''
                      }
                    }
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const value = e.target.value.trim()
                    if (value && !tags.includes(value)) {
                      setTags(prev => [...prev, value])
                      e.target.value = ''
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-card rounded-xl border border-border shadow-soft p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Total Cost</h3>
              <div className="text-xl font-semibold">
                <PriceDisplay
                  amount={totalCost}
                  currency={getDominantCurrency([
                    ...Object.values(slots).filter((item): item is ClothingItem => item !== null),
                    ...accessories
                  ])}
                  userCurrency={currency}
                  showOriginal={false}
                  showTooltip={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Item Picker Sheet */}
      <Sheet open={isItemPickerOpen} onOpenChange={setIsItemPickerOpen}>
        <SheetContent side="bottom" className="h-[80vh] px-0">
          <div className="px-4">
            <SheetHeader>
              <SheetTitle>Select {selectedSlot === 'accessory' ? 'Accessory' : SLOT_LABELS[selectedSlot as keyof typeof SLOT_LABELS]}</SheetTitle>
            </SheetHeader>
          </div>
          {/* Search and Category Filter */}
          <div className="px-4 pt-2 pb-0 flex flex-col gap-2 sticky top-0 z-10 bg-background">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 px-8">
                <Search className="absolute left-11 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input pl-9 h-9 text-sm w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto mt-4 h-[65vh]">
            <div className="py-4 px-2 pb-safe w-full">
              <div className="col-span-full flex justify-end mb-2 mr-4">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 pr-8 pb-3"
                >
                  {viewMode === 'grid' ? (
                    <>
                      <List className="w-4 h-4" />
                      <span>List view</span>
                    </>
                  ) : (
                    <>
                      <Grid className="w-4 h-4" />
                      <span>Grid view</span>
                    </>
                  )}
                </button>
              </div>
              <div className={cn(
                viewMode === 'list'
                  ? 'col-span-full space-y-3 w-full px-8'
                  : 'flex flex-auto flex-wrap gap-x-4 gap-y-6 w-full justify-center'
              )}>
                {availablePickerItems
                  .filter(item => {
                    const matchesSearch = searchQuery === '' ||
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
                    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
                    return filterItemsBySlot(item) && matchesSearch && matchesCategory
                  })
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className={cn(
                        "relative border border-border overflow-hidden hover:border-accent-purple transition-colors p-3 w-[150px] rounded-lg flex flex-col items-center",
                        viewMode === 'list'
                          ? 'flex-row w-full gap-3 text-left'
                          : ''
                      )}
                    >
                      <div className={cn(
                        "w-full",
                        viewMode === 'list' ? 'w-16 h-16 flex-shrink-0' : ''
                      )}>
                        <img
                          src={item.images[0].url}
                          alt={item.name}
                          className={cn(
                            viewMode === 'list'
                              ? 'w-auto h-16 rounded-md object-cover'
                              : 'w-auto h-auto rounded-md object-cover'
                          )}
                        />
                      </div>
                      {viewMode === 'list' ? (
                        <div className="flex-1">
                          <div className="text-sm font-medium line-clamp-1">{item.name}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            <PriceDisplay
                              amount={item.price}
                              currency={item.priceCurrency || 'INR'}
                              userCurrency={currency}
                              showOriginal={false}
                              showTooltip={true}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full mt-2">
                          <div className="text-white text-sm font-medium line-clamp-2 text-center">{item.name}</div>
                          <div className="text-white/80 text-xs mt-1 text-center">
                            <PriceDisplay
                              amount={item.price}
                              currency={item.priceCurrency || 'INR'}
                              userCurrency={currency}
                              showOriginal={false}
                              showTooltip={true}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                <div ref={observerRef} className="h-8 w-full flex items-center justify-center">
                  {isFetchingMore && <span className="text-xs text-muted-foreground">Loading more...</span>}
                  {!hasMore && !isFetchingMore && (
                    <span className="text-xs text-muted-foreground">No more items</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Public/Private Toggle */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
           <Label htmlFor="public-toggle" className="text-sm font-medium text-muted-foreground">
             Make Outfit Public?
           </Label>
           <Switch
             id="public-toggle"
             checked={isPublic}
             onCheckedChange={setIsPublic}
             aria-label="Toggle outfit visibility"
           />
        </div>
      </div>
    </div>
  )
} 