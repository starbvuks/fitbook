import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, ShoppingCart, BookmarkPlus } from 'lucide-react'
import type { ClothingItem, Currency } from '@/app/models/types'
import { formatPrice } from '@/lib/utils'
import { useState } from 'react'

interface ItemCardProps {
  item: ClothingItem
  currency: Currency
  onToggleOwnership?: (itemId: string, isOwned: boolean) => Promise<void>
  viewMode?: 'large' | 'small' | 'stack'
}

export default function ItemCard({ item, currency, onToggleOwnership, viewMode = 'large' }: ItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggleOwnership = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    if (!onToggleOwnership || isUpdating) return

    setIsUpdating(true)
    try {
      await onToggleOwnership(item.id, !item.isOwned)
    } catch (error) {
      console.error('Failed to toggle ownership:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const cardClasses = {
    large: 'aspect-square',
    small: 'aspect-[3/4]',
    stack: 'h-24',
  }

  const containerClasses = {
    large: 'flex flex-col',
    small: 'flex flex-col',
    stack: 'flex flex-row items-center gap-4',
  }

  return (
    <Link
      href={`/catalog/${item.id}`}
      className={`group relative bg-background rounded-lg border border-border overflow-hidden hover:border-accent-purple transition-colors ${containerClasses[viewMode]}`}
    >
      <div className={`relative ${cardClasses[viewMode]} ${viewMode === 'stack' ? 'w-24 flex-shrink-0' : 'w-full'}`}>
        {item.images[0] ? (
          <Image
            src={item.images[0].url}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-background-soft flex items-center justify-center text-foreground-soft">
            No Image
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {item.purchaseUrl && (
            <a
              href={item.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-background/90 rounded-full hover:bg-background transition-colors"
              title="Purchase Link"
            >
              <ExternalLink className="w-4 h-4 text-foreground-soft hover:text-accent-purple" />
            </a>
          )}
          <button
            onClick={handleToggleOwnership}
            disabled={isUpdating}
            className={`p-1.5 rounded-full transition-colors ${
              isUpdating 
                ? 'bg-background/50' 
                : item.isOwned
                ? 'bg-green-100/90 hover:bg-green-200/90'
                : 'bg-blue-100/90 hover:bg-blue-200/90'
            }`}
            title={item.isOwned ? 'Mark as Want to Buy' : 'Mark as Owned'}
          >
            {item.isOwned ? (
              <ShoppingCart className={`w-4 h-4 ${isUpdating ? 'text-foreground-soft' : 'text-green-600'}`} />
            ) : (
              <BookmarkPlus className={`w-4 h-4 ${isUpdating ? 'text-foreground-soft' : 'text-blue-600'}`} />
            )}
          </button>
        </div>
      </div>
      <div className={`p-4 ${viewMode === 'stack' ? 'flex-1' : ''}`}>
        <h3 className="font-medium mb-1 group-hover:text-accent-purple transition-colors line-clamp-1">
          {item.name}
        </h3>
        <div className="flex items-center justify-between text-sm text-foreground-soft">
          <span className="capitalize">{item.category}</span>
          <span>{formatPrice(item.price, currency)}</span>
        </div>
        {item.tags.length > 0 && viewMode !== 'stack' && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.name}
                className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft"
              >
                {tag.name}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft">
                +{item.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
} 