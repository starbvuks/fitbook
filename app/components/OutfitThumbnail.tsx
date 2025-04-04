'use client'

import Image from 'next/image'
import type { ClothingItem } from '@/app/models/types'

interface OutfitThumbnailProps {
  items: ClothingItem[]
  className?: string
}

export default function OutfitThumbnail({ items, className = '' }: OutfitThumbnailProps) {
  // Get up to 4 items to display in the grid
  const displayItems = (items || []).slice(0, 4)
  
  // Calculate grid layout based on number of items
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2',
    4: 'grid-cols-2'
  }[displayItems.length] || 'grid-cols-2'

  if (displayItems.length === 0) {
    return (
      <div className={`relative aspect-square overflow-hidden rounded-lg bg-card flex items-center justify-center ${className}`}>
        <div className="text-foreground-soft text-sm">No items</div>
      </div>
    )
  }

  return (
    <div className={`relative aspect-square overflow-hidden rounded-lg ${className}`}>
      <div className={`grid ${gridClass} h-full gap-0.5 bg-border`}>
        {displayItems.map((item: ClothingItem, index: number) => (
          <div
            key={item.id + index}
            className={`relative ${
              displayItems.length === 3 && index === 2 ? 'col-span-2' : ''
            }`}
          >
            {item.images && item.images[0] ? (
              <Image
                src={item.images[0].url}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-card flex items-center justify-center text-foreground-soft">
                No Image
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 