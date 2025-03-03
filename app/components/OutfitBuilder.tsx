'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { ClothingItem, ClothingCategory } from '../models/types'
import Modal from './Modal'
import { Search } from 'lucide-react'

interface OutfitSlot {
  category: ClothingCategory
  item?: ClothingItem
  order: number
  label: string
}

const OUTFIT_SLOTS: OutfitSlot[] = [
  { category: 'accessories', order: 1, label: 'Accessories (Head)' },
  { category: 'outerwear', order: 2, label: 'Outerwear' },
  { category: 'tops', order: 3, label: 'Top' },
  { category: 'bottoms', order: 4, label: 'Bottom' },
  { category: 'shoes', order: 5, label: 'Shoes' },
  { category: 'accessories', order: 6, label: 'Accessories (Other)' },
]

interface OutfitBuilderProps {
  onOutfitChange: (items: ClothingItem[]) => void
}

export default function OutfitBuilder({ onOutfitChange }: OutfitBuilderProps) {
  const [slots, setSlots] = useState<OutfitSlot[]>(OUTFIT_SLOTS)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWardrobeItems()
  }, [])

  const fetchWardrobeItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/wardrobe')
      if (!response.ok) {
        throw new Error('Failed to fetch wardrobe items')
      }
      const data = await response.json()
      setWardrobeItems(data)
    } catch (error) {
      console.error('Error fetching wardrobe items:', error)
      setError('Failed to load wardrobe items')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = (slotIndex: number) => {
    setActiveSlot(slotIndex)
    setShowItemModal(true)
  }

  const handleItemSelect = (item: ClothingItem) => {
    if (activeSlot === null) return

    const newSlots = [...slots]
    newSlots[activeSlot] = { ...newSlots[activeSlot], item }
    setSlots(newSlots)
    onOutfitChange(newSlots.map(slot => slot.item).filter(Boolean) as ClothingItem[])
    setShowItemModal(false)
    setActiveSlot(null)
    setSearchQuery('')
  }

  const filteredItems = wardrobeItems.filter(item => {
    if (activeSlot === null) return false
    const slot = slots[activeSlot]
    return (
      item.category === slot.category &&
      (searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    )
  })

  return (
    <div className="space-y-4">
      {slots.map((slot, index) => (
        <div
          key={`${slot.category}-${slot.order}`}
          className="bg-background rounded-lg border border-border p-6 transition-all hover:border-accent-purple"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{slot.label}</h3>
            {!slot.item && (
              <button
                onClick={() => handleAddItem(index)}
                className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors text-sm"
              >
                Add Item
              </button>
            )}
          </div>

          {slot.item && (
            <div className="relative group">
              <div className="aspect-[3/4] relative rounded-lg overflow-hidden">
                <Image
                  src={slot.item.images[0].url}
                  alt={slot.item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => {
                    const newSlots = [...slots]
                    newSlots[index] = { ...newSlots[index], item: undefined }
                    setSlots(newSlots)
                    onOutfitChange(newSlots.map(slot => slot.item).filter(Boolean) as ClothingItem[])
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="mt-4 space-y-1">
                <h4 className="font-medium">{slot.item.name}</h4>
                <p className="text-sm text-foreground-soft">${slot.item.price.toFixed(2)}</p>
                {slot.item.brand && (
                  <p className="text-sm text-foreground-soft">{slot.item.brand}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <Modal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false)
          setActiveSlot(null)
          setSearchQuery('')
        }}
        title={`Select ${activeSlot !== null ? slots[activeSlot].label : 'Item'}`}
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-soft" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-accent-purple border-t-transparent rounded-full mx-auto"></div>
              <p className="text-foreground-soft mt-2">Loading items...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchWardrobeItems}
                className="mt-2 text-accent-purple hover:text-accent-purple-dark"
              >
                Try Again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-foreground-soft">
                {searchQuery
                  ? 'No items match your search'
                  : 'No items found in this category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className="text-left group"
                >
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-border group-hover:border-accent-purple">
                    <Image
                      src={item.images[0].url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <h4 className="font-medium truncate">{item.name}</h4>
                    <p className="text-sm text-foreground-soft">${item.price.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
} 