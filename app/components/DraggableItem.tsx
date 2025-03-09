'use client'

import { useDrag } from 'react-dnd'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { ClothingItem, Currency } from '@/app/models/types'
import { formatPrice } from '@/lib/utils'

interface DraggableItemProps {
  item: ClothingItem
  currency: Currency
}

export default function DraggableItem({ item, currency }: DraggableItemProps) {
  const [{ isDragging }, dragRef] = useDrag<ClothingItem, void, { isDragging: boolean }>(() => ({
    type: 'CLOTHING_ITEM',
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  return (
    <div
      ref={dragRef as any}
      className={`
        group relative aspect-square rounded-lg border border-dashed border-border/50
        overflow-hidden transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}
        cursor-grab active:cursor-grabbing
      `}
    >
      <Image
        src={item.images[0].url}
        alt={item.name}
        fill
        className="object-cover"
      />
      <div className="
        absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
        opacity-0 group-hover:opacity-100 transition-opacity
        flex flex-col justify-end p-3
      ">
        <h3 className="text-sm font-medium text-white line-clamp-1">{item.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/90">{formatPrice(item.price, currency)}</span>
          {item.brand && (
            <span className="text-xs text-white/75">{item.brand}</span>
          )}
        </div>
      </div>
    </div>
  )
} 