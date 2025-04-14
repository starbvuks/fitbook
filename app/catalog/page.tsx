'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { debounce } from 'lodash'
import { Plus, Filter, Search, LayoutGrid, LayoutList, Grid3X3, Loader2, ChevronDown } from 'lucide-react'
import type { ClothingItem, ClothingCategory, Currency, Season, Occasion, SeasonName, OccasionName } from '@/app/models/types'
import ItemCard from '@/app/components/ItemCard'
import SkeletonCard from '@/app/components/SkeletonCard'
import { formatCurrency, getMaxPriceForCurrency } from '@/lib/currency'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const categories: ClothingCategory[] = [
  'headwear',
  'outerwear',
  'tops',
  'bottoms',
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
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as ClothingCategory | null

  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>(initialCategory || 'all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'owned' | 'want'>('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // --- Pagination State --- 
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  // --- End Pagination State ---

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
      } catch (error) {
        console.error('Error fetching user profile or max price:', error)
        setCurrency('USD')
      }
    }

    fetchUserProfileAndMaxPrice()
  }, [])

  // Debounced fetch function - Updated for pagination
  const fetchItems = useCallback(debounce(async (filters, append = false) => {
    if (!append) setLoading(true); 
    else setLoadingMore(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('limit', '30'); // Set limit
    if (append && filters.cursor) params.set('cursor', filters.cursor);
    if (filters.query) params.set('query', filters.query);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.status === 'owned') params.set('isOwned', 'true');
    if (filters.status === 'want') params.set('isOwned', 'false');
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    
    try {
      const response = await fetch(`/api/items?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch items');
      }
      const data = await response.json(); // Expect { items: ClothingItem[], nextCursor: string | null }
      
      setItems(prev => append ? [...prev, ...data.items] : data.items);
      setNextCursor(data.nextCursor); // Set the next cursor

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      if (!append) setItems([]); // Clear items on error for initial load
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, 500), []);

  // Initial fetch & refetch on filter change
  useEffect(() => {
    const currentFilters = {
      query: searchQuery,
      category: selectedCategory,
      status: selectedStatus,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      cursor: null // Reset cursor on filter change
    };
    fetchItems(currentFilters);
  }, [searchQuery, selectedCategory, selectedStatus, minPrice, maxPrice, sortBy, sortOrder, fetchItems]);

  // --- Infinite Scroll Observer --- 
  useEffect(() => {
    if (loadingMore || !nextCursor) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          const currentFilters = { /* ... gather current filters ... */ cursor: nextCursor };
          fetchItems(currentFilters, true); // Pass true to append
        }
      },
      { threshold: 0.5 } // Adjust threshold as needed
    );

    observerRef.current = observer;
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [nextCursor, loadingMore, fetchItems, searchQuery, selectedCategory, selectedStatus, minPrice, maxPrice, sortBy, sortOrder]);
  // --- End Infinite Scroll Observer ---

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
    <div className="min-h-screen pt-20 bg-background">
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
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg flex-shrink-0">
                {(['grid', 'list'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    aria-label={`${mode} view`}
                  >
                    {mode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
                  </button>
                ))}
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
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedStatus('owned')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedStatus === 'owned'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent border border-border'
              }`}
            >
              Owned
            </button>
            <button
              onClick={() => setSelectedStatus('want')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedStatus === 'want'
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
          <CatalogSkeleton viewMode={viewMode === 'grid' ? 'large' : 'stack'} />
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
          <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1'}`}>
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer"
              >
                <ItemCard
                  item={item}
                  onToggleOwnership={handleToggleOwnership}
                  viewMode={viewMode === 'grid' ? 'large' : 'stack'}
                  currency={currency}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-6 sm:p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || minPrice || maxPrice
                ? "Try adjusting your filters"
                : "Start adding items to your catalog"}
            </p>
            <Link
              href="/catalog/add"
              className="btn btn-primary py-2 px-4 rounded-full"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || minPrice || maxPrice ? 'Clear Filters' : 'Add Your First Item'}
            </Link>
          </div>
        )}

        {/* --- Load More Trigger / Spinner --- */}
        <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
          {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
          {!loadingMore && nextCursor && items.length > 0 && (
             <span className="text-sm text-muted-foreground">Scroll down to load more...</span> // Optional indicator
          )}
        </div>
        {/* --- End Load More Trigger --- */}
      </div>
    </div>
  )
} 