'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ExternalLink, Trash2, ArrowLeft } from 'lucide-react'
import type { ClothingItem, Outfit } from '@/app/models/types'
import ColorPalette from '@/app/components/ColorPalette'
import Link from 'next/link'

export default function ItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [item, setItem] = useState<ClothingItem | null>(null)
  const [relatedOutfits, setRelatedOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        const [itemResponse, outfitsResponse] = await Promise.all([
          fetch(`/api/items/${params.id}`),
          fetch(`/api/outfits?itemId=${params.id}`)
        ])

        if (!itemResponse.ok) throw new Error('Failed to fetch item')
        if (!outfitsResponse.ok) throw new Error('Failed to fetch outfits')

        const [itemData, outfitsData] = await Promise.all([
          itemResponse.json(),
          outfitsResponse.json()
        ])

        setItem(itemData)
        setRelatedOutfits(outfitsData)
      } catch (error) {
        console.error('Error fetching item:', error)
        setError(error instanceof Error ? error.message : 'Failed to load item')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete item')

      router.push('/catalog')
    } catch (error) {
      console.error('Error deleting item:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete item')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-background-soft">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-background-softer rounded mb-4" />
            <div className="aspect-square w-full bg-background-softer rounded-lg mb-6" />
            <div className="space-y-4">
              <div className="h-4 w-3/4 bg-background-softer rounded" />
              <div className="h-4 w-1/2 bg-background-softer rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen pt-16 bg-background-soft">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h2 className="text-xl font-medium mb-2">Error</h2>
            <p className="text-foreground-soft mb-4">{error || 'Item not found'}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-accent-purple hover:text-accent-purple-dark"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-foreground-soft hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </button>
          <div className="flex items-center gap-4">
            <Link
              href={`/catalog/${params.id}/edit`}
              className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              Edit Item
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete Item"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image and Colors */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-background">
              {item.images[0] ? (
                <Image
                  src={item.images[0].url}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground-soft">
                  No Image
                </div>
              )}
              {item.purchaseUrl && (
                <a
                  href={item.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 p-2 bg-background/90 rounded-full hover:bg-background transition-colors"
                  title="Purchase Link"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>

            {item.images[0]?.colors && item.images[0].colors.length > 0 && (
              <div className="p-6 bg-background rounded-lg border border-border">
                <h3 className="text-lg font-medium mb-4">Color Palette</h3>
                <ColorPalette colors={item.images[0].colors} readonly />
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div className="p-6 bg-background rounded-lg border border-border">
              <h1 className="text-2xl font-medium mb-4">{item.name}</h1>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-foreground-soft">Category</dt>
                  <dd className="mt-1 text-lg capitalize">{item.category}</dd>
                </div>

                {item.brand && (
                  <div>
                    <dt className="text-sm text-foreground-soft">Brand</dt>
                    <dd className="mt-1">{item.brand}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm text-foreground-soft">Price</dt>
                  <dd className="mt-1">{item.price}</dd>
                </div>

                {item.size && (
                  <div>
                    <dt className="text-sm text-foreground-soft">Size</dt>
                    <dd className="mt-1">{item.size}</dd>
                  </div>
                )}

                {item.material && (
                  <div>
                    <dt className="text-sm text-foreground-soft">Material</dt>
                    <dd className="mt-1">{item.material}</dd>
                  </div>
                )}

                {item.condition && (
                  <div>
                    <dt className="text-sm text-foreground-soft">Condition</dt>
                    <dd className="mt-1 capitalize">{item.condition}</dd>
                  </div>
                )}

                {item.seasons.length > 0 && (
                  <div>
                    <dt className="text-sm text-foreground-soft">Seasons</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {item.seasons.map(season => (
                        <span
                          key={season}
                          className="px-2 py-1 text-sm bg-background-soft rounded-full capitalize"
                        >
                          {season}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {item.occasions.length > 0 && (
                  <div>
                    <dt className="text-sm text-foreground-soft">Occasions</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {item.occasions.map(occasion => (
                        <span
                          key={occasion}
                          className="px-2 py-1 text-sm bg-background-soft rounded-full capitalize"
                        >
                          {occasion}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div>
                    <dt className="text-sm text-foreground-soft">Tags</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-sm bg-background-soft rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {item.notes && (
                  <div>
                    <dt className="text-sm text-foreground-soft">Notes</dt>
                    <dd className="mt-1 text-foreground-soft">{item.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Related Outfits */}
            {relatedOutfits.length > 0 && (
              <div className="p-6 bg-background rounded-lg border border-border">
                <h3 className="text-lg font-medium mb-4">Used in Outfits</h3>
                <div className="space-y-4">
                  {relatedOutfits.map(outfit => (
                    <Link
                      key={outfit.id}
                      href={`/outfits/${outfit.id}`}
                      className="block p-4 bg-background-soft rounded-lg hover:bg-background-softer transition-colors"
                    >
                      <h4 className="font-medium mb-1">{outfit.name}</h4>
                      <p className="text-sm text-foreground-soft">
                        {outfit.items.length} items • Created {new Date(outfit.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 