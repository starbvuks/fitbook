'use client'

import { useRouter } from 'next/navigation'
import type { ClothingItem } from '@/app/models/types'
import AddItemForm from '@/app/components/AddItemForm'

export default function AddItemPage() {
  const router = useRouter()

  const handleSubmit = async (item: Omit<ClothingItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        throw new Error('Failed to create item')
      }

      router.push('/catalog')
    } catch (error) {
      console.error('Error creating item:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Add New Item</h1>
          <p className="text-foreground-soft">Add a new item to your catalog</p>
        </div>

        <AddItemForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/catalog')}
          category="tops"
        />
      </div>
    </div>
  )
} 