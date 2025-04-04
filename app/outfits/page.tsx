'use client'

import { useState, useEffect } from 'react'
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
  Trash2
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
import type { Outfit, Season, Occasion, Currency, ClothingItem } from '@/app/models/types'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { formatCurrency, getMaxPriceForCurrency } from '@/lib/currency'
import OutfitThumbnail from '@/app/components/OutfitThumbnail'

export default function OutfitsPage() {
  const { toast } = useToast()
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeason, setSelectedSeason] = useState<string>('all')
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recent' | 'price' | 'rating'>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [maxPriceLimit, setMaxPriceLimit] = useState<number | null>(null)

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
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // First fetch profile and outfits
        const [profileResponse, outfitsResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/outfits')
        ])

        if (!profileResponse.ok) throw new Error('Failed to fetch profile')
        const profileData = await profileResponse.json()
        setCurrency(profileData.currency || 'INR')

        if (!outfitsResponse.ok) throw new Error('Failed to fetch outfits')
        const outfitsData = await outfitsResponse.json()
        setOutfits(outfitsData.outfits || [])

        // Only fetch seasons and occasions if we have outfits
        if (outfitsData.outfits?.length > 0) {
          const [seasonsResponse, occasionsResponse] = await Promise.all([
            fetch('/api/seasons'),
            fetch('/api/occasions')
          ])

          if (seasonsResponse.ok) {
            const seasonsData = await seasonsResponse.json()
            setSeasons(seasonsData)
          }

          if (occasionsResponse.ok) {
            const occasionsData = await occasionsResponse.json()
            setOccasions(occasionsData)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredOutfits = Array.isArray(outfits) ? outfits.filter(outfit => {
    const matchesSearch = outfit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outfit.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesSeason = selectedSeason === 'all' || outfit.seasons.some(s => s.name === selectedSeason)
    const matchesOccasion = selectedOccasion === 'all' || outfit.occasions.some(o => o.name === selectedOccasion)
    
    const minPriceNum = parseFloat(minPrice)
    const maxPriceNum = parseFloat(maxPrice)
    const matchesPrice = (
      (isNaN(minPriceNum) || outfit.totalCost >= minPriceNum) &&
      (isNaN(maxPriceNum) || outfit.totalCost <= maxPriceNum)
    )
    
    return matchesSearch && matchesSeason && matchesOccasion && matchesPrice
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
  }) : []

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

  const handleShare = async (outfit: Outfit) => {
    try {
      const url = `${window.location.origin}/outfits/${outfit.id}`
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link copied!",
        description: "The outfit URL has been copied to your clipboard.",
        duration: 2000
      })
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: "Failed to copy link",
        description: "Please try again.",
        variant: "destructive",
        duration: 2000
      })
    }
  }

  const handleDelete = async (outfit: Outfit) => {
    try {
      const response = await fetch(`/api/outfits/${outfit.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete outfit')
      
      setOutfits(outfits.filter(o => o.id !== outfit.id))
      toast({
        title: "Outfit deleted",
        description: "The outfit has been successfully deleted.",
        duration: 2000
      })
    } catch (error) {
      console.error('Error deleting outfit:', error)
      toast({
        title: "Failed to delete outfit",
        description: "Please try again.",
        variant: "destructive",
        duration: 2000
      })
    }
  }

  // Only show filters if we have outfits
  const showFilters = outfits.length > 0 && !loading

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
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <LoadingSpinner text="Loading outfits..." />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold">My Outfits</h1>
                <p className="text-foreground-soft">
                  {outfits.length > 0 
                    ? "Create and manage your outfit combinations"
                    : "Start creating your first outfit"}
                </p>
              </div>
              <Link
                href="/outfits/create"
                className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                {outfits.length > 0 ? "Create Outfit" : "Create Your First Outfit"}
              </Link>
            </div>

            {/* Only show filters if we have outfits */}
            {showFilters && (
              <div className="mb-6 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search outfits..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'recent' | 'price' | 'rating')}
                      className="select h-9 text-sm"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="rating">Highest Rating</option>
                      <option value="price">Lowest Price</option>
                    </select>
                    <div className="flex items-center gap-1 border border-gray-300 dark:border-neutral-800 rounded-lg">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-l ${viewMode === 'grid' ? 'bg-accent-purple text-white' : ''}`}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-r ${viewMode === 'list' ? 'bg-accent-purple text-white' : ''}`}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <line x1="3" y1="12" x2="21" y2="12" />
                          <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="w-40 h-10 px-3 pr-8 mt-5 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  >
                    <option value="all">All Seasons</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                  </select>
                  <select
                    value={selectedOccasion}
                    onChange={(e) => setSelectedOccasion(e.target.value)}
                    className="w-40 h-10 px-3 pr-8 mt-5 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  >
                    <option value="all">All Occasions</option>
                    <option value="casual">Casual</option>
                    <option value="work">Work</option>
                    <option value="formal">Formal</option>
                    <option value="sport">Sport</option>
                    <option value="special">Special</option>
                  </select>
                  
                  {/* Min/Max Price Inputs - The only change we're keeping */}
                  <div className="flex items-center gap-2">
                    <div className="w-32">
                      <label htmlFor="minOutfitPrice" className="text-xs font-medium text-muted-foreground mb-1 block">Min Price</label>
                      <input
                        type="text"
                        id="minOutfitPrice"
                        value={minPrice}
                        onChange={handleMinPriceChange}
                        placeholder="0"
                        className="w-full h-10 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="w-32">
                      <label htmlFor="maxOutfitPrice" className="text-xs font-medium text-muted-foreground mb-1 block">Max Price</label>
                      <input
                        type="text"
                        id="maxOutfitPrice"
                        value={maxPrice}
                        onChange={handleMaxPriceChange}
                        placeholder={maxPriceLimit ? formatCurrency(maxPriceLimit, currency).replace(/\.\d+$/, '') : 'Max'}
                        className="w-full h-10 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {filteredOutfits.map(outfit => (
                <div key={outfit.id} 
                  className={`bg-card border border-border overflow-hidden hover:border-accent-purple transition-colors ${
                    viewMode === 'grid' ? 'rounded-xl' : 'rounded-l-lg'
                  }`}
                >
                  <Link href={`/outfits/${outfit.id}`} className={viewMode === 'grid' ? "block" : "flex h-36 gap-4"}>
                    <div className={viewMode === 'list' ? "w-48 h-48" : "w-full"}>
                      <OutfitThumbnail 
                        items={outfit.items
                          .map(item => item.wardrobeItem)
                          .filter((item): item is ClothingItem => item !== undefined)}
                        className="h-full w-full aspect-square"
                      />
                    </div>
                    <div className={`p-4 ${viewMode === 'list' ? "flex-1" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium line-clamp-1">{outfit.name}</h3>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-foreground-soft">
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
                          <div className="flex items-center gap-1">
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
                    </div>
                  </Link>

                  <div className="flex items-center justify-end gap-2 p-4 pt-0">
                    <Link
                      href={`/outfits/${outfit.id}/edit`}
                      className="btn btn-ghost btn-sm h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleShare(outfit)}
                      className="btn btn-ghost btn-sm h-8 w-8 p-0"
                      title="Copy share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="btn btn-ghost btn-sm h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          title="Delete outfit"
                        >
                          <Trash2 className="w-4 h-4" />
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
                            onClick={() => handleDelete(outfit)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 