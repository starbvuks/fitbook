'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from 'next-auth/react'
import { debounce } from 'lodash'
import { 
  ArrowUp,
  BookmarkPlus,
  Search,
  BookmarkX,
  User,
  ChevronDown,
  Loader2 // Added for loading states
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip"
import type { Outfit, Currency, ClothingItem, User as UserType, OutfitItem } from '@/app/models/types' // Import OutfitItem
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'
import { cn } from '@/lib/utils'
import SkeletonCard from '@/app/components/SkeletonCard' // Import SkeletonCard

// Define a type for the augmented outfit data coming from the public API
interface PublicOutfit extends Omit<Outfit, 'user'> { // Omit the original 'user' field
  // Redefine user to match the API's select structure and ensure ID exists
  user?: {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  } | null; // Allow user to be explicitly null if not included
  upvoteCount: number;
  hasUpvoted: boolean;
  hasSaved: boolean;
}

// Skeleton Loader Component for Discover
function DiscoverSkeleton() {
  return (
    <div className="mt-12 sm:mt-0 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4">
      {Array.from({ length: 10 }).map((_, index) => ( // Show 10 skeletons initially
        <div key={index} className="rounded-xl border border-border overflow-hidden animate-pulse bg-neutral-800/50">
          <div className="aspect-[1/1] sm:aspect-[3/4] bg-background-soft" />
          <div className="p-2 sm:p-3 space-y-2">
            <div className="h-3 sm:h-4 bg-background-soft rounded w-4/5" />
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-background-soft" />
              <div className="h-2.5 bg-background-soft rounded w-1/2" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="h-2.5 bg-background-soft rounded w-1/4" />
              <div className="h-3 w-8 bg-background-soft rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DiscoverPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [outfits, setOutfits] = useState<PublicOutfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  // Keep track of outfits currently being processed for upvote/save
  const [processingUpvote, setProcessingUpvote] = useState<Set<string>>(new Set())
  const [processingSave, setProcessingSave] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Function to fetch outfits with optional search query
  const fetchOutfits = useCallback(async (query: string = '', isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true)
      setIsSearching(query !== '')
      setOutfits([])
      setNextCursor(null)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const url = `/api/outfits/public?${query ? `query=${encodeURIComponent(query)}` : ''}${isLoadMore && nextCursor ? `&cursor=${nextCursor}` : ''}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch outfits')
      }
      const data = await response.json()
      
      setOutfits(prev => isLoadMore ? [...prev, ...(data.outfits || [])] : (data.outfits || []))
      setNextCursor(data.nextCursor)

    } catch (err) {
      console.error('Error fetching outfits:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      if (!isLoadMore) {
        setLoading(false)
        setIsSearching(false)
      } else {
        setLoadingMore(false)
      }
    }
  }, [nextCursor])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchOutfits(query)
    }, 500),
    [fetchOutfits]
  )

  // Handler for search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setSearchQuery(newQuery);
    setIsSearching(true);
    debouncedSearch(newQuery);
  }

  // Initial fetch
  useEffect(() => {
    fetchOutfits()
  }, [fetchOutfits])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setCurrency(data.currency || 'USD')
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loadingMore || !nextCursor || isSearching) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const observer = new IntersectionObserver(
      async entries => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          await fetchOutfits(searchQuery, true)
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current = observer

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [nextCursor, loadingMore, fetchOutfits, searchQuery, isSearching])

  const handleOutfitClick = (outfitId: string) => {
    setIsNavigating(true);
  };

  const handleToggleUpvote = async (outfitId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      toast({ title: 'Sign in required', description: 'Please sign in to upvote outfits' })
      return
    }
    if (processingUpvote.has(outfitId)) return; // Prevent multiple clicks

    const originalOutfits = [...outfits]
    const outfitIndex = outfits.findIndex(o => o.id === outfitId)
    if (outfitIndex === -1) return;

    const originalOutfit = outfits[outfitIndex]
    const optimisticUpvoted = !originalOutfit.hasUpvoted
    const optimisticCount = originalOutfit.upvoteCount + (optimisticUpvoted ? 1 : -1)

    // Optimistic UI Update
    setProcessingUpvote(prev => new Set(prev).add(outfitId))
    setOutfits(prev => 
      prev.map(o => 
        o.id === outfitId 
          ? { ...o, hasUpvoted: optimisticUpvoted, upvoteCount: optimisticCount } 
          : o
      )
    )

    try {
      const response = await fetch('/api/outfits/toggle-upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId })
      })

      if (!response.ok) throw new Error('Failed to toggle upvote')

      const result = await response.json()
      // Optionally update state with server response if needed, but optimistic should suffice
      // console.log('Upvote toggled:', result)

    } catch (err) {
      console.error('Error toggling upvote:', err)
      // Revert optimistic update on error
      setOutfits(originalOutfits)
      toast({ title: 'Error', description: 'Failed to update vote', variant: 'destructive' })
    } finally {
      setProcessingUpvote(prev => {
        const newSet = new Set(prev)
        newSet.delete(outfitId)
        return newSet
      })
    }
  }

  const handleToggleSave = async (outfitId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      toast({ title: 'Sign in required', description: 'Please sign in to save outfits' })
      return
    }
     if (processingSave.has(outfitId)) return; // Prevent multiple clicks

    const originalOutfits = [...outfits]
    const outfitIndex = outfits.findIndex(o => o.id === outfitId)
    if (outfitIndex === -1) return;

    const originalOutfit = outfits[outfitIndex]
    const optimisticSaved = !originalOutfit.hasSaved

    // Optimistic UI Update
    setProcessingSave(prev => new Set(prev).add(outfitId))
    setOutfits(prev => 
      prev.map(o => o.id === outfitId ? { ...o, hasSaved: optimisticSaved } : o)
    )

    try {
      const response = await fetch('/api/outfits/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId })
      })

      if (!response.ok) throw new Error('Failed to save outfit')

      const result = await response.json()
      toast({
        title: result.saved ? 'Outfit saved' : 'Outfit unsaved',
        description: result.saved
          ? 'Added to your saved items.'
          : 'Removed from your saved items.',
      })

    } catch (err) {
      console.error('Error saving outfit:', err)
      // Revert optimistic update on error
      setOutfits(originalOutfits)
      toast({ title: 'Error', description: 'Failed to update save status', variant: 'destructive' })
    } finally {
       setProcessingSave(prev => {
        const newSet = new Set(prev)
        newSet.delete(outfitId)
        return newSet
      })
    }
  }

  if (error) {
    //... Error handling ...
  }

  if (isNavigating) {
    return <LoadingOverlay />;
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-4 lg:px-8">
        {/* Header remains the same */}
        <div className="flex flex-col gap-2 sm:gap-4 mb-3 sm:mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-display font-bold">Discover</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative rounded-full border border-border bg-background px-2 sm:px-3 py-1.5 text-sm flex items-center w-[220px] sm:w-[250px]">
                <Search className="h-4 w-4 text-muted-foreground mr-1.5 sm:mr-2" />
                <input 
                  type="text" 
                  placeholder="Search outfits..." 
                  className="bg-transparent outline-none flex-1 text-xs sm:text-sm"
                  value={searchQuery}
                  onChange={handleSearchChange}
                 />
                 {isSearching && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground animate-spin ml-1.5 sm:ml-2" />} 
              </div>
            </div>
          </div>
        </div>

        {/* Masonry Grid / Loading / Empty States */}
        {loading && !isSearching ? (
          <DiscoverSkeleton /> // Use the skeleton loader here
        ) : error ? (
          <div className="text-center py-12 text-red-500"><p>{error}</p></div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-12"><p className="text-muted-foreground mb-4">{searchQuery ? 'No outfits found for your search.' : 'No public outfits found.'}</p></div>
        ) : (
          <div className="mt-12 sm:mt-0 grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 ">
            {outfits.map((outfit) => (
              <div 
                key={outfit.id} 
                className="group relative overflow-hidden rounded-xl border border-border bg-background transition-all hover:shadow-md hover:border-primary"
              >
                <Link 
                  href={`/outfits/${outfit.id}`} 
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => handleOutfitClick(outfit.id)}
                >
                  <div className="aspect-[1/1] sm:aspect-[3/4] relative overflow-hidden">
                    <OutfitThumbnail 
                      items={outfit.items
                        .map(item => item.wardrobeItem)
                        .filter((item): item is ClothingItem => Boolean(item))}
                      className="w-full h-full"
                    />
                    
                    {/* Hover overlay - Only visible on larger screens */} */}
                  </div>
                </Link>
                
                {/* Bottom info bar - Enhanced with more content */}
                <div className="p-2 sm:p-3 space-y-1">
                  <h3 className="font-medium truncate text-xs sm:text-sm">{outfit.name}</h3>
                  
                  {/* Creator info */}
                  {outfit.user && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-background overflow-hidden flex-shrink-0 border border-border">
                        {outfit.user.image ? (
                          <Image
                            src={outfit.user.image}
                            alt={outfit.user.name || 'User'}
                            width={16}
                            height={16}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-2.5 w-2.5 m-0.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {outfit.user?.name || outfit.user?.username || 'Anonymous'}
                      </span>
                    </div>
                  )}
                  
                  {/* Price and actions row */}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs font-medium">
                      {formatPrice(outfit.totalCost, currency)}
                    </p>
                    
                    {/* Action buttons container */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button 
                        onClick={(e) => handleToggleSave(outfit.id, e)}
                        disabled={processingSave.has(outfit.id)}
                        className="p-2 rounded-full hover:bg-background-soft transition-colors"
                        aria-label={outfit.hasSaved ? "Unsave outfit" : "Save outfit"}
                      >
                        {processingSave.has(outfit.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : outfit.hasSaved ? (
                          <BookmarkX className="h-4 w-4 text-blue-500" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      
                      {/* Upvote Button */}
                      <button 
                        onClick={(e) => handleToggleUpvote(outfit.id, e)}
                        disabled={processingUpvote.has(outfit.id)}
                        className={cn(
                          "flex items-center gap-1 p-2 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none",
                          outfit.hasUpvoted
                            ? "text-primary hover:bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        )}
                        aria-label="Toggle upvote outfit"
                      >
                        {processingUpvote.has(outfit.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowUp className={cn(
                            "h-4 w-4 transition-all",
                            outfit.hasUpvoted ? "fill-current" : ""
                          )} />
                        )}
                        <span className="text-xs font-medium tabular-nums">{outfit.upvoteCount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load more trigger - optimized for mobile */}
        {nextCursor && !isSearching && (
          <div ref={loadMoreRef} className="py-4 sm:py-8 flex justify-center">
            {loadingMore ? (
              <LoadingSpinner />
            ) : (
              <button 
                onClick={() => fetchOutfits(searchQuery, true)} 
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-full text-muted-foreground hover:text-foreground hover:bg-background-soft transition-colors"
              >
                <span>Load more</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Add a loading overlay component for navigation
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text="Loading outfit..." />
    </div>
  );
}
