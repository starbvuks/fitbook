'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ExternalLink, 
  ShoppingCart, 
  BookmarkPlus,
  X,
  Plus,
  Save
} from 'lucide-react'
import type { 
  ClothingItem, 
  Currency,
  SeasonName,
  OccasionName,
  Season,
  Occasion,
  ClothingCategory,
  Color
} from '@/app/models/types'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import ImageUpload from '@/app/components/ImageUpload'
import type { UploadResult } from '@/lib/images'

const categories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'] as const
type Category = (typeof categories)[number]
type CategoryMap = { [K in Category]: ClothingCategory }
const categoryMap: CategoryMap = {
  tops: 'tops',
  bottoms: 'bottoms',
  dresses: 'dresses',
  outerwear: 'outerwear',
  shoes: 'shoes',
  accessories: 'accessories'
}
const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]
const seasons: SeasonName[] = ['spring', 'summer', 'fall', 'winter']
const occasions: OccasionName[] = [
  'casual',
  'formal',
  'business',
  'party',
  'sport',
  'beach',
  'evening',
  'wedding'
]

interface FormSection {
  title: string
  children: React.ReactNode
}

function FormSection({ title, children }: FormSection) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

interface Image {
  id: string
  url: string
  publicId: string
  colors: Color[]
  isPrimary: boolean
}

interface Tag {
  id: string
  name: string
}

interface EditableItem extends Partial<ClothingItem> {
  images?: Image[]
  tags?: Tag[]
  isOwned?: boolean
  size?: string
  material?: string
  condition?: string
  notes?: string
  seasons?: Season[]
  occasions?: Occasion[]
}

