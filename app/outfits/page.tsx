'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Filter, Search, Star } from 'lucide-react'
import type { Outfit, Season, Occasion } from '@/app/models/types'

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeason, setSelectedSeason] = useState<'all' | Season>('all')
  const [selectedOccasion, setSelectedOccasion] = useState<'all' | Occasion>('all')

  const filteredOutfits = outfits.filter(outfit => {
    const matchesSearch = outfit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outfit.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesSeason = selectedSeason === 'all' || outfit.seasons.some(s => s === selectedSeason)
    const matchesOccasion = selectedOccasion === 'all' || outfit.occasions.some(o => o === selectedOccasion)
    return matchesSearch && matchesSeason && matchesOccasion
  })

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Outfits</h1>
            <p className="text-foreground-soft">Create and manage your outfit combinations</p>
          </div>
          <Link
            href="/outfits/create"
            className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Outfit
          </Link>
        </div>

        <div className="bg-background rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-soft" />
              <input
                type="text"
                placeholder="Search outfits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
            </div>
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-foreground-soft" />
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value as 'all' | Season)}
                className="px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="all">All Seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
              <select
                value={selectedOccasion}
                onChange={(e) => setSelectedOccasion(e.target.value as 'all' | Occasion)}
                className="px-4 py-2 bg-background-soft rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="all">All Occasions</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="business">Business</option>
                <option value="party">Party</option>
                <option value="sport">Sport</option>
                <option value="beach">Beach</option>
                <option value="evening">Evening</option>
                <option value="wedding">Wedding</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-background-soft rounded-lg mb-3" />
                <div className="h-4 bg-background-soft rounded w-3/4 mb-2" />
                <div className="h-4 bg-background-soft rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredOutfits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredOutfits.map((outfit) => (
              <Link
                key={outfit.id}
                href={`/outfits/${outfit.id}`}
                className="group bg-background rounded-lg border border-border overflow-hidden hover:border-accent-purple transition-colors"
              >
                <div className="relative aspect-[3/4]">
                  {outfit.items[0]?.wardrobeItem.images[0] ? (
                    <Image
                      src={outfit.items[0].wardrobeItem.images[0].url}
                      alt={outfit.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-background-soft flex items-center justify-center text-foreground-soft">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1 group-hover:text-accent-purple transition-colors">
                    {outfit.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-foreground-soft">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{outfit.rating || '-'}</span>
                    </div>
                    <span className="text-foreground-soft">${outfit.totalCost}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {outfit.occasions.slice(0, 2).map((occasion) => (
                      <span
                        key={occasion}
                        className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft capitalize"
                      >
                        {occasion}
                      </span>
                    ))}
                    {outfit.occasions.length > 2 && (
                      <span className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft">
                        +{outfit.occasions.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No outfits found</h3>
            <p className="text-foreground-soft mb-6">
              {searchQuery || selectedSeason !== 'all' || selectedOccasion !== 'all'
                ? "Try adjusting your filters"
                : "Start creating outfits with your catalog items"}
            </p>
            <Link
              href="/outfits/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Outfit
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 