'use client'

import Image from 'next/image'
import type { ClothingItem, ClothingCategory } from '@/app/models/types'
import { cn } from '@/lib/utils' // Assuming cn is available

// Define the desired display order for categories
const CATEGORY_ORDER: ClothingCategory[] = [
  'headwear',
  'outerwear',
  'tops',
  'bottoms',
  'shoes',
  'accessories'
];

interface OutfitThumbnailProps {
  items: ClothingItem[]
  className?: string
}

export default function OutfitThumbnail({ items, className = '' }: OutfitThumbnailProps) {
  
  // Sort items based on CATEGORY_ORDER
  const sortedItems = [...(items || [])].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.category);
    const indexB = CATEGORY_ORDER.indexOf(b.category);
    // Items not in order go to the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Get up to 6 items to display
  const displayItems = sortedItems.slice(0, 6);
  const itemCount = displayItems.length;

  // Calculate grid layout based on number of items (up to 2x3)
  const gridLayoutClasses = {
    1: 'grid-cols-1 grid-rows-1',
    2: 'grid-cols-2 grid-rows-1',
    3: 'grid-cols-2 grid-rows-2', // 2x2, one cell spans
    4: 'grid-cols-2 grid-rows-2', // 2x2
    5: 'grid-cols-2 grid-rows-3', // 2x3, one cell spans
    6: 'grid-cols-2 grid-rows-3'  // 2x3
  }[itemCount] || 'grid-cols-2 grid-rows-3'; // Default for 0 or > 6 (though slice limits)

  if (itemCount === 0) {
    return (
      <div className={cn(
        `relative aspect-square overflow-hidden rounded-lg bg-card flex items-center justify-center`,
        className
      )}>
        <div className="text-foreground-soft text-sm">No items</div>
      </div>
    )
  }

  return (
    <div className={cn(
      `relative aspect-square overflow-hidden sm:rounded-lg`,
      className
    )}>
      <div className={cn(
        `grid h-full gap-px bg-border`,
        gridLayoutClasses
      )}>
        {displayItems.map((item: ClothingItem, index: number) => (
          <div
            key={item.id + index}
            className={cn(
              `relative bg-card`,
              // Special spanning logic for 3 and 5 items
              itemCount === 3 && index === 0 && 'row-span-2', 
              itemCount === 5 && index === 0 && 'row-span-2' 
            )}
          >
            {item.images && item.images[0]?.url ? (
              <Image
                src={item.images[0].url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" // Basic sizes prop
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground-soft text-xs">
                No Image
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 