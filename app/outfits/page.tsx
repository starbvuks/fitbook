'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from 'next-auth/react'
import { 
  Plus, 
  Filter, 
  Search, 
  Star, 
  Download,
  Share2,
  Heart,
  Calendar,
  Tag,
  DollarSign,
  Pencil,
  Trash2,
  LayoutGrid,
  LayoutList,
  User as UserIcon,
  Bookmark,
  BookmarkX,
  Loader2,
  ChevronDown
} from 'lucide-react'
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
} from "../../components/ui/alert-dialog"
import {
  SegmentedControl,
  SegmentedControlItem
} from "../components/ui/segmented-control"
import type {
  Outfit,
  Season,
  Occasion,
  Currency,
  User,
  SeasonName,
  OccasionName
} from '@/app/models/types'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { formatCurrency, getMaxPriceForCurrency } from '@/lib/currency'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'
import OutfitCard from '@/app/components/OutfitCard'
import { cn } from '@/lib/utils'
import SkeletonCard from '@/app/components/SkeletonCard'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { debounce } from 'lodash'
import { useRouter } from 'next/navigation'

const SEASONS: SeasonName[] = ['spring', 'summer', 'fall', 'winter']
const OCCASIONS: OccasionName[] = ['casual', 'formal', 'business', 'party', 'sport', 'beach', 'evening', 'wedding']

// Define DisplayOutfit locally
type DisplayOutfit = Outfit & { isSaved: boolean };

// Skeleton Loader Component for Outfits
function OutfitsSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  const count = viewMode === 'grid' ? 8 : 5; 
  const skeletonViewMode = viewMode === 'grid' ? 'large' : 'stack'; // Map to SkeletonCard viewMode

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} viewMode={skeletonViewMode} />
        ))}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} viewMode={skeletonViewMode} />
      ))}
    </div>
  );
}

