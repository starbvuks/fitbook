import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ExternalLink, ShoppingCart, CircleCheck, Trash2, Loader2 } from 'lucide-react'
import type { ClothingItem, Currency } from '@/app/models/types'
import { formatCurrency } from '@/lib/currency'
import { useState } from 'react'
import PriceDisplay from './PriceDisplay'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ItemCardProps {
  item: ClothingItem
  currency: Currency
  onToggleOwnership?: (itemId: string, isOwned: boolean) => Promise<void>
  viewMode?: 'large' | 'small' | 'stack'
}

export default function ItemCard({ item, currency, onToggleOwnership, viewMode = 'large' }: ItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  // Safeguard against undefined or malformed items
  if (!item) {
    return (
      <div className="bg-background rounded-lg border border-border p-4 h-full flex items-center justify-center">
        <p className="text-foreground-soft">Item not available</p>
      </div>
    )
  }

  const handleToggleOwnership = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
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

  const handleClick = () => {
    router.push(`/catalog/${item.id}`)
  }

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Ideally, update the parent component's state instead of reloading
        router.refresh(); // Use Next.js router.refresh() for better UX
      } else {
        console.error('Failed to delete item:', await response.text());
        // Optionally show an error message
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      // Optionally show an error message
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

  // Safe access to images and tags
  const images = item.images || []
  const tags = item.tags || []

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-background rounded-lg border border-border overflow-hidden hover:border-accent-purple transition-colors cursor-pointer ${containerClasses[viewMode]}`}
    >
      <div className={`relative ${cardClasses[viewMode]} ${viewMode === 'stack' ? 'w-24 flex-shrink-0' : 'w-full'}`}>
        {images[0] ? (
          <Image
            src={images[0].url}
            alt={item.name}
            fill
            className="object-cover"
            sizes={viewMode === 'large' ? "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" : 
                   viewMode === 'small' ? "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" : "96px"}
          />
        ) : (
          <div className="w-full h-full bg-card flex items-center justify-center text-foreground-soft">
            No Image
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {item.purchaseUrl && (
            <a
              href={item.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors backdrop-blur-sm"
              title="Purchase Link"
            >
              <ExternalLink className="w-3.5 h-3.5 text-foreground-soft hover:text-accent-purple" />
            </a>
          )}
          <button
            onClick={handleToggleOwnership}
            disabled={isUpdating}
            className={`p-1.5 rounded-full transition-colors border ${
              isUpdating ? 'bg-background/80 text-muted-foreground cursor-not-allowed border-border' :
              item.isOwned
                ? 'bg-green-100/80 text-green-700 hover:bg-green-200/80 border-green-200/80'
                : 'bg-blue-100/80 text-blue-700 hover:bg-blue-200/80 border-blue-200/80'
            } backdrop-blur-sm`}
            title={item.isOwned ? 'Owned' : 'Want to Buy'}
          >
            {isUpdating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : item.isOwned ? (
              <CircleCheck className="w-3.5 h-3.5" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        
        <div className="absolute bottom-2 right-2 z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{item.name}&quot;? This action cannot be undone and will remove it from any outfits it belongs to.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className={`p-3 ${viewMode === 'stack' ? 'flex-1' : ''}`}>
        <div className="flex items-center justify-between gap-1">
          <h3 className="font-medium text-sm group-hover:text-accent-purple transition-colors line-clamp-1">
            {item.name}
          </h3>
          
          {viewMode !== 'stack' && tags.length > 0 && (
            <div className="flex flex-shrink-0 gap-1 ml-1">
              {tags.slice(0, 1).map((tag: { name: string }) => (
                <span
                  key={tag.name}
                  className="px-1.5 py-0.5 text-[10px] bg-accent-purple/20 rounded text-foreground-soft whitespace-nowrap"
                >
                  {tag.name}
                </span>
              ))}
              {tags.length > 1 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-accent-blue/10 rounded text-foreground-soft whitespace-nowrap">
                  +{tags.length - 1}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center text-xs mb-1 mt-0.5">
          <span className="capitalize text-muted-foreground/80">{item.category}</span>
          <span className="px-1">•</span>
          {item.brand && (
            <span className="text-foreground-soft">{item.brand}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center p-3 pt-0">
         <PriceDisplay
           amount={item.price}
           currency={item.priceCurrency || 'INR'}
           userCurrency={currency}
           showTooltip={true}
           className="text-sm font-semibold"
         />
      </div>
    </div>
  )
} 