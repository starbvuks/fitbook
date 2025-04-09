'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Tag, Trash2, Share2, Pencil, Loader2, Star, Bookmark, User } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'
import type { Outfit, Currency, ClothingItem, DisplayOutfit } from '@/app/models/types'
import { useToast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

interface OutfitCardProps {
  outfit: DisplayOutfit
  currency: Currency
  viewMode: 'grid' | 'list'
  onDelete?: (id: string) => void
  onUnsave?: (id: string) => void
  onSave?: (id: string) => void
  onShare?: (id: string) => void
}

export default function OutfitCard({ 
  outfit, 
  currency, 
  viewMode,
  onDelete,
  onUnsave,
  onSave,
  onShare
}: OutfitCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(outfit.id)
      // Toast might be handled in the parent component after successful deletion
    } catch (error) { 
      console.error("Failed to delete:", error)
      toast({ variant: "destructive", title: "Error", description: "Failed to delete outfit." })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare) {
      onShare(outfit.id)
    }
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSave && !isSaving) {
      setIsSaving(true)
      // Call the prop function, parent handles API & state update
      onSave(outfit.id)
      // Optimistically update UI? Or wait for parent confirmation?
      // Resetting isSaving might be done in parent via a callback/prop change
      // For simplicity now, let's assume parent handles the final state
      setTimeout(() => setIsSaving(false), 1500) // Temp reset
    }
  }

  const handleUnsaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUnsave && !isSaving) {
      setIsSaving(true)
      onUnsave(outfit.id)
      // Resetting isSaving might be done in parent
      setTimeout(() => setIsSaving(false), 1500) // Temp reset
    }
  }

  const handleNavigate = () => {
    // Navigate to detail page regardless of type for now
    router.push(`/outfits/${outfit.id}`)
  }

  // Conditional data extraction
  const isOwnOutfit = !outfit.isSaved
  // Use type assertion carefully only when isOwnOutfit is true
  const seasons = isOwnOutfit ? (outfit as Outfit).seasons : []
  const firstSeason = seasons?.[0]
  const remainingSeasonsCount = seasons ? seasons.length - 1 : 0
  const tags = isOwnOutfit ? (outfit as Outfit).tags : []
  
  // Common container class based on viewMode
  const containerClass = cn(
    "group relative border rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-md bg-card text-card-foreground",
    viewMode === 'list' ? "flex flex-row items-stretch" : "flex flex-col"
  )

  const thumbnailContainerClass = cn(
    viewMode === 'list' ? "w-32 sm:w-40 flex-shrink-0" : "aspect-square"
  )

  const contentContainerClass = cn(
    "flex flex-col p-3 sm:p-4 flex-1 min-w-0",
    viewMode === 'list' ? "justify-between" : ""
  )

  return (
    <div className={containerClass}>
      {/* Action Buttons Overlay */} 
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {isOwnOutfit && onShare && (
          <button
            onClick={handleShareClick}
            title="Share Outfit"
            className="p-1.5 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-foreground/80" />
          </button>
        )}
        {/* Save/Unsave Buttons */} 
        {onSave && !isSaving && (
           <button 
             onClick={handleSaveClick}
             title="Save Outfit"
             className="p-1.5 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background transition-colors"
           > 
             <Bookmark className="w-3.5 h-3.5 text-foreground/80" /> 
           </button>
        )}
        {onUnsave && !isSaving && (
            <button 
              onClick={handleUnsaveClick}
              title="Unsave Outfit"
              className="p-1.5 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background transition-colors"
            > 
              <Bookmark className="w-3.5 h-3.5 text-primary fill-current" /> 
            </button>
        )}
        {isSaving && 
          <div className="p-1.5 rounded-full bg-background/70 backdrop-blur-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground/80" />
          </div>
        }

        {/* Edit/Delete only for own outfits */} 
        {isOwnOutfit && (
          <>
            <Link 
              href={`/outfits/${outfit.id}/edit`}
              onClick={(e) => e.stopPropagation()} // Prevent card navigation
              title="Edit Outfit"
              className="p-1.5 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-foreground/80" />
            </Link>
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()} // Prevent card navigation
                    disabled={isDeleting}
                    title="Delete Outfit"
                    className="p-1.5 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}> 
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the outfit.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </div>

      {/* Thumbnail */} 
      <div 
        className={thumbnailContainerClass}
        onClick={handleNavigate} // Make thumbnail clickable
        role="button" // Indicate clickable
        tabIndex={0} // Make focusable
        onKeyDown={(e) => e.key === 'Enter' && handleNavigate()} // Allow keyboard nav
      > 
        <OutfitThumbnail
          items={isOwnOutfit 
            ? (outfit as Outfit).items
                .map(item => item.wardrobeItem) // Extract ClothingItem
                .filter((item): item is ClothingItem => !!item) // Type guard for safety
            : []
          }
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */} 
      <div className={contentContainerClass}>
        <div className="flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              {/* Clickable Name */} 
              <h3 
                onClick={handleNavigate}
                role="button" 
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                className="font-semibold text-base truncate cursor-pointer hover:text-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple rounded-sm transition-colors"
              >
                {outfit.name}
              </h3>
              {/* Creator Name (if saved/public) */} 
              {!isOwnOutfit && outfit.userName && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> {outfit.userName}
                </p>
              )}
            </div>
            {/* Rating (only if not own outfit) */} 
            {!isOwnOutfit && (
              <div className="flex items-center gap-0.5 text-sm text-muted-foreground flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{outfit.rating?.toFixed(1) ?? 'N/A'}</span> 
              </div>
            )}
          </div>
          {/* Price and Season Info */} 
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
            <p className="text-sm"> 
              {formatPrice(outfit.totalCost, currency)}
            </p>
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
        {/* Tags (only if own outfit and tags exist) */} 
        {isOwnOutfit && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
             <Tag className="w-3 h-3 text-muted-foreground flex-shrink-0" />
             {tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  {tag.name}
                </span>
             ))}
             {tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+ {tags.length - 3} more</span>
             )}
          </div>
        )}
      </div>
    </div>
  )
} 