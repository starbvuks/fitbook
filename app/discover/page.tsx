'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
import {
  Search,
  Filter,
  Loader2,
  LayoutGrid,
  LayoutList,
  Calendar,
  Tag,
  DollarSign,
  Star,
  User,
  Bookmark
} from 'lucide-react'
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
  SavedOutfitStub, // Reuse this structure
  DisplayOutfit    // Needed for casting to OutfitCard
} from '@/app/models/types'
import { formatPrice, cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import OutfitCard from '@/app/components/OutfitCard'
import { debounce } from 'lodash' // Keep lodash import
import SkeletonCard from '@/app/components/SkeletonCard'

// Constants for filters (can be shared if needed)
const SEASONS: SeasonName[] = ['spring', 'summer', 'fall', 'winter']
// Fetch occasions dynamically or define statically if stable
// const OCCASIONS: OccasionName[] = ['casual', ...]

// Define the type for fetched public outfits - should match API select
interface PublicOutfitDisplay extends SavedOutfitStub {
  isSavedByCurrentUser: boolean;
  // Add firstSeason, firstOccasion etc. if fetched from API
}

// --- Add Skeleton Loader Component --- 
function DiscoverSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  const count = viewMode === 'grid' ? 8 : 5;
  const skeletonViewMode = viewMode === 'grid' ? 'large' : 'stack';

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
// --- End Skeleton Loader Component ---

export default function DiscoverPage() {
  const { toast } = useToast()
  const [outfits, setOutfits] = useState<PublicOutfitDisplay[]>([]) // Use new type
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ currency: Currency } | null>(null); // Fetch profile for currency
  const [occasions, setOccasions] = useState<Occasion[]>([]) // Fetch dynamic occasions
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeasons, setSelectedSeasons] = useState<SeasonName[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<OccasionName[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'popular'>('recent') // Add 'popular' maybe?
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [nextCursor, setNextCursor] = useState<string | null>(null) // For infinite scroll
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  // Fetch profile for currency format
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile({ currency: data.currency || 'INR' });
        } else { setProfile({ currency: 'INR' }); }
      } catch (err) { 
        console.error("Error fetching profile:", err); 
        setProfile({ currency: 'INR' }); 
      }
    };
    fetchProfile();
  }, []);

  // Fetch dynamic occasions
   useEffect(() => {
    const fetchOccasions = async () => {
      try {
        const response = await fetch('/api/occasions');
        if (response.ok) {
          const data = await response.json();
          setOccasions(data || []);
        } else { console.warn('Failed to fetch occasions'); }
      } catch (err) { console.error("Error fetching occasions:", err); }
    };
    fetchOccasions();
  }, []);

  // Debounced fetch function - update to send filters
  const fetchPublicOutfits = useCallback(debounce(async (filters, append = false) => {
    if (!append) setLoading(true);
    else setIsFetchingMore(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('limit', '20');
    if (filters.search) params.set('search', filters.search);
    if (filters.cursor && append) params.set('cursor', filters.cursor);
    // --- Send filter params --- 
    filters.seasons?.forEach((s: SeasonName) => params.append('season', s));
    filters.occasions?.forEach((o: OccasionName) => params.append('occasion', o));
    if (filters.sortBy) params.set('sort', filters.sortBy);
    // --- End Send filter params ---

    try {
      const response = await fetch(`/api/outfits/public?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch public outfits');
      }
      const data = await response.json(); 

      setOutfits(prev => append ? [...prev, ...data.outfits] : data.outfits);
      setNextCursor(data.nextCursor);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, 500), []); // Add dependencies if needed, e.g., [toast]

  // Initial fetch and fetch on filter changes - ensure filters are passed
  useEffect(() => {
    // Pass the current filter states to the fetch function
    fetchPublicOutfits({ 
      search: searchQuery, 
      seasons: selectedSeasons, 
      occasions: selectedOccasions, 
      sortBy: sortBy, 
      cursor: null 
    });
  }, [searchQuery, selectedSeasons, selectedOccasions, sortBy, fetchPublicOutfits]);

  // --- Add Save/Unsave Handlers ---
  const handleSaveOutfit = async (outfitId: string) => {
    setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isSavedByCurrentUser: true } : o));
    try {
      const response = await fetch(`/api/outfits/${outfitId}/save`, { method: 'POST' });
      if (!response.ok) {
         setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isSavedByCurrentUser: false } : o));
         const error = await response.json().catch(() => ({}));
          if (response.status === 200 && error.message === 'Outfit already saved') {
             toast({ title: 'Already Saved', description: 'This outfit is already in your list.' });
             // Keep optimistic update
             return;
          }
         throw new Error(error.message || 'Failed to save');
      }
       toast({ title: 'Outfit Saved' });
    } catch (error) {
       console.error('Error saving outfit:', error);
       setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isSavedByCurrentUser: false } : o));
       toast({ title: 'Error Saving', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleUnsaveOutfit = async (outfitId: string) => {
    setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isSavedByCurrentUser: false } : o));
     try {
      const response = await fetch(`/api/outfits/${outfitId}/save`, { method: 'DELETE' });
       if (!response.ok) {
           setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isSavedByCurrentUser: true } : o));
           const error = await response.json().catch(() => ({}));
           if (response.status === 404) { // Not found means it wasn't saved
              toast({ title: 'Not Saved', description: 'This outfit wasn\'t in your saved list.' });
              // Keep optimistic update
              return;
           }
           throw new Error(error.message || 'Failed to unsave');
       }
       toast({ title: 'Outfit Unsaved' });
     } catch (error) {
       console.error('Error unsaving outfit:', error);
       setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isSavedByCurrentUser: true } : o));
       toast({ title: 'Error Unsaving', description: (error as Error).message, variant: 'destructive' });
     }
  };
  // --- End Save/Unsave Handlers ---

  // Filter logic (client-side for now, can be moved server-side later)
  const filteredAndSortedOutfits = useMemo(() => {
    // Basic search filter already applied by API
    // Add client-side season/occasion filter if needed, though ideally done server-side
    return outfits.sort((a, b) => {
        switch (sortBy) {
          case 'rating': return (b.rating || 0) - (a.rating || 0);
          // case 'popular': // Needs save count from API
          case 'recent': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [outfits, selectedSeasons, selectedOccasions, sortBy]);

  // Infinite scroll handler
  const loadMore = () => {
    if (nextCursor && !isFetchingMore) {
      fetchPublicOutfits({ search: searchQuery, seasons: selectedSeasons, occasions: selectedOccasions, sortBy, cursor: nextCursor }, true);
    }
  };

  // TODO: Add intersection observer for infinite scroll

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
        {/* Header & Search/Controls */} 
        <div className="flex flex-col gap-4 mb-6">
           <div>
             <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5">Discover Outfits</h1>
             <p className="text-sm text-muted-foreground">Explore outfits shared by the community.</p>
           </div>
           {/* Search and View Mode */} 
           <div className="flex flex-col sm:flex-row gap-3">
             {/* Search Input */} 
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input
                 type="text"
                 placeholder="Search public outfits..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 pr-4 py-2"
               />
             </div>
              {/* View Toggle */} 
             <div className="flex items-center flex-shrink-0 gap-1 bg-card rounded-lg border border-border p-1">
                 {/* Grid/List Buttons */} 
             </div>
           </div>
           {/* Filters: Seasons */} 
           <div className="flex flex-wrap items-center gap-2">
                <Button variant={selectedSeasons.length === 0 ? 'default' : 'outline'} onClick={() => setSelectedSeasons([])} className="h-8 rounded-full px-3 text-xs">All Seasons</Button>
                {SEASONS.map((season) => (
                    <Button 
                        key={season} 
                        variant={selectedSeasons.includes(season) ? 'default' : 'outline'} 
                        onClick={() => {
                            setSelectedSeasons(prev =>
                                prev.includes(season)
                                    ? prev.filter(s => s !== season)
                                    : [...prev, season]
                            )
                        }} 
                        className="h-8 rounded-full px-3 text-xs capitalize"
                    >
                        {season}
                    </Button>
                ))}
           </div>
            {/* Filters: Occasions */} 
           <div className="flex flex-wrap items-center gap-2">
                <Button variant={selectedOccasions.length === 0 ? 'default' : 'outline'} onClick={() => setSelectedOccasions([])} className="h-8 rounded-full px-3 text-xs">All Occasions</Button>
                {occasions.map((occasion) => (
                    <Button 
                      key={occasion.id} 
                      variant={selectedOccasions.includes(occasion.name) ? 'default' : 'outline'} 
                      onClick={() => {
                          setSelectedOccasions(prev =>
                              prev.includes(occasion.name)
                                  ? prev.filter(o => o !== occasion.name)
                                  : [...prev, occasion.name]
                          )
                      }} 
                      className="h-8 rounded-full px-3 text-xs capitalize"
                    >
                      {occasion.name}
                    </Button>
                ))}
           </div>
            {/* Filters: Sort */} 
           <div className="flex flex-wrap items-center gap-2">
                <Button variant={sortBy === 'recent' ? 'default' : 'outline'} onClick={() => setSortBy('recent')} className="h-8 rounded-full px-3 text-xs">Most Recent</Button>
                <Button variant={sortBy === 'rating' ? 'default' : 'outline'} onClick={() => setSortBy('rating')} className="h-8 rounded-full px-3 text-xs">Top Rated</Button>
                {/* <Button variant={sortBy === 'popular' ? 'default' : 'outline'} onClick={() => setSortBy('popular')} className="h-8 rounded-full px-3 text-xs">Most Popular</Button> */} 
           </div>
        </div>

        <div className="h-px bg-border mb-6" />

        {/* Content Area */} 
        {loading && outfits.length === 0 ? (
          <DiscoverSkeleton viewMode={viewMode} /> // Initial loading skeleton
        ) : error ? (
          <div className="text-center py-12 text-destructive">Error: {error}</div>
        ) : filteredAndSortedOutfits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No public outfits found matching your criteria.</div>
        ) : (
          <>
            <div className={`grid gap-4 ${ 
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1' 
            }`}>
              {filteredAndSortedOutfits.map((outfit) => (
                 // Use OutfitCard, passing save/unsave based on isSavedByCurrentUser
                 <OutfitCard
                    key={outfit.id}
                    // Cast needed as PublicOutfitDisplay is slightly different
                    outfit={outfit as unknown as DisplayOutfit}
                    currency={profile?.currency || 'INR'}
                    viewMode={viewMode}
                    onSave={!outfit.isSavedByCurrentUser ? handleSaveOutfit : undefined}
                    onUnsave={outfit.isSavedByCurrentUser ? handleUnsaveOutfit : undefined}
                    // onDelete={undefined} // Cannot delete public outfits
                    // onShare={handleShareOutfit} // Can add share later
                 />
              ))}
            </div>
            {/* Loading More Spinner & Button */} 
            {isFetchingMore && (
               <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            )}
            {nextCursor && !isFetchingMore && (
              <div className="flex justify-center py-6">
                 <Button variant="outline" onClick={loadMore}>Load More</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 