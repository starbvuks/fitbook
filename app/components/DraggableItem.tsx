'use client'

import { useDrag } from 'react-dnd'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { ClothingItem, Currency } from '@/app/models/types'
import { formatPrice } from '@/lib/utils'
import { ReactNode } from 'react'

interface DraggableItemProps {
  item: ClothingItem
  currency: Currency
  children?: ReactNode
}

export default function DraggableItem({ item, currency, children }: DraggableItemProps) {
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
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02] active:scale-[0.98]'}
        cursor-grab active:cursor-grabbing touch-manipulation
      `}
    >
      {item.images[0] && (
        <Image
          src={item.images[0].url}
          alt={item.name}
          fill
          className="object-cover"
        />
      )}
      <div className="
        absolute inset-0 bg-black/60
        opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200
        flex flex-col justify-center items-center p-3
      ">
        {children || (
          <>
            <h3 className="text-sm font-medium text-white text-center line-clamp-2 max-w-full">
              {item.name}
            </h3>
            {item.brand && (
              <span className="text-xs text-white/75 mt-1 text-center line-clamp-1 max-w-full">
                {item.brand}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
} 