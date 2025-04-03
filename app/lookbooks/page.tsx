'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Filter, Search, Lock, Globe } from 'lucide-react'
import type { Lookbook } from '@/app/models/types'

export default function LookbooksPage() {
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')

  const filteredLookbooks = lookbooks.filter(lookbook => {
    const matchesSearch = lookbook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lookbook.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesVisibility = visibility === 'all' ||
      (visibility === 'public' && lookbook.isPublic) ||
      (visibility === 'private' && !lookbook.isPublic)
    return matchesSearch && matchesVisibility
  })

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Lookbooks</h1>
            <p className="text-foreground-soft">Organize your outfits into themed collections</p>
          </div>
          <Link
            href="/lookbooks/create"
            className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Lookbook
          </Link>
        </div>

        <div className="bg-background rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-soft" />
              <input
                type="text"
                placeholder="Search lookbooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
            </div>
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-foreground-soft" />
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'all' | 'public' | 'private')}
                className="px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="all">All Visibility</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-background-soft rounded-lg mb-3" />
                <div className="h-4 bg-background-soft rounded w-3/4 mb-2" />
                <div className="h-4 bg-background-soft rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredLookbooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredLookbooks.map((lookbook) => (
              <Link
                key={lookbook.id}
                href={`/lookbooks/${lookbook.id}`}
                className="group bg-background rounded-lg border border-border overflow-hidden hover:border-accent-purple transition-colors"
              >
                <div className="relative aspect-[4/3]">
                  {lookbook.outfits[0]?.items?.[0]?.wardrobeItem?.images?.[0] ? (
                    <Image
                      src={lookbook.outfits[0].items[0].wardrobeItem.images[0].url}
                      alt={lookbook.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-background-soft flex items-center justify-center text-foreground-soft">
                      No Image
                    </div>
                  )}
                  {lookbook.isPublic ? (
                    <div className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full">
                      <Globe className="w-4 h-4 text-foreground-soft" />
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full">
                      <Lock className="w-4 h-4 text-foreground-soft" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1 group-hover:text-accent-purple transition-colors">
                    {lookbook.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-foreground-soft">
                    <span>{lookbook.outfits.length} outfits</span>
                    <span>{new Date(lookbook.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {lookbook.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft"
                      >
                        {tag}
                      </span>
                    ))}
                    {lookbook.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft">
                        +{lookbook.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No lookbooks found</h3>
            <p className="text-foreground-soft mb-6">
              {searchQuery || visibility !== 'all'
                ? "Try adjusting your filters"
                : "Start organizing your outfits into lookbooks"}
            </p>
            <Link
              href="/lookbooks/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Lookbook
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 