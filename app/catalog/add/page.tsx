'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import type { ClothingItem, ClothingCategory } from '@/app/models/types'
import AddItemForm from '@/app/components/AddItemForm'

const categories: ClothingCategory[] = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'headwear'
]

export default function AddItemPage() {
  const router = useRouter()

  const handleSubmit = async (formData: any) => {
    try {
      // Format the data to match what the API expects
      const requestData = {
        ...formData,
        // These fields need to be strings, not objects with IDs
        tags: formData.tags || [],
        seasons: formData.seasons || [],
        occasions: formData.occasions || []
      }

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error('Failed to create item: ' + (errorData.details || errorData.error || ''));
      }

      router.push('/catalog')
    } catch (error) {
      console.error('Error creating item:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold mb-0.5">Add New Item</h1>
          <p className="text-sm text-muted-foreground">Add a new item to your catalog</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-soft p-6">
          <AddItemForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/catalog')}
            category="tops"
          />
        </div>
      </div>
    </div>
  )
} 