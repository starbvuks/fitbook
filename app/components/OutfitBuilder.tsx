'use client'

import { useState, useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import Image from 'next/image'
import { X, Save, ShoppingCart, CircleCheck, Plus, List, Grid, DollarSign } from 'lucide-react'
import type { ClothingItem, Currency, Season, Occasion, SeasonName, OccasionName } from '@/app/models/types'
import { formatPrice, cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'
import PriceDisplay from '@/app/components/PriceDisplay'
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

  const dropAreaRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (dropAreaRef.current) {
      dropRef(dropAreaRef.current)
    }
  }, [dropRef])

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
    <div className={cn(
      "group relative aspect-square rounded-lg border border-border overflow-hidden",
      isAccessory ? "w-24 h-24" : "w-full"
    )}>
      <Image
        src={item.images[0].url}
        alt={item.name}
        fill
        className="object-cover"
      />
      <div className="
        absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
        transition-opacity duration-200 flex flex-col justify-center items-center p-3
      ">
        <h3 className="text-sm font-medium text-white text-center line-clamp-2 max-w-full">
          {item.name}
        </h3>
        {item.brand && (
          <span className="text-xs text-white/75 mt-1 text-center line-clamp-1 max-w-full">
            {item.brand}
          </span>
        )}
        <div className="text-sm font-semibold text-white mt-1">
          <PriceDisplay
            amount={item.price}
            currency={item.priceCurrency || 'INR'}
            userCurrency={currency}
            showOriginal={false}
            showTooltip={true}
          />
        </div>
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
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

  return (
    <div className="flex flex-col gap-4">
      {/* Outfit Builder Grid */}
      <div
        ref={dropAreaRef}
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
          isOver && "opacity-75"
        )}
      >
        {/* Outfit Slots */}
        {Object.entries(slots).map(([slot, item]) => (
          <div
            key={slot}
            className={cn(
              "bg-card rounded-xl border border-border shadow-soft p-3 sm:p-4",
              hoveredSlot === slot && "border-accent-purple"
            )}
            onClick={() => handleSlotClick(slot)}
          >
            <h3 className="text-sm font-medium mb-3 capitalize">
              {SLOT_LABELS[slot as OutfitSlot]}
            </h3>
            {item ? (
              <ItemDisplay item={item} onRemove={() => onRemoveItem(slot)} />
            ) : (
              <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Accessories */}
        <div className="bg-card rounded-xl border border-border shadow-soft p-3 sm:p-4">
          <h3 className="text-sm font-medium mb-3">Accessories</h3>
          <div className="grid grid-cols-3 gap-2">
            {accessories.map((item, index) => (
              <ItemDisplay
                key={item.id}
                item={item}
                onRemove={() => onRemoveAccessory(index)}
                isAccessory
              />
            ))}
            <button
              onClick={() => handleSlotClick('accessory')}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-accent-purple transition-colors"
            >
              <Plus className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Total Cost */}
      <div className="bg-card rounded-xl border border-border shadow-soft p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Total Cost</h3>
          <div className="text-xl font-semibold">
            <PriceDisplay
              amount={Object.values(slots)
                .filter((item): item is ClothingItem => item !== null)
                .concat(accessories)
                .reduce((sum, item) => sum + item.price, 0)}
              currency={'INR'}
              userCurrency={currency}
              showOriginal={false}
              showTooltip={true}
            />
          </div>
        </div>
      </div>

      {/* Item Picker Sheet */}
      <Sheet open={isItemPickerOpen} onOpenChange={setIsItemPickerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Select {selectedSlot === 'accessory' ? 'Accessory' : SLOT_LABELS[selectedSlot as OutfitSlot]}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-lg",
                    viewMode === 'grid' ? "bg-accent-purple text-white" : "hover:bg-accent-purple/10"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-lg",
                    viewMode === 'list' ? "bg-accent-purple text-white" : "hover:bg-accent-purple/10"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
            )}>
              {availableItems
                .filter(item => selectedSlot === 'accessory' ? item.category === 'accessories' : true)
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className={cn(
                      "text-left rounded-lg border border-border hover:border-accent-purple transition-colors overflow-hidden",
                      viewMode === 'grid' ? "aspect-square" : "flex items-center gap-4"
                    )}
                  >
                    <div className={cn(
                      "relative",
                      viewMode === 'grid' ? "aspect-square" : "w-24 h-24"
                    )}>
                      <Image
                        src={item.images[0].url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className={cn(
                      viewMode === 'grid'
                        ? "absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center p-3 text-white"
                        : "flex-1 p-3"
                    )}>
                      <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
                      {item.brand && (
                        <span className={cn(
                          "text-xs mt-1 line-clamp-1",
                          viewMode === 'grid' ? "text-white/75" : "text-muted-foreground"
                        )}>
                          {item.brand}
                        </span>
                      )}
                      <div className={cn(
                        "text-sm font-semibold mt-1",
                        viewMode === 'grid' ? "text-white" : ""
                      )}>
                        <PriceDisplay
                          amount={item.price}
                          currency={item.priceCurrency || 'INR'}
                          userCurrency={currency}
                          showOriginal={false}
                          showTooltip={true}
                        />
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
} 