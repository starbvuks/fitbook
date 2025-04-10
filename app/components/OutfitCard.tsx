'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Tag, Trash2, Share2, Pencil, Loader2, Star } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'
import type { Outfit, Currency, ClothingItem } from '@/app/models/types'
import { useToast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

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
  const router = useRouter()
  const { toast } = useToast()
  const [isNavigating, setIsNavigating] = useState(false)

  const sortedItems = outfit.items
    .map(item => item.wardrobeItem)
    .filter((item): item is ClothingItem => item !== undefined)
    .sort((a, b) => {
      const categoryOrder = ['headwear', 'outerwear', 'tops', 'bottoms', 'shoes', 'accessories']
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
    })
    .slice(0, 6)

  const handleShare = (outfitId: string) => {
    if (onShare) onShare(outfitId)
    toast({
      title: "Link Copied",
      description: "Outfit link copied to clipboard.",
    });
  }

  const handleNavigate = () => {
    setIsNavigating(true)
    router.push(`/outfits/${outfit.id}`)
  }

  const firstSeason = outfit.seasons?.[0];
  const remainingSeasonsCount = outfit.seasons ? outfit.seasons.length - 1 : 0;

  return (
    <div 
      onClick={handleNavigate}
      className={cn(
        `bg-card border border-border overflow-hidden hover:border-accent-purple transition-colors cursor-pointer relative group`,
        viewMode === 'list' ? 'flex flex-col sm:flex-row rounded-lg' : 'rounded-xl',
        isNavigating && 'opacity-70'
      )}
    >
      {isNavigating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      <div className={cn(
        'flex flex-col', 
        viewMode === 'list' ? 'sm:flex-row' : '' 
      )}>
        <div 
           className={cn(
             "relative",
             viewMode === 'list' ? "w-full sm:w-48 h-48 flex-shrink-0" : "w-full aspect-square" 
           )}
        >
           <OutfitThumbnail 
              items={sortedItems}
              className="h-full w-full"
           />
        </div>
        <div className="flex flex-col p-3 sm:p-4 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate group-hover:text-accent-purple transition-colors">
                {outfit.name}
              </h3>
              <div className='flex items-center gap-2'>
              <p className="text-sm text-muted-foreground mt-0.5">
                 {formatPrice(outfit.totalCost, currency)}
              </p>
              <span className='text-muted-foreground'>•</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                 {firstSeason && (
                   <div className="flex items-center gap-1">
                     <Calendar className="w-3 h-3" />
                     <span className="capitalize">{firstSeason.name}</span>
                     {remainingSeasonsCount > 0 && (
                       <span className="ml-0.5">+{remainingSeasonsCount}</span>
                     )}
                   </div>
                 )}
              </div>
              </div>
            </div>
            
            <div className="flex items-center flex-shrink-0 -mr-1 space-x-1 opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 touch:opacity-100">
              {onShare && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleShare(outfit.id); }}
                  className="p-1.5 text-foreground-soft hover:text-foreground rounded-md hover:bg-background-soft transition-colors"
                  aria-label="Share outfit"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              
              <Link
                href={`/outfits/${outfit.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-foreground-soft hover:text-foreground rounded-md hover:bg-background-soft transition-colors"
                aria-label="Edit outfit"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <button
                       onClick={(e) => e.stopPropagation()}
                       className="p-1.5 text-red-500/80 hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                       aria-label="Delete outfit"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete?.(outfit.id); }}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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
          
          {viewMode === 'list' && outfit.description && (
            <p className="mt-2 text-sm text-foreground-soft line-clamp-2 hidden sm:block">
              {outfit.description}
            </p>
          )}
          
          {viewMode === 'list' && (
            <div className="mt-auto pt-2 flex items-center space-x-2 sm:hidden">
              {onShare && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleShare(outfit.id); }}
                  className="p-1.5 text-foreground-soft rounded-md bg-background-soft transition-colors"
                  aria-label="Share outfit"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              
              <Link
                href={`/outfits/${outfit.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-foreground-soft rounded-md bg-background-soft transition-colors"
                aria-label="Edit outfit"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              
              {onDelete && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-red-500/80 hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
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