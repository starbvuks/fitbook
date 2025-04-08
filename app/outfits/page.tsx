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
  Trash2,
  LayoutGrid,
  LayoutList
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
  const [showFilters, setShowFilters] = useState(false)

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

        // Fetch all data in parallel
        const [profileResponse, outfitsResponse, seasonsResponse, occasionsResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/outfits'),
          fetch('/api/seasons'),
          fetch('/api/occasions')
        ])

        if (!profileResponse.ok) throw new Error('Failed to fetch profile')
        const profileData = await profileResponse.json()
        setCurrency(profileData.currency || 'INR')

        if (!outfitsResponse.ok) throw new Error('Failed to fetch outfits')
        const outfitsData = await outfitsResponse.json()
        setOutfits(outfitsData.outfits || [])

        // Always fetch and set seasons and occasions regardless of outfits
        if (seasonsResponse.ok) {
          const seasonsData = await seasonsResponse.json()
          setSeasons(seasonsData)
        } else {
          console.warn('Failed to fetch seasons')
          setSeasons([])
        }

        if (occasionsResponse.ok) {
          const occasionsData = await occasionsResponse.json()
          setOccasions(occasionsData)
        } else {
          console.warn('Failed to fetch occasions')
          setOccasions([])
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

  const showFilterControls = outfits.length > 0 && !loading

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
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5">My Outfits</h1>
            <p className="text-sm text-muted-foreground">
              {filteredOutfits.length} outfits · Total value: {formatCurrency(
                filteredOutfits.reduce((sum, outfit) => sum + outfit.totalCost, 0),
                currency
              )}
            </p>
          </div>

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
                onClick={() => setSelectedSeason('all')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedSeason === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-accent border border-border'
                }`}
              >
                All Seasons
              </button>
              {seasons.map((season) => (
                <button
                  key={season.name}
                  onClick={() => setSelectedSeason(season.name)}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                    selectedSeason === season.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-accent border border-border'
                  }`}
                >
                  {season.name}
                </button>
              ))}
            </div>
          </div>

          {/* Occasions Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedOccasion('all')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedOccasion === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              All Occasions
            </button>
            {occasions.map((occasion) => (
              <button
                key={occasion.name}
                onClick={() => setSelectedOccasion(occasion.name)}
                className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                  selectedOccasion === occasion.name
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-accent border border-border'
                }`}
              >
                {occasion.name}
              </button>
            ))}
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
          <div className="flex justify-center items-center min-h-[200px]">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-foreground-soft">{error}</p>
          </div>
        ) : filteredOutfits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground-soft mb-4">No outfits found</p>
            <Link
              href="/outfits/create"
              className="btn btn-primary"
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
            {filteredOutfits.map((outfit) => (
              <Link
                key={outfit.id}
                href={`/outfits/${outfit.id}`}
                className="block group"
              >
                <OutfitCard
                  outfit={outfit}
                  currency={currency}
                  viewMode={viewMode}
                  onDelete={handleDeleteOutfit}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 