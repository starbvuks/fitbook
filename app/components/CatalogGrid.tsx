'use client'

import { useDrag } from 'react-dnd'
import Image from 'next/image'
import { DollarSign } from 'lucide-react'
import type { ClothingItem } from '@/app/models/types'
import { formatPrice, cn } from '@/lib/utils'

interface CatalogGridProps {
  items: ClothingItem[]
  onItemDrag?: (item: ClothingItem) => void
}

interface DraggableItemProps {
  item: ClothingItem
  onDrag?: (item: ClothingItem) => void
}

const DraggableItem = ({ item, onDrag }: DraggableItemProps) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'clothing',
    item: () => {
      onDrag?.(item)
      return item
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  return (
    <div
      ref={(node) => {
        const dragTarget = dragRef as unknown as (node: HTMLDivElement | null) => void
        dragTarget(node)
      }}
      className={cn(
        'relative aspect-square rounded-lg border border-border bg-background p-2 transition-opacity cursor-move',
        isDragging && 'opacity-50'
      )}
    >
      <Image
        src={item.images[0]?.url || '/placeholder.png'}
        alt={item.name}
        fill
        className="w-full h-full object-cover rounded-md"
      />
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 backdrop-blur-sm text-white text-sm rounded-b-md">
        <div className="truncate">{item.name}</div>
        <div className="text-xs">${item.price}</div>
      </div>
    </div>
  )
}

export default function CatalogGrid({ items, onItemDrag }: CatalogGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <DraggableItem
          key={item.id}
          item={item}
          onDrag={onItemDrag}
        />
      ))}
    </div>
  )
} 