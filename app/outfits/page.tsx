'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
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
  User,
  Bookmark
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { 
  Outfit, 
  Season, 
  Occasion, 
  Currency, 
  ClothingItem, 
  SeasonName, 
  OccasionName,
  SavedOutfitStub,
  DisplayOutfit
} from '@/app/models/types'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { formatCurrency, getMaxPriceForCurrency } from '@/lib/currency'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'
import OutfitCard from '@/app/components/OutfitCard'
import { cn } from '@/lib/utils'
import SkeletonCard from '@/app/components/SkeletonCard'

const SEASONS: SeasonName[] = ['spring', 'summer', 'fall', 'winter']
const OCCASIONS: OccasionName[] = ['casual', 'formal', 'business', 'party', 'sport', 'beach', 'evening', 'wedding']

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
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
  const [myOutfits, setMyOutfits] = useState<Outfit[]>([])
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfitStub[]>([])
  const [viewFilter, setViewFilter] = useState<'all' | 'my' | 'saved'>('all')

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

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [profileResponse, myOutfitsResponse, savedOutfitsResponse, seasonsResponse, occasionsResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/outfits'),
          fetch('/api/outfits/saved'),
          fetch('/api/seasons'),
          fetch('/api/occasions')
        ])

        if (!profileResponse.ok) throw new Error('Failed to fetch profile')
        const profileData = await profileResponse.json()
        if (isMounted) setCurrency(profileData.currency || 'INR')

        if (seasonsResponse.ok) {
          const seasonsData = await seasonsResponse.json()
          if (isMounted) setSeasons(seasonsData || [])
        } else { console.warn('Failed to fetch seasons') }

        if (occasionsResponse.ok) {
          const occasionsData = await occasionsResponse.json()
          if (isMounted) setOccasions(occasionsData || [])
        } else { console.warn('Failed to fetch occasions') }

        if (myOutfitsResponse.ok) {
          const myOutfitsData = await myOutfitsResponse.json()
          if (isMounted) setMyOutfits(myOutfitsData.outfits || [])
        } else { console.warn('Failed to fetch your outfits') }
        
        if (savedOutfitsResponse.ok) {
          const savedOutfitsData = await savedOutfitsResponse.json()
          if (isMounted) setSavedOutfits(savedOutfitsData.outfits || [])
        } else { console.warn('Failed to fetch saved outfits') }

      } catch (error) {
        if (isMounted) {
          console.error('Error fetching data:', error)
          setError(error instanceof Error ? error.message : 'An error occurred')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      isMounted = false;
    }
  }, [])

  const outfitsToDisplay: DisplayOutfit[] = useMemo(() => {
    const myDisplay: DisplayOutfit[] = myOutfits.map(o => ({...o, isSaved: false}));
    const savedDisplay: DisplayOutfit[] = savedOutfits.map(o => ({...o, isSaved: true}));
    
    if (viewFilter === 'my') return myDisplay;
    if (viewFilter === 'saved') return savedDisplay;
    
    const combined = [...myDisplay, ...savedDisplay];
    const uniqueMap = new Map<string, DisplayOutfit>();
    combined.forEach(o => uniqueMap.set(o.id, o));
    return Array.from(uniqueMap.values());
  }, [myOutfits, savedOutfits, viewFilter]);

  const filteredAndSortedOutfits = outfitsToDisplay.filter(outfit => {
    if (searchQuery && !outfit.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (viewFilter !== 'saved' && !outfit.isSaved) {
      const fullOutfit = outfit as Outfit; 
      if (selectedSeasons.length > 0 && !fullOutfit.seasons?.some((season: Season) => selectedSeasons.includes(season.name))) {
        return false;
      }
      if (selectedOccasions.length > 0 && !fullOutfit.occasions?.some((occasion: Occasion) => selectedOccasions.includes(occasion.name))) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (viewFilter !== 'saved' && !a.isSaved && !b.isSaved) {
      const outfitA = a as Outfit;
      const outfitB = b as Outfit;
      switch (sortBy) {
        case 'price': return outfitA.totalCost - outfitB.totalCost;
        case 'rating': return (outfitB.rating || 0) - (outfitA.rating || 0);
        case 'recent': default: return new Date(outfitB.createdAt).getTime() - new Date(outfitA.createdAt).getTime();
      }
    }
    if (viewFilter === 'saved' || a.isSaved || b.isSaved) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

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

  const handleDeleteOutfit = async (outfitId: string) => {
    const outfitToDelete = myOutfits.find(o => o.id === outfitId);
    if (!outfitToDelete) return;

    setMyOutfits(prev => prev.filter(o => o.id !== outfitId));

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
        description: 'The outfit was successfully removed.',
      });

    } catch (error) {
      console.error('Error deleting outfit:', error);
      setMyOutfits(prev => [...prev, outfitToDelete].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      toast({
        title: 'Error Deleting Outfit',
        description: error instanceof Error ? error.message : 'Could not delete outfit. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const handleSaveOutfit = async (outfitId: string) => {
    const outfitToSave = outfitsToDisplay.find(o => o.id === outfitId);
    if (!outfitToSave) return; 

    try {
      const response = await fetch(`/api/outfits/${outfitId}/save`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 400 && error.message === 'Cannot save your own outfit') {
           toast({ title: 'Info', description: 'You cannot save your own outfits.' });
           return; 
        }
        if (response.status === 200 && error.message === 'Outfit already saved') {
            toast({
              title: 'Outfit Saved', 
              description: 'This outfit is already in your saved list.'
            });
            return;
        }
        throw new Error(error.message || 'Failed to save outfit');
      }

      toast({
        title: 'Outfit Saved',
        description: 'Successfully added to your saved outfits.',
      });
      
    } catch (error) {
      console.error('Error saving outfit:', error);
      toast({
        title: 'Error Saving Outfit',
        description: error instanceof Error ? error.message : 'Could not save outfit. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const handleUnsaveOutfit = async (outfitId: string) => {
    const outfitToUnsave = savedOutfits.find(o => o.id === outfitId);
    if (!outfitToUnsave) return;

    setSavedOutfits(prev => prev.filter(o => o.id !== outfitId));

    try {
      const response = await fetch(`/api/outfits/${outfitId}/save`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 404) {
           toast({ title: 'Info', description: 'Outfit was not in your saved list.' });
           return;
        }
        throw new Error(error.message || 'Failed to unsave outfit from server');
      }

      toast({
        title: 'Outfit Unsaved',
        description: 'The outfit was successfully removed from your saved list.',
      });

    } catch (error) {
      console.error('Error unsaving outfit:', error);
      setSavedOutfits(prev => [...prev, outfitToUnsave].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      toast({
        title: 'Error Unsaving Outfit',
        description: error instanceof Error ? error.message : 'Could not unsave outfit. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const handleShareOutfit = (outfitId: string) => {
    const outfitUrl = `${window.location.origin}/outfits/${outfitId}`
    
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

  const showFilterControls = myOutfits.length > 0 && !loading

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

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5">My Outfits</h1>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedOutfits.length} outfits · Total value: {formatCurrency(
                filteredAndSortedOutfits.reduce((sum, outfit) => sum + outfit.totalCost, 0),
                currency
              )}
            </p>
          </div>

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

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={viewFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setViewFilter('all')} 
                className="h-8 rounded-full px-3 text-xs"
              >
                All Outfits
              </Button>
              <Button
                variant={viewFilter === 'my' ? 'default' : 'outline'}
                onClick={() => setViewFilter('my')} 
                className="h-8 rounded-full px-3 text-xs"
              >
                <User className="w-3 h-3 mr-1"/> My Outfits
              </Button>
              <Button
                variant={viewFilter === 'saved' ? 'default' : 'outline'}
                onClick={() => setViewFilter('saved')} 
                className="h-8 rounded-full px-3 text-xs"
              >
                <Bookmark className="w-3 h-3 mr-1"/> Saved Outfits
              </Button>
            </div>
          </div>

          <div className={cn("flex flex-wrap items-center gap-2", viewFilter === 'saved' && "opacity-50 pointer-events-none")}>
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

          <div className={cn("flex flex-wrap items-center gap-2", viewFilter === 'saved' && "opacity-50 pointer-events-none")}>
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

          <div className={cn("flex flex-wrap items-center gap-2", viewFilter === 'saved' && "opacity-50 pointer-events-none")}>
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
        </div>

        <div className="h-px bg-border mb-6" />

        {loading ? (
          <OutfitsSkeleton viewMode={viewMode} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-foreground-soft">{error}</p>
          </div>
        ) : filteredAndSortedOutfits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground-soft mb-4">No outfits found</p>
            <Link
              href="/outfits/create"
              className="btn btn-primary py-2 px-4 rounded-full"
            >
              Create Your First Outfit
            </Link>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredAndSortedOutfits.map((outfit) => (
              <div key={outfit.id} className="group relative">
                {!outfit.isSaved && (
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                         <AlertDialogHeader>
                            <AlertDialogTitle>Delete Outfit</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this outfit? This action cannot be undone.
                            </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteOutfit(outfit.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                         </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                 )}
                
                <Link href={`/outfits/${outfit.id}`} className="block">
                  <OutfitCard
                    outfit={outfit}
                    currency={currency}
                    viewMode={viewMode}
                    onDelete={!outfit.isSaved ? handleDeleteOutfit : undefined}
                    onSave={!outfit.isSaved ? handleSaveOutfit : undefined}
                    onUnsave={outfit.isSaved ? handleUnsaveOutfit : undefined}
                    onShare={handleShareOutfit}
                  />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 