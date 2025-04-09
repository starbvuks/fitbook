'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Filter, Search, LayoutGrid, LayoutList, Grid3X3 } from 'lucide-react'
import type { ClothingItem, ClothingCategory, Currency, Season, Occasion, SeasonName, OccasionName } from '@/app/models/types'
import ItemCard from '@/app/components/ItemCard'
import SkeletonCard from '@/app/components/SkeletonCard'
import { formatCurrency, getMaxPriceForCurrency } from '@/lib/currency'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const categories: ClothingCategory[] = [
  'tops',
  'bottoms',
  'outerwear',
  'shoes',
  'accessories',
  'headwear'
]

type ViewMode = 'large' | 'small' | 'stack'
type OwnershipFilter = 'all' | 'owned' | 'wanted'

const viewModeConfig = {
  large: {
    icon: Grid3X3,
    label: 'Large Grid',
    gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  small: {
    icon: LayoutGrid,
    label: 'Small Grid',
    gridCols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  },
  stack: {
    icon: LayoutList,
    label: 'List View',
    gridCols: 'grid-cols-1',
  },
} as const

const SEASONS: SeasonName[] = ['spring', 'summer', 'fall', 'winter']
const OCCASIONS: OccasionName[] = ['casual', 'formal', 'business', 'party', 'sport', 'beach', 'evening', 'wedding']

function CatalogSkeleton({ viewMode }: { viewMode: ViewMode }) {
  const count = viewMode === 'large' ? 8 : viewMode === 'small' ? 12 : 5;
  const gridCols = viewModeConfig[viewMode].gridCols;
  return (
    <div className={`grid gap-3 ${gridCols}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} viewMode={viewMode} />
      ))}
    </div>
  );
}

export default function CatalogPage() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [viewMode, setViewMode] = useState<ViewMode>('large')
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [maxPriceLimit, setMaxPriceLimit] = useState<number | null>(null)
  const [selectedSeasons, setSelectedSeasons] = useState<SeasonName[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<OccasionName[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchUserProfileAndMaxPrice = async () => {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch user profile')
        }
        const data = await response.json()
        const userCurrency = data.currency || 'USD'
        setCurrency(userCurrency)
        const maxPriceValue = await getMaxPriceForCurrency(userCurrency)
        setMaxPriceLimit(maxPriceValue)
      } catch (error) {
        console.error('Error fetching user profile or max price:', error)
        setCurrency('USD')
        setMaxPriceLimit(10000)
      }
    }

    fetchUserProfileAndMaxPrice()
  }, [])

  useEffect(() => {
    let isMounted = true;
    const fetchItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory)
        }
        if (searchQuery) {
          params.append('search', searchQuery)
        }
        if (ownershipFilter !== 'all') {
          params.append('isOwned', (ownershipFilter === 'owned').toString())
        }
        const minPriceNum = parseFloat(minPrice)
        if (!isNaN(minPriceNum) && minPriceNum > 0) {
          params.append('minPrice', minPriceNum.toString())
        }
        const maxPriceNum = parseFloat(maxPrice)
        if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
          params.append('maxPrice', maxPriceNum.toString())
        }

        const response = await fetch(`/api/items?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch items')
        }

        const data = await response.json()
        if (isMounted) {
          setItems(data)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching items:', error)
          setError('Failed to load items. Please try again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const timeoutId = setTimeout(fetchItems, 300)
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId)
    }
  }, [selectedCategory, searchQuery, ownershipFilter, minPrice, maxPrice])

  const handleToggleOwnership = async (itemId: string, isOwned: boolean) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOwned }),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      setItems(items.map(item => 
        item.id === itemId ? { ...item, isOwned } : item
      ))
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    }
  }

  const handleItemClick = (item: ClothingItem) => {
    router.push(`/catalog/${item.id}`)
  }

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

  const filteredItems = items.filter(item => {
    if (selectedSeasons.length > 0 && !item.seasons.some(season => selectedSeasons.includes(season.name))) {
      return false
    }
    if (selectedOccasions.length > 0 && !item.occasions.some(occasion => selectedOccasions.includes(occasion.name))) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold mb-0.5">My Catalog</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} items · Total value: {formatCurrency(
                items.reduce((sum: number, item: ClothingItem) => sum + item.price, 0),
                currency
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1">
                {(Object.entries(viewModeConfig) as [ViewMode, typeof viewModeConfig[ViewMode]][]).map(([mode, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === mode
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                      title={config.label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
              
              <Link
                href="/catalog/add"
                className="btn btn-primary h-9 px-4 flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-accent border border-border'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-accent border border-border'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOwnershipFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                ownershipFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setOwnershipFilter('owned')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                ownershipFilter === 'owned'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              Owned
            </button>
            <button
              onClick={() => setOwnershipFilter('wanted')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                ownershipFilter === 'wanted'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              Wishlist
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {loading ? (
          <CatalogSkeleton viewMode={viewMode} />
        ) : error ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : items.length > 0 ? (
          <div className={`grid gap-3 ${viewModeConfig[viewMode].gridCols}`}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer"
              >
                <ItemCard
                  item={item}
                  onToggleOwnership={handleToggleOwnership}
                  viewMode={viewMode}
                  currency={currency}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-6 sm:p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all' || ownershipFilter !== 'all' || minPrice || maxPrice
                ? "Try adjusting your filters"
                : "Start adding items to your catalog"}
            </p>
            <Link
              href="/catalog/add"
              className="btn btn-primary inline-flex"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {searchQuery || selectedCategory !== 'all' || ownershipFilter !== 'all' || minPrice || maxPrice ? 'Clear Filters' : 'Add Your First Item'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 