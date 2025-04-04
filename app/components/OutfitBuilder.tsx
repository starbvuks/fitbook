'use client'

import { useState, useEffect } from 'react'
import { useDrop } from 'react-dnd'
import Image from 'next/image'
import { X, Download, Save, ShoppingCart, CircleCheck } from 'lucide-react'
import type { ClothingItem, Currency, Season, Occasion, SeasonName, OccasionName } from '@/app/models/types'
import { formatPrice } from '@/lib/utils'

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
}

const SLOT_LABELS = {
  headwear: 'Headwear',
  top: 'Top',
  outerwear: 'Outerwear',
  bottom: 'Bottom',
  shoes: 'Shoes'
}

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
  onTagsChange
}: OutfitBuilderProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [outfitName, setOutfitName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [seasons, setSeasons] = useState<Season[]>(initialSeasons)
  const [occasions, setOccasions] = useState<Occasion[]>(initialOccasions)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [error, setError] = useState<string | null>(null)

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

  const [{ isOver }, dropRef] = useDrop<ClothingItemWithPosition, void, { isOver: boolean }>(() => ({
    accept: 'CLOTHING_ITEM',
    hover: (item, monitor) => {
      if (item.category === 'accessories') {
        const targetSlot = getTargetSlot(monitor.getClientOffset()?.y)
        setHoveredSlot(`${targetSlot}_accessory`)
      } else {
        const slot = item.category === 'tops' ? 'top' : 
                    item.category === 'bottoms' ? 'bottom' : 
                    (item as ClothingItemWithPosition).position === 'headwear' ? 'headwear' :
                    item.category === 'outerwear' ? 'outerwear' :
                    item.category === 'shoes' ? 'shoes' : null
        setHoveredSlot(slot)
      }
    },
    drop: (item: ClothingItemWithPosition, monitor) => {
      if (item.category === 'accessories') {
        const targetSlot = getTargetSlot(monitor.getClientOffset()?.y)
        onAddAccessory({ ...item, position: targetSlot })
      } else {
        const slot = item.category === 'tops' ? 'top' : 
                    item.category === 'bottoms' ? 'bottom' : 
                    item.position === 'headwear' ? 'headwear' :
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
              <p className="text-white/80 text-xs mt-1">{formatPrice(item.price, currency)}</p>
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
                <span className="text-foreground-soft">{formatPrice(item.price, currency)}</span>
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
    // Reset error state
    setError(null)

    // Validate outfit name
    if (!outfitName.trim()) {
      setError('Please give your outfit a name')
      return
    }

    // Check if at least one item is added
    const hasMainItem = Object.values(slots).some(item => item !== null)
    if (!hasMainItem) {
      setError('Add at least one clothing item to your outfit')
      return
    }

    // If validation passes, call onSave with the outfit name
    try {
      await onSave(outfitName.trim())
    } catch (err) {
      setError('Failed to save outfit. Please try again.')
    }
  }

  return (
    <div 
      ref={dropRef as any}
      className="h-full flex flex-col"
      onMouseLeave={() => setHoveredSlot(null)}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-5 border-b border-border gap-3">
        <div className="flex-1 flex items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            value={outfitName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOutfitName(e.target.value)}
            placeholder="Enter outfit name..."
            className="text-xl sm:text-2xl font-display font-bold bg-transparent border-b-2 border-border focus:border-primary focus:outline-none transition-colors w-full sm:w-72 placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 text-foreground-soft w-full sm:w-auto sm:mr-10 justify-between sm:justify-start">
          <span className="text-sm font-medium">Total Cost:</span>
          <span className="text-lg font-semibold text-foreground">
            {formatPrice(totalCost, currency)}
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center text-sm gap-2 px-3 py-2 w-full sm:w-auto sm:ml-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors disabled:opacity-50 justify-center"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {/* Outfit slots */}
        <div className="space-y-4">
          {Object.entries(SLOT_LABELS).map(([slot, label]: [string, string]) => (
            <div key={slot} className="relative">
              <div className="text-sm font-medium mb-2">{label}</div>
              <div
                className={`h-[100px] rounded-lg border-2 transition-colors ${
                  hoveredSlot === slot
                    ? 'border-accent-purple bg-accent-purple/10'
                    : slots[slot]
                    ? 'border-border bg-background'
                    : 'border-dashed border-border bg-background-soft'
                }`}
              >
                {slots[slot] ? (
                  <ItemDisplay
                    item={slots[slot]!}
                    onRemove={() => onRemoveItem(slot)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-foreground-soft">
                    {window.innerWidth > 640 ? 'Drop item here' : 'Tap to add item'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Accessories */}
        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Accessories</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accessories.map((item, index) => (
              <div key={index} className="h-[100px]">
                <ItemDisplay
                  item={item}
                  onRemove={() => onRemoveAccessory(index)}
                  isAccessory
                />
              </div>
            ))}
            <div
              className={`h-[100px] rounded-lg border-2 border-dashed transition-colors ${
                hoveredSlot?.endsWith('_accessory')
                  ? 'border-accent-purple bg-accent-purple/10'
                  : 'border-border bg-background-soft'
              }`}
            >
              <div className="flex items-center justify-center h-full text-sm text-foreground-soft">
                {window.innerWidth > 640 ? 'Drop accessory here' : 'Tap to add accessory'}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this outfit..."
              className="w-full h-24 p-3 bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Seasons</h3>
            <div className="flex flex-wrap gap-2">
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
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
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
            <div className="flex flex-wrap gap-2">
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
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
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
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <div
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-sm bg-accent-purple text-white flex items-center gap-1 group"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                      className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags (separate with commas)..."
                className="w-full p-2 bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
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
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg border border-destructive/20 max-w-[90%] sm:max-w-md text-center">
          {error}
        </div>
      )}
    </div>
  )
} 