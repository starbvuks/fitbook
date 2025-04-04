'use client'

import Link from 'next/link'
import { Calendar, Tag, Trash2, Share2, Pencil } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'
import type { Outfit, Currency, ClothingItem } from '@/app/models/types'

interface OutfitCardProps {
  outfit: Outfit
  currency: Currency
  viewMode: 'grid' | 'list'
  onDelete?: (outfitId: string) => void
  onShare?: (outfitId: string) => void
}

export default function OutfitCard({ 
  outfit, 
  currency, 
  viewMode,
  onDelete,
  onShare
}: OutfitCardProps) {
  return (
    <div 
      className={`bg-card border border-border overflow-hidden hover:border-accent-purple transition-colors ${
        viewMode === 'grid' ? 'rounded-xl' : 'rounded-lg'
      }`}
    >
      <div className={viewMode === 'grid' ? "block" : "flex flex-col sm:flex-row h-auto sm:h-48 gap-4"}>
        <Link
          href={`/outfits/${outfit.id}`}
          className="block"
        >
          <div className={viewMode === 'list' ? "w-full sm:w-48 h-48" : "w-full"}>
            <OutfitThumbnail 
              items={outfit.items
                .map(item => item.wardrobeItem)
                .filter((item): item is ClothingItem => item !== undefined)}
              className="h-full w-full aspect-square"
            />
          </div>
        </Link>

        <div className={`p-4 ${viewMode === 'list' ? "flex-1 flex flex-col" : ""}`}>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/outfits/${outfit.id}`}
              className="hover:text-accent-purple transition-colors"
            >
              <h3 className="font-medium line-clamp-1">{outfit.name}</h3>
            </Link>
            
            {/* Action buttons - visible on hover or on mobile with touch */}
            <div className="flex items-center -mr-1 space-x-1 opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 touch:opacity-100">
              {onShare && (
                <button
                  onClick={() => onShare(outfit.id)}
                  className="p-1.5 text-foreground-soft hover:text-foreground rounded-md hover:bg-background-soft transition-colors"
                  aria-label="Share outfit"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              
              <Link
                href={`/outfits/${outfit.id}/edit`}
                className="p-1.5 text-foreground-soft hover:text-foreground rounded-md hover:bg-background-soft transition-colors"
                aria-label="Edit outfit"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              
              {onDelete && (
                <button
                  onClick={() => onDelete(outfit.id)}
                  className="p-1.5 text-foreground-soft hover:text-red-500 rounded-md hover:bg-background-soft transition-colors"
                  aria-label="Delete outfit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground-soft">
            <span>{formatPrice(outfit.totalCost, currency)}</span>
            {outfit.seasons.length > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{outfit.seasons[0].name}</span>
              </div>
            )}
          </div>

          {outfit.tags.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <Tag className="w-3 h-3 text-foreground-soft" />
              <div className="flex flex-wrap items-center gap-1">
                {outfit.tags.slice(0, 3).map(tag => (
                  <span key={tag.id} className="px-1.5 py-0.5 text-[10px] bg-accent-purple/20 rounded text-foreground-soft whitespace-nowrap">
                    {tag.name}
                  </span>
                ))}
                {outfit.tags.length > 3 && (
                  <span className="text-xs text-foreground-soft">+{outfit.tags.length - 3}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Description - only visible in list view */}
          {viewMode === 'list' && outfit.description && (
            <p className="mt-2 text-sm text-foreground-soft line-clamp-2 hidden sm:block">
              {outfit.description}
            </p>
          )}
          
          {/* Mobile actions row - only visible on small screens */}
          {viewMode === 'list' && (
            <div className="mt-auto pt-2 flex items-center space-x-2 sm:hidden">
              {onShare && (
                <button
                  onClick={() => onShare(outfit.id)}
                  className="p-1.5 text-foreground-soft rounded-md bg-background-soft transition-colors"
                  aria-label="Share outfit"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              
              <Link
                href={`/outfits/${outfit.id}/edit`}
                className="p-1.5 text-foreground-soft rounded-md bg-background-soft transition-colors"
                aria-label="Edit outfit"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              
              {onDelete && (
                <button
                  onClick={() => onDelete(outfit.id)}
                  className="p-1.5 text-foreground-soft hover:text-red-500 rounded-md bg-background-soft transition-colors"
                  aria-label="Delete outfit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 