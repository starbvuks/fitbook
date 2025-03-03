'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Filter, Search } from 'lucide-react'
import type { ClothingItem, ClothingCategory, Currency } from '@/app/models/types'
import ItemCard from '@/app/components/ItemCard'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { formatPrice } from '@/lib/utils'

const categories: ClothingCategory[] = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories'
]

export default function CatalogPage() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all')
  const [currency, setCurrency] = useState<Currency>('USD')

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch user profile')
        }
        const data = await response.json()
        setCurrency(data.currency || 'USD')
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // Default to USD if there's an error
        setCurrency('USD')
      }
    }

    fetchUserProfile()
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

    // Debounce the search query
    const timeoutId = setTimeout(fetchItems, 300)
    return () => clearTimeout(timeoutId)
  }, [selectedCategory, searchQuery])

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Catalog</h1>
            <p className="text-foreground-soft">
              {items.length} items · Total value: {formatPrice(
                items.reduce((sum, item) => sum + item.price, 0),
                currency
              )}
            </p>
          </div>
          <Link
            href="/catalog/add"
            className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Link>
        </div>

        <div className="bg-background rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-soft" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
            </div>
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-foreground-soft" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ClothingCategory | 'all')}
                className="px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category} className="capitalize">
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading items..." />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currency={currency}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-foreground-soft mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? "Try adjusting your filters"
                : "Start adding items to your catalog"}
            </p>
            <Link
              href="/catalog/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Item
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 