export default function OutfitsPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const router = useRouter()

  const [myOutfits, setMyOutfits] = useState<Outfit[]>([])
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([])
  const [displayMode, setDisplayMode] = useState<'myOutfits' | 'savedOutfits' | 'all'>('myOutfits')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeasons, setSelectedSeasons] = useState<SeasonName[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<OccasionName[]>([])
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recent' | 'price' | 'rating'>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [maxPriceLimit, setMaxPriceLimit] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // --- Pagination State --- 
  const [myOutfitsCursor, setMyOutfitsCursor] = useState<string | null>(null)
  const [savedOutfitsCursor, setSavedOutfitsCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  // We need separate cursors if we fetch 'My' and 'Saved' separately
  // For 'All' view, we might need a combined fetch or handle pagination carefully
  // Let's simplify: Fetch all initially, implement scroll only if viewFilter is 'my' or 'saved'?
  // Or: Fetch only the *active* filter type with pagination.
  // Let's try fetching the active filter type paginated.
  // --- End Pagination State ---

  // Combined loading state
  const loadingOutfits = loading;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch user profile')
        }
        const data = await response.json()
        const userCurrency = data.currency || 'INR'
        setCurrency(userCurrency)
        const maxPriceValue = await getMaxPriceForCurrency(userCurrency)
        setMaxPriceLimit(maxPriceValue * 3)
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setCurrency('INR')
        setMaxPriceLimit(3000000) // Default maximum for outfits (3 million rupees)
      }
    }

    fetchUserProfile()
  }, [])

  // --- Update Fetch Logic for Pagination --- 
  const fetchOutfitsData = useCallback(async (filterType: 'my' | 'saved', cursor: string | null, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const endpoint = filterType === 'my' ? '/api/outfits' : '/api/outfits/saved';
    const params = new URLSearchParams();
    params.set('limit', '20'); // Example limit
    if (append && cursor) params.set('cursor', cursor);

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch ${filterType} outfits`);
      }
      const data = await response.json(); // Expects { outfits: Outfit[] | SavedOutfitStub[], nextCursor: string | null }

      if (filterType === 'my') {
        setMyOutfits(prev => append ? [...prev, ...data.outfits] : data.outfits);
        setMyOutfitsCursor(data.nextCursor);
      } else {
        setSavedOutfits(prev => append ? [...prev, ...data.outfits] : data.outfits);
        setSavedOutfitsCursor(data.nextCursor);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Clear relevant state on error?
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch based on viewFilter
  useEffect(() => {
    if (displayMode === 'myOutfits') {
      fetchOutfitsData('my', null);
    } else if (displayMode === 'savedOutfits') {
      fetchOutfitsData('saved', null);
    } else { // 'all' - Fetch both without pagination for now
      setLoading(true);
      Promise.all([
        fetch('/api/outfits?limit=100').then(res => res.ok ? res.json() : {outfits: []}), // Fetch a large number initially
        fetch('/api/outfits/saved?limit=100').then(res => res.ok ? res.json() : {outfits: []})
      ]).then(([myData, savedData]) => {
        setMyOutfits(myData.outfits || []);
        setSavedOutfits(savedData.outfits || []);
        // No cursors for 'all' view currently
        setMyOutfitsCursor(null);
        setSavedOutfitsCursor(null);
      }).catch(err => {
         setError('Failed to fetch all outfits');
      }).finally(() => setLoading(false));
    }
    // Reset items when filter changes to avoid showing wrong data during load
    // If fetching only active: 
    // setItemsToShow([]); // New state variable needed
    // setCursor(null); 
  }, [displayMode, fetchOutfitsData]);

  // --- Infinite Scroll Observer --- 
  useEffect(() => {
    const currentCursor = displayMode === 'myOutfits' ? myOutfitsCursor : savedOutfitsCursor;
    // Only fetch if not loading, cursor exists, and not in 'all' mode (fetch isn't designed for 'all')
    if (loadingMore || !currentCursor || displayMode === 'all') return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && currentCursor && !loadingMore) {
          // Map displayMode to the expected argument type for fetchOutfitsData
          const fetchType = displayMode === 'myOutfits' ? 'my' : 'saved'; 
          fetchOutfitsData(fetchType, currentCursor, true); // Pass true to append
        }
      },
      { threshold: 0.5 } 
    );

    observerRef.current = observer;
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [displayMode, myOutfitsCursor, savedOutfitsCursor, loadingMore, fetchOutfitsData]);
  // --- End Infinite Scroll Observer ---

  // Determine which outfits to display based on the mode
  const outfitsToDisplay: DisplayOutfit[] = useMemo(() => {
    switch (displayMode) {
      case 'myOutfits':
        return myOutfits.map(o => ({...o, isSaved: false}));
      case 'savedOutfits':
        return savedOutfits.map(o => ({...o, isSaved: true}));
      case 'all':
        // Combine and deduplicate
        const combined = [...myOutfits.map(o => ({...o, isSaved: false})), ...savedOutfits.map(o => ({...o, isSaved: true}))];
        const uniqueOutfits = Array.from(new Map(combined.map(o => [o.id, o])).values());
        return uniqueOutfits;
      default:
        return myOutfits.map(o => ({...o, isSaved: false}));
    }
  }, [displayMode, myOutfits, savedOutfits]);

  // Apply filters and sorting to the selected list
  const filteredOutfits = outfitsToDisplay.filter(outfit => {
    if (selectedSeasons.length > 0 && !outfit.seasons.some(season => selectedSeasons.includes(season.name))) {
      return false
    }
    if (selectedOccasions.length > 0 && !outfit.occasions.some(occasion => selectedOccasions.includes(occasion.name))) {
      return false
    }
    if (searchQuery && !outfit.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.totalCost - b.totalCost
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) { 
      setMinPrice(value);
    }
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setMaxPrice(value);
    }
  };

  // Function to unsave an outfit (used for saved outfits)
  const handleUnsaveOutfit = async (outfitId: string) => {
    // Optimistic UI update - remove from saved list
    const originalSavedOutfits = [...savedOutfits];
    setSavedOutfits(prev => prev.filter(o => o.id !== outfitId));

    try {
      const response = await fetch(`/api/outfits/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to unsave outfit');
      }
      const result = await response.json();
      if (result.saved === false) {
        toast({
          title: 'Outfit Unsaved',
          description: 'Removed from your saved list.',
        });
      } else {
         // Should not happen in this flow, but handle unexpected success
         console.warn("API indicated outfit was saved during an unsave operation.");
         setSavedOutfits(originalSavedOutfits); // Revert
         toast({ title: "Error", description: "Unexpected response from server.", variant: "destructive" });
      }

    } catch (error) {
      console.error('Error unsaving outfit:', error);
      // Revert UI on error
      setSavedOutfits(originalSavedOutfits);
      toast({
        title: 'Error Unsaving Outfit',
        description: error instanceof Error ? error.message : 'Could not unsave outfit.',
        variant: 'destructive',
      });
    } 
  }

  // Updated Delete Handler (only for owned outfits)
  const handleDeleteOutfit = async (outfitId: string) => {
      const isMyOutfit = myOutfits.some(o => o.id === outfitId);
      
      if (!isMyOutfit) {
          toast({ title: "Cannot Delete", description: "This action is not allowed here.", variant: "destructive" });
          return; // Should not be callable if UI is correct, but safe guard
      }
  
      // Optimistic UI update - remove from myOutfits and potentially savedOutfitsList
      const originalMyOutfits = [...myOutfits];
      const originalSavedOutfits = [...savedOutfits];
      setMyOutfits(prev => prev.filter(o => o.id !== outfitId));
      setSavedOutfits(prev => prev.filter(o => o.id !== outfitId)); // Also remove if saved
      
      try {
          const response = await fetch(`/api/outfits/${outfitId}`, {
              method: 'DELETE',
          });
  
          if (!response.ok) {
              const error = await response.json().catch(() => ({}));
              throw new Error(error.message || 'Failed to delete outfit from server');
          }
  
          toast({
              title: 'Outfit deleted',
              description: 'Successfully removed from your outfits.',
          });
  
      } catch (error) {
          console.error('Error deleting outfit:', error);
          // Revert UI on error
          setMyOutfits(originalMyOutfits);
          setSavedOutfits(originalSavedOutfits);
          toast({
              title: 'Error Deleting Outfit',
              description: error instanceof Error ? error.message : 'Could not delete outfit.',
              variant: 'destructive',
          });
      } 
  }

  const handleShareOutfit = (outfitId: string) => {
    // Create the outfit URL
    const outfitUrl = `${window.location.origin}/outfits/${outfitId}`
    
    // Copy to clipboard
    navigator.clipboard.writeText(outfitUrl)
      .then(() => {
        toast({
          title: 'Link copied',
          description: 'Outfit link copied to clipboard',
        })
      })
      .catch(err => {
        console.error('Failed to copy: ', err)
        toast({
          title: 'Error',
          description: 'Failed to copy link to clipboard',
          variant: 'destructive',
        })
      })
  }

  const showFilterControls = outfitsToDisplay.length > 0 && !loading

  const handleCardClick = () => {
    setIsNavigating(true);
  };

  if (error) {
  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loader during navigation
  if (isNavigating) {
    return (
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5">Outfits</h1>
            <SegmentedControl 
              value={displayMode}
              onValueChange={(value: string) => setDisplayMode(value as 'myOutfits' | 'savedOutfits' | 'all')}
              className="w-fit"
            >
              <SegmentedControlItem value="myOutfits">
                <UserIcon className="h-4 w-4 mr-1.5" /> My Outfits
              </SegmentedControlItem>
              <SegmentedControlItem value="savedOutfits">
                <Bookmark className="h-4 w-4 mr-1.5" /> Saved
              </SegmentedControlItem>
              <SegmentedControlItem value="all">
                All
              </SegmentedControlItem>
            </SegmentedControl>
          </div>
          <p className="text-sm text-muted-foreground">
            Displaying {filteredOutfits.length} outfits
          </p>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search outfits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
              
              <Link
                href="/outfits/create"
                className="btn btn-primary h-9 px-4 flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Create Outfit</span>
                <span className="sm:hidden">Create</span>
              </Link>
          </div>
        </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSeasons([])}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedSeasons.length === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-accent border border-border'
                }`}
              >
                All Seasons
              </button>
              {SEASONS.map((season) => (
                <button
                  key={season}
                  onClick={() => {
                    setSelectedSeasons(prev =>
                      prev.includes(season)
                        ? prev.filter(s => s !== season)
                        : [...prev, season]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                    selectedSeasons.includes(season)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-accent border border-border'
                  }`}
                >
                  {season}
                </button>
              ))}
              </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedOccasions([])}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedOccasions.length === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-accent border border-border'
                }`}
              >
                All Occasions
              </button>
              {OCCASIONS.map((occasion) => (
                <button
                        key={occasion}
                  onClick={() => {
                    setSelectedOccasions(prev =>
                      prev.includes(occasion)
                        ? prev.filter(o => o !== occasion)
                        : [...prev, occasion]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                    selectedOccasions.includes(occasion)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-accent border border-border'
                  }`}
                      >
                        {occasion}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                sortBy === 'recent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              Most Recent
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                sortBy === 'price'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                sortBy === 'rating'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              Rating
            </button>
                  </div>
                </div>

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Outfits Grid/List */}
        {loading ? (
          <OutfitsSkeleton viewMode={viewMode} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-foreground-soft">{error}</p>
          </div>
        ) : filteredOutfits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground-soft mb-4">
              {displayMode === 'savedOutfits' 
                ? "You haven't saved any outfits yet." 
                : "No outfits found matching your criteria."
              }
            </p>
            {displayMode !== 'savedOutfits' && (
               <Link href="/outfits/create" className="btn btn-primary py-2 px-4 rounded-full">
              Create Your First Outfit
            </Link>
            )}
             {displayMode === 'savedOutfits' && (
               <Link href="/discover" className="btn btn-secondary py-2 px-4 rounded-full">
                 Discover Outfits
               </Link>
            )}
          </div>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredOutfits.map((outfit) => {
              const isOwned = outfit.userId === userId;
              const showDelete = isOwned;
              const isSaved = savedOutfits.some(saved => saved.id === outfit.id);
              const showUnsave = !isOwned && isSaved;

              return (
                <div key={outfit.id} className="group relative">
                  {/* Delete Button (Owned) */}
                  {showDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                          aria-label="Delete outfit"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Outfit</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDeleteOutfit(outfit.id); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {/* Unsave Button (Saved but not Owned) */}
                  {showUnsave && (
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                           className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                           aria-label="Unsave outfit"
                         >
                           <BookmarkX className="w-4 h-4 text-blue-500" />
                         </button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Unsave Outfit</AlertDialogTitle>
                           <AlertDialogDescription>
                             Remove this outfit from your saved list?
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction
                             onClick={(e) => { e.preventDefault(); handleUnsaveOutfit(outfit.id); }}
                             className="bg-blue-500 text-white hover:bg-blue-600"
                           >
                             Unsave
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                  )}
                  
                  {/* Outfit Card Link */}
                  <Link 
                    href={`/outfits/${outfit.id}`} 
                    className="block" 
                    onClick={handleCardClick}
                   >
                    <OutfitCard
                      outfit={outfit}
                      currency={currency}
                      viewMode={viewMode}
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* --- Load More Trigger / Spinner --- */}
        {/* Show only when not in 'all' view and there's a cursor */}
        {displayMode !== 'all' && (displayMode === 'myOutfits' ? myOutfitsCursor : savedOutfitsCursor) && (
           <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
             {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
           </div>
        )}
        {/* --- End Load More Trigger --- */}

      </div>
    </div>
  )
} 