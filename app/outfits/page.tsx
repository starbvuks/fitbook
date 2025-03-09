'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  DollarSign
} from 'lucide-react'
import type { Outfit, Season, Occasion, Currency } from '@/app/models/types'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { formatCurrency } from '@/lib/currency'

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeason, setSelectedSeason] = useState<string>('all')
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState<'recent' | 'price' | 'rating'>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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
        setCurrency(profileData.currency || 'USD')

        if (!outfitsResponse.ok) throw new Error('Failed to fetch outfits')
        const outfitsData = await outfitsResponse.json()
        setOutfits(outfitsData.outfits || []) // Handle the case where outfits might be nested

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
    const matchesPrice = outfit.totalCost >= priceRange[0] && outfit.totalCost <= priceRange[1]
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

  const handleShare = async (outfit: Outfit) => {
    try {
      await navigator.share({
        title: outfit.name,
        text: `Check out my outfit: ${outfit.name}`,
        url: `${window.location.origin}/outfits/${outfit.id}`
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleDownload = async (outfit: Outfit) => {
    // TODO: Implement outfit image download functionality
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
          <div className="bg-background rounded-xl border border-border p-6 mb-6 space-y-4">
            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-soft" />
                <input
                  type="text"
                  placeholder="Search outfits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'price' | 'rating')}
                  className="px-4 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
                >
                  <option value="recent" className="dark:bg-neutral-900">Most Recent</option>
                  <option value="price" className="dark:bg-neutral-900">Price</option>
                  <option value="rating" className="dark:bg-neutral-900">Rating</option>
                </select>
                <div className="flex items-center gap-2 p-1 bg-background-soft rounded-lg border border-border">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded ${viewMode === 'grid' ? 'bg-accent-purple text-white' : ''}`}
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
                    className={`p-1 rounded ${viewMode === 'list' ? 'bg-accent-purple text-white' : ''}`}
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
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-foreground-soft" />
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
                >
                  <option value="all" className="dark:bg-neutral-900">All Seasons</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.name} className="capitalize dark:bg-neutral-900">
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={selectedOccasion}
                onChange={(e) => setSelectedOccasion(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="all" className="dark:bg-neutral-900">All Occasions</option>
                {occasions.map(occasion => (
                  <option key={occasion.id} value={occasion.name} className="capitalize dark:bg-neutral-900">
                    {occasion.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-foreground-soft" />
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-24 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                <span className="text-foreground-soft">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-24 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>
            </div>
          </div>
        )}

        {/* Outfits Grid/List */}
        {loading ? (
          <LoadingSpinner text="Loading outfits..." />
        ) : filteredOutfits.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {filteredOutfits.map((outfit) => (
              <div
                key={outfit.id}
                className={`bg-background rounded-lg border border-border overflow-hidden hover:border-accent-purple transition-colors ${
                  viewMode === 'list' ? 'flex gap-4' : ''
                }`}
              >
                <Link
                  href={`/outfits/${outfit.id}`}
                  className={viewMode === 'list' ? 'w-48' : 'block'}
                >
                  <div className="relative aspect-[3/4]">
                    {outfit.items[0]?.wardrobeItem?.images[0] ? (
                      <Image
                        src={outfit.items[0].wardrobeItem.images[0].url}
                        alt={outfit.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-background-soft flex items-center justify-center text-foreground-soft">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link href={`/outfits/${outfit.id}`}>
                      <h3 className="font-medium hover:text-accent-purple transition-colors">
                        {outfit.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleShare(outfit)}
                        className="p-1 text-foreground-soft hover:text-accent-purple transition-colors"
                        title="Share Outfit"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(outfit)}
                        className="p-1 text-foreground-soft hover:text-accent-purple transition-colors"
                        title="Download Outfit Image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-foreground-soft mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{outfit.rating || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatPrice(outfit.totalCost, currency)}</span>
                    </div>
                    {outfit.stats?.timesWorn && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Worn {outfit.stats.timesWorn}x</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {outfit.occasions.slice(0, 2).map((occasion) => (
                      <span
                        key={occasion.id}
                        className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft capitalize"
                      >
                        {occasion.name}
                      </span>
                    ))}
                    {outfit.occasions.length > 2 && (
                      <span className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft">
                        +{outfit.occasions.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No outfits found</h3>
            <p className="text-foreground-soft mb-6">
              {searchQuery || selectedSeason !== 'all' || selectedOccasion !== 'all'
                ? "Try adjusting your filters"
                : "Start creating outfits with your catalog items"}
            </p>
            <Link
              href="/outfits/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Outfit
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 