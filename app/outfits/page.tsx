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
import OutfitCard from '@/app/components/OutfitCard'

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
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete outfit')
      }

      // Remove the deleted outfit from state
      setOutfits(prev => prev.filter(outfit => outfit.id !== outfitId))
      
      toast({
        title: 'Outfit deleted',
        description: 'The outfit was successfully deleted.',
      })
    } catch (error) {
      console.error('Error deleting outfit:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete outfit',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
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
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <LoadingSpinner text="Loading outfits..." />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold">My Outfits</h1>
                <p className="text-foreground-soft">
                  {outfits.length > 0 
                    ? "Create and manage your outfit combinations"
                    : "Start creating your first outfit"}
                </p>
              </div>
              <Link
                href="/outfits/create"
                className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors w-full sm:w-auto justify-center sm:justify-start"
              >
                <Plus className="w-4 h-4" />
                {outfits.length > 0 ? "Create Outfit" : "Create Your First Outfit"}
              </Link>
            </div>

            {/* Only show filters if we have outfits */}
            {showFilters && (
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                  <div className="flex items-center gap-2 self-end">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="h-10 px-3 pr-8 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-purple"
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
                    className="h-10 px-3 pr-8 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-purple"
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
                    <div className="flex-1">
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
                    <div className="flex-1">
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
              ? "grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              : "space-y-4"
            }>
              {filteredOutfits.map(outfit => (
                <div key={outfit.id} className="group">
                  <OutfitCard
                    outfit={outfit}
                    currency={currency}
                    viewMode={viewMode}
                    onDelete={handleDeleteOutfit}
                    onShare={handleShareOutfit}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 