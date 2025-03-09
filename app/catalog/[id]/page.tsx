'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Edit, Trash2, ExternalLink, ShoppingCart, BookmarkPlus } from 'lucide-react'
import type { ClothingItem, Currency } from '@/app/models/types'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/app/components/LoadingSpinner'

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [item, setItem] = useState<ClothingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) throw new Error('Failed to fetch user profile')
        const data = await response.json()
        setCurrency(data.currency || 'USD')
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setCurrency('USD')
      }
    }

    const fetchItem = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/items/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch item')
        const data = await response.json()
        setItem(data)
      } catch (error) {
        console.error('Error fetching item:', error)
        setError('Failed to load item details')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
    fetchItem()
  }, [params.id])

  const handleToggleOwnership = async () => {
    if (!item || isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOwned: !item.isOwned }),
      })

      if (!response.ok) throw new Error('Failed to update item')
      const updatedItem = await response.json()
      setItem(updatedItem)
    } catch (error) {
      console.error('Error updating item:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete item')
      router.push('/catalog')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading item details..." />
  }

  if (error || !item) {
    return (
      <div className="min-h-screen pt-16 bg-background-soft">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error || 'Item not found'}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-background transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-display font-bold">{item.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="aspect-square relative rounded-xl overflow-hidden border border-border">
              {item.images[0] ? (
                <Image
                  src={item.images[0].url}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-background-soft flex items-center justify-center text-foreground-soft">
                  No Image
                </div>
              )}
            </div>

            {item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {item.images.slice(1).map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square relative rounded-lg overflow-hidden border border-border"
                  >
                    <Image
                      src={image.url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-background rounded-xl border border-border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-medium">
                    {formatPrice(item.price, currency)}
                  </p>
                  <p className="text-foreground-soft capitalize">{item.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleOwnership}
                    disabled={isUpdating}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isOwned
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                    title={item.isOwned ? 'Owned' : 'Want to Buy'}
                  >
                    {item.isOwned ? (
                      <ShoppingCart className="w-5 h-5" />
                    ) : (
                      <BookmarkPlus className="w-5 h-5" />
                    )}
                  </button>
                  {item.purchaseUrl && (
                    <a
                      href={item.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-background-soft transition-colors"
                      title="Purchase Link"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                  <button
                    onClick={() => router.push(`/catalog/${item.id}/edit`)}
                    className="p-2 rounded-lg hover:bg-background-soft transition-colors"
                    title="Edit Item"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {item.brand && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Brand</h3>
                  <p>{item.brand}</p>
                </div>
              )}

              {item.size && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Size</h3>
                  <p>{item.size}</p>
                </div>
              )}

              {item.material && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Material</h3>
                  <p>{item.material}</p>
                </div>
              )}

              {item.condition && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Condition</h3>
                  <p>{item.condition}</p>
                </div>
              )}

              {item.notes && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Notes</h3>
                  <p className="whitespace-pre-wrap">{item.notes}</p>
                </div>
              )}

              {item.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag.name}
                        className="px-3 py-1 bg-background-soft rounded-full text-sm"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasons */}
              {item.seasons.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-medium mb-2">Seasons</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.seasons.map((season) => (
                      <span
                        key={season.id}
                        className="px-3 py-1 bg-background-soft rounded-full text-sm"
                      >
                        {season.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Occasions */}
              {item.occasions.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-medium mb-2">Occasions</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.occasions.map((occasion) => (
                      <span
                        key={occasion.id}
                        className="px-3 py-1 bg-background-soft rounded-full text-sm"
                      >
                        {occasion.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 