export default function ItemDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const router = useRouter()
  const [item, setItem] = useState<ClothingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedItem, setEditedItem] = useState<Partial<ClothingItem>>({})
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [profileResponse, itemResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch(`/api/items/${id}`)
        ])

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile')
        }
        const profileData = await profileResponse.json()
        setCurrency(profileData.currency || 'USD')

        if (!itemResponse.ok) {
          throw new Error('Failed to fetch item')
        }
        const itemData = await itemResponse.json()
        setItem(itemData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load item details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSave = async () => {
    if (!item || isUpdating) return
    setIsUpdating(true)

    try {
      const updatedItem = {
        ...item,
        ...editedItem,
        images: editedItem.images || item.images
      }

      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      })

      if (!response.ok) throw new Error('Failed to update item')
      const savedItem = await response.json()
      setItem(savedItem)
      setEditedItem({})
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating item:', error)
      setError(error instanceof Error ? error.message : 'Failed to update item')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageUpload = async (result: UploadResult) => {
    if (!result || !item) return
    try {
      const newImage: Image = {
        id: crypto.randomUUID(),
        url: result.url,
        publicId: result.publicId,
        isPrimary: false,
        colors: result.colors?.map(color => ({
          hex: color.hex,
          prevalence: color.prevalence,
          name: color.name
        })) || []
      }
      
      setEditedItem(prev => {
        const currentImages = prev.images || item.images
        return {
          ...prev,
          images: [...currentImages, newImage]
        }
      })
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  const handleImageRemove = (index: number) => {
    if (!item) return
    
    setEditedItem(prev => {
      const currentImages = prev.images || item.images
      return {
        ...prev,
        images: currentImages.filter((_, i) => i !== index)
      }
    })
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }
      router.push('/catalog')
    } catch (error) {
      console.error('Error deleting item:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete item')
    }
  }

  const handleSeasonToggle = (seasonName: SeasonName) => {
    if (!item) return
    setItem(prev => {
      if (!prev) return prev
      const currentSeasons = prev.seasons
      const seasonExists = currentSeasons.some(s => s.name === seasonName)
      
      return {
        ...prev,
        seasons: seasonExists
          ? currentSeasons.filter(s => s.name !== seasonName)
          : [...currentSeasons, { id: crypto.randomUUID(), name: seasonName }]
      }
    })
  }

  const handleOccasionToggle = (occasionName: OccasionName) => {
    if (!item) return
    setItem(prev => {
      if (!prev) return prev
      const currentOccasions = prev.occasions
      const occasionExists = currentOccasions.some(o => o.name === occasionName)
      
      return {
        ...prev,
        occasions: occasionExists
          ? currentOccasions.filter(o => o.name !== occasionName)
          : [...currentOccasions, { id: crypto.randomUUID(), name: occasionName }]
      }
    })
  }

  const handleCategoryChange = (category: Category) => {
    setItem(prev => {
      if (!prev) return prev
      return {
        ...prev,
        category: category
      }
    })
  }

  if (loading) return (
    <div className="mt-24">
      <LoadingSpinner text="Loading item details..." />
    </div>

  ) 
  if (error || !item) return <ErrorView error={error} onBack={() => router.back()} />

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="btn btn-ghost p-2"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            {isEditing ? (
              <input
                type="text"
                value={editedItem.name || item.name}
                onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                className="text-xl sm:text-3xl font-display font-bold bg-transparent border-b-2 border-border focus:border-primary focus:outline-none transition-colors w-full"
              />
            ) : (
              <h1 className="text-xl sm:text-3xl font-display font-bold">{item.name}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-ghost h-9 px-3 sm:px-4 flex-1 sm:flex-initial justify-center"
                  title="Cancel"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="btn btn-primary h-9 px-3 sm:px-4 flex-1 sm:flex-initial justify-center"
                  title="Save Changes"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-ghost h-9 px-3 sm:px-4 flex-1 sm:flex-initial justify-center"
                  title="Edit Item"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-ghost h-9 px-3 sm:px-4 flex-1 sm:flex-initial justify-center hover:bg-destructive/10 hover:text-destructive"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Left Column - Images and Basic Info */}
          <div className="space-y-4 sm:space-y-6">
            <FormSection title="Images">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {(editedItem.images || item.images).map((image, index) => (
                      <div key={image.id} className="relative aspect-square group">
                        <Image
                          src={image.url}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleImageRemove(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/75"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ImageUpload
                    onUploadSuccess={handleImageUpload}
                    onUploadError={(error) => setError(error.message)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {item.images.map((image) => (
                    <div key={image.id} className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
            </FormSection>

            <FormSection title="Basic Information">
              <div className="space-y-4">
                {/* Ownership Toggle */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-3 sm:p-4 bg-muted rounded-lg">
                  <button
                    onClick={() => setEditedItem({ ...editedItem, isOwned: true })}
                    className={`btn w-full sm:w-auto ${
                      (editedItem.isOwned ?? item.isOwned)
                        ? 'p-3 bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        : 'btn-ghost p-3'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    <span>I Own This</span>
                  </button>
                  <button
                    onClick={() => setEditedItem({ ...editedItem, isOwned: false })}
                    className={`btn w-full sm:w-auto ${
                      !(editedItem.isOwned ?? item.isOwned)
                        ? 'p-3 bg-sky-100 text-sky-600 hover:bg-sky-200'
                        : 'btn-ghost p-3'
                    }`}
                  >
                    <BookmarkPlus className="w-5 h-5 mr-2" />
                    <span>I Want This</span>
                  </button>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  {isEditing ? (
                    <select
                      value={editedItem.category || item.category}
                      onChange={(e) => setEditedItem({ ...editedItem, category: e.target.value as ClothingCategory })}
                      className="select w-full"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="capitalize">
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-4 py-2.5 bg-muted rounded-lg capitalize">
                      {item.category}
                    </p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium mb-2">Brand</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedItem.brand || item.brand || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, brand: e.target.value })}
                      className="input"
                      placeholder="Enter brand name"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-muted rounded-lg text-muted-foreground">
                      {item.brand || 'No brand specified'}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {currency}
                      </span>
                      <input
                        type="number"
                        value={editedItem.price || item.price}
                        onChange={(e) => setEditedItem({ ...editedItem, price: parseFloat(e.target.value) })}
                        className="input pl-12"
                      />
                    </div>
                  ) : (
                    <p className="px-4 py-2 bg-muted rounded-lg">
                      {formatPrice(item.price, currency)}
                    </p>
                  )}
                </div>

                {/* Purchase URL */}
                <div>
                  <label className="block text-sm font-medium mb-2 ">Purchase URL</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editedItem.purchaseUrl || item.purchaseUrl || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, purchaseUrl: e.target.value })}
                      placeholder="https://"
                      className="input"
                    />
                  ) : item.purchaseUrl ? (
                    <a
                      href={item.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost text-primary p-3"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Store
                    </a>
                  ) : (
                    <p className="px-4 py-2 bg-muted rounded-lg text-muted-foreground">
                      No purchase link available
                    </p>
                  )}
                </div>
              </div>
            </FormSection>
          </div>

          {/* Right Column - Details and Categories */}
          <div className="space-y-4 sm:space-y-6">
            <FormSection title="Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedItem.size || item.size || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, size: e.target.value })}
                      className="input w-full"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-muted rounded-lg">
                      {item.size || 'Not specified'}
                    </p>
                  )}
                </div>

                {/* Material */}
                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedItem.material || item.material || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, material: e.target.value })}
                      className="input w-full"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-muted rounded-lg">
                      {item.material || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                {isEditing ? (
                  <select
                    value={editedItem.condition || item.condition || 'new'}
                    onChange={(e) => setEditedItem({ ...editedItem, condition: e.target.value })}
                    className="select w-full"
                  >
                    {conditions.map((condition) => (
                      <option key={condition.value} value={condition.value}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="px-4 py-2 bg-muted rounded-lg capitalize">
                    {item.condition || 'Not specified'}
                  </p>
                )}
              </div>
            </FormSection>

            <FormSection title="Categories">
              {/* Seasons */}
              <div>
                <label className="block text-md font-medium mb-2">Seasons</label>
                <div className="grid grid-cols-2 gap-2">
                  {seasons.map((season) => (
                    <button
                      key={season}
                      onClick={() => handleSeasonToggle(season)}
                      disabled={!isEditing}
                      className={`btn p-2 ${
                        (editedItem.seasons || item.seasons).some(s => s.name === season)
                          ? 'btn-primary'
                          : 'btn-ghost'
                      }`}
                    >
                      <span className="capitalize">{season}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasions */}
              <div>
                <label className="block text-md font-medium mb-2">Occasions</label>
                <div className="grid grid-cols-2 gap-2">
                  {occasions.map((occasion) => (
                    <button
                      key={occasion}
                      onClick={() => handleOccasionToggle(occasion)}
                      disabled={!isEditing}
                      className={`btn p-2 ${
                        (editedItem.occasions || item.occasions).some(o => o.name === occasion)
                          ? 'btn-primary'
                          : 'btn-ghost'
                      }`}
                    >
                      <span className="capitalize">{occasion}</span>
                    </button>
                  ))}
                </div>
              </div>
            </FormSection>

            <FormSection title="Tags">
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={(editedItem.tags || item.tags).map(tag => tag.name).join(', ')}
                    onChange={(e) => {
                      const tagNames = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      setEditedItem({
                        ...editedItem,
                        tags: tagNames.map(name => ({ id: '', name }))
                      })
                    }}
                    placeholder="Enter tags separated by commas"
                    className="input"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-muted rounded-lg min-h-[40px] flex items-center">
                    {item.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2.5 py-1 bg-background rounded-full text-sm border border-border"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No tags added</span>
                    )}
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection title="Notes">
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                {isEditing ? (
                  <textarea
                    value={editedItem.notes || item.notes || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, notes: e.target.value })}
                    rows={3}
                    className="input min-h-[100px] resize-none"
                    placeholder="Add notes about this item..."
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-muted rounded-lg min-h-[100px]">
                    {item.notes ? (
                      <p className="whitespace-pre-wrap">{item.notes}</p>
                    ) : (
                      <p className="text-muted-foreground">No notes added</p>
                    )}
                  </div>
                )}
              </div>
            </FormSection>
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorView({ error, onBack }: { error: string | null, onBack: () => void }) {
  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Item not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
} 