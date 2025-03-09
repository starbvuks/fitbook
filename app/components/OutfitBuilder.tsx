'use client'

import { useState } from 'react'
import { useDrop } from 'react-dnd'
import Image from 'next/image'
import { X, Download, Save } from 'lucide-react'
import type { ClothingItem, Currency } from '@/app/models/types'
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
  onSave: () => void
  isSaving: boolean
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
  isSaving
}: OutfitBuilderProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)

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
    .filter(item => item !== null)
    .reduce((sum, item) => sum + (item?.price || 0), 0) +
    accessories.reduce((sum, item) => sum + item.price, 0)

  return (
    <div 
      ref={dropRef as any}
      className="h-full flex flex-col"
      onMouseLeave={() => setHoveredSlot(null)}
    >
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="text-lg font-semibold">Outfit Builder</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{formatPrice(totalCost, currency)}</span>
          <button
            className="btn btn-ghost h-8 w-8 p-0"
            title="Download Outfit Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className="btn btn-primary h-8 w-8 p-0"
            title="Save Outfit"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 ">
        <div className="grid h-full ">
          {Object.entries(SLOT_LABELS).map(([slot, label]) => (
            <div key={slot} className="grid grid-cols-[2fr_120px] gap-3 h-[120px]">
              {/* Main Item Slot */}
              <div className='mt-1.5'>
                <div className={`h-[100px] rounded-lg border border-dashed ${
                  isOver && hoveredSlot === slot ? 'border-primary bg-primary/5' : 'border-border/50'
                } overflow-hidden ${
                  !slots[slot] ? 'bg-muted/50 flex items-center justify-center' : ''
                }`}>
                  {slots[slot] ? (
                    <div className="relative h-full group">
                      <Image
                        src={slots[slot]!.images[0].url}
                        alt={slots[slot]!.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
                        {slots[slot]!.name}
                      </div>
                      <button
                        onClick={() => onRemoveItem(slot)}
                        className="absolute top-1 right-1 btn btn-ghost h-6 w-6 p-0 bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground/75 px-4 text-center">
                      <span className="block text-xs">{label.toLowerCase()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Companion Accessory Slot */}
              <div>
                
                <div className={`h-[100px] mt-1.5 rounded-lg border border-dashed ${
                  isOver && hoveredSlot === `${slot}_accessory` ? 'border-primary bg-primary/5' : 'border-border/30'
                } overflow-hidden ${
                  !accessories.find(acc => acc.position === slot) ? 'bg-muted/30 flex items-center justify-center' : ''
                }`}>
                  {accessories.find(acc => acc.position === slot) ? (
                    <div className="relative h-full group">
                      <Image
                        src={accessories.find(acc => acc.position === slot)!.images[0].url}
                        alt={accessories.find(acc => acc.position === slot)!.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
                        {accessories.find(acc => acc.position === slot)!.name}
                      </div>
                      <button
                        onClick={() => onRemoveAccessory(accessories.findIndex(acc => acc.position === slot))}
                        className="absolute top-1 right-1 btn btn-ghost h-6 w-6 p-0 bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/50 px-2 text-center">
                      <span className="block">Add accessory</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 