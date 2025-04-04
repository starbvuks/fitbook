'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Filter, Search, LayoutGrid, LayoutList, Grid3X3 } from 'lucide-react'
import type { ClothingItem, ClothingCategory, Currency } from '@/app/models/types'
import ItemCard from '@/app/components/ItemCard'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { formatCurrency, getMaxPriceForCurrency } from '@/lib/currency'
import { useRouter } from 'next/navigation'

const categories: ClothingCategory[] = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories'
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
        setItems(data)
      } catch (error) {
        console.error('Error fetching items:', error)
        setError('Failed to load items. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchItems, 300)
    return () => clearTimeout(timeoutId)
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

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold mb-0.5">My Catalog</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} items · Total value: {formatCurrency(
                items.reduce((sum: number, item: ClothingItem) => sum + item.price, 0),
                currency
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              className="btn btn-primary h-9 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Item
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 mb-4 shadow-soft">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9 h-9 text-sm w-full"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn h-9 px-4 ${
                  showFilters
                    ? 'btn-primary'
                    : 'btn-ghost'
                }`}
              >
                <Filter className="w-4 h-4 mr-1.5" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 pt-3 border-t border-border items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ClothingCategory | 'all')}
                    className="select h-9 text-sm w-full"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category} className="capitalize">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={ownershipFilter}
                    onChange={(e) => setOwnershipFilter(e.target.value as OwnershipFilter)}
                    className="select h-9 text-sm w-full"
                  >
                    <option value="all">All Items</option>
                    <option value="owned">Owned</option>
                    <option value="wanted">Want to Buy</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="minPrice" className="text-xs font-medium text-muted-foreground">Min Price</label>
                  <input
                    type="text"
                    id="minPrice"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    placeholder="0"
                    className="input h-9 text-sm w-full"
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="maxPrice" className="text-xs font-medium text-muted-foreground">Max Price</label>
                  <input
                    type="text"
                    id="maxPrice"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    placeholder={maxPriceLimit ? formatCurrency(maxPriceLimit, currency).replace(/\.\d+$/, '') : 'Max'}
                    className="input h-9 text-sm w-full"
                    inputMode="decimal"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Loading items..." />
          </div>
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
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer"
              >
                <ItemCard item={item} currency={currency} onToggleOwnership={handleToggleOwnership} viewMode={viewMode} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
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
              Add Your First Item
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 