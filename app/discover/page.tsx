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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, index) => ( // Show 12 skeletons initially
        <SkeletonCard key={index} viewMode="large" />
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
    //... Navigation loading ...
  }

  return (
    <div className="min-h-screen pt-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Header remains the same */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Discover</h1>
            <div className="flex items-center gap-4">
              <div className="relative rounded-full border border-border bg-background px-3 py-1.5 text-sm flex items-center w-[250px]">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <input 
                  type="text" 
                  placeholder="Search outfits or users..." 
                  className="bg-transparent outline-none flex-1"
                  value={searchQuery}
                  onChange={handleSearchChange}
                 />
                 {isSearching && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin ml-2" />} 
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {outfits.map((outfit) => (
              <div 
                key={outfit.id} 
                className="group relative overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-primary"
              >
                <Link 
                  href={`/outfits/${outfit.id}`} 
                  className="block"
                  onClick={() => handleOutfitClick(outfit.id)}
                >
                  <div className="aspect-[3/4] sm:aspect-auto relative overflow-hidden">
                    <OutfitThumbnail 
                      items={outfit.items
                        .map(item => item.wardrobeItem)
                        .filter((item): item is ClothingItem => Boolean(item))}
                      className="w-full h-full"
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                      <div className="flex justify-end space-x-1.5">
                        {/* Save Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={(e) => handleToggleSave(outfit.id, e)}
                                disabled={processingSave.has(outfit.id)} // Disable while processing
                                className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                              >
                                {processingSave.has(outfit.id) ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : outfit.hasSaved ? (
                                  <BookmarkX className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <BookmarkPlus className="h-5 w-5" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{outfit.hasSaved ? 'Unsave outfit' : 'Save outfit'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <h3 className="text-white font-medium truncate">{outfit.name}</h3>
                        {outfit.user && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-6 w-6 rounded-full bg-background overflow-hidden flex-shrink-0 border border-border">
                              {outfit.user.image ? (
                                <Image
                                  src={outfit.user.image}
                                  alt={outfit.user.name || 'User'}
                                  width={24}
                                  height={24}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4 m-1 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-white text-sm truncate">
                              {outfit.user?.name || outfit.user?.username || 'Anonymous'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Bottom info bar */}
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium truncate text-sm">{outfit.name}</h3>
                    <p className="text-muted-foreground text-xs">
                      {formatPrice(outfit.totalCost, currency)}
                    </p>
                  </div>
                  
                  {/* Upvote Button */}
                  <button 
                    onClick={(e) => handleToggleUpvote(outfit.id, e)}
                    disabled={processingUpvote.has(outfit.id)} // Disable while processing
                    className={cn(
                      "flex items-center gap-1.5 p-1.5 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none",
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
            ))}
          </div>
        )}
        
        {/* Load more trigger remains the same */}
        {nextCursor && !isSearching && (
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {loadingMore ? (
              <LoadingSpinner />
            ) : (
              <button onClick={() => fetchOutfits(searchQuery, true)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <span>Load more</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
