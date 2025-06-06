'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Star, 
  Calendar, 
  ShoppingBag, 
  Package,
  Sparkles,
  TrendingUp,
  Camera,
  BarChart3,
  Target,
  Crown
} from 'lucide-react'
import type { ClothingItem, ClothingCategory, Currency, Outfit } from '../../models/types'
import PriceDisplay from '@/app/components/PriceDisplay'
import { formatCurrency, getDominantCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

// Simple date formatting function
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

interface PublicProfileData {
  user: {
    id: string;
    name: string;
    image?: string;
    currency: Currency;
    createdAt: Date;
  };
  stats: {
    totalItems: number;
    totalOutfits: number;
    totalValue: number;
    ownedItems: number;
    wishlistItems: number;
    avgOutfitRating: number;
    totalTimesWorn: number;
    favoriteCategories: Array<{ category: ClothingCategory; count: number }>;
    favoriteBrands: Array<{ brand: string; count: number }>;
    favoriteColors: Array<{ color: string; count: number }>;
  };
  recentOutfits: Outfit[];
  featuredItems: ClothingItem[];
}

interface PublicProfileClientProps {
  profileData: PublicProfileData;
}

const categoryEmojis: Record<ClothingCategory, string> = {
  headwear: '👒',
  tops: '👕',
  bottoms: '👖',
  outerwear: '🧥',
  shoes: '👟',
  accessories: '💍'
}

const categoryLabels: Record<ClothingCategory, string> = {
  headwear: 'Headwear',
  tops: 'Tops',
  bottoms: 'Bottoms',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessories: 'Accessories'
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle
}: {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

function AnalyticsCard({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function OutfitCard({ outfit, userCurrency }: { outfit: Outfit; userCurrency: Currency }) {
  const mainImage = outfit.items
    .find(item => item.wardrobeItem?.images?.length)
    ?.wardrobeItem?.images?.[0];

  return (
    <Link href={`/outfits/${outfit.id}`} className="group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300">
        <div className="aspect-square bg-gray-100 relative">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={outfit.name}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          {outfit.rating && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {outfit.rating}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h4 className="font-medium truncate mb-2 text-gray-900">{outfit.name}</h4>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{outfit.items.length} items</span>
            <PriceDisplay
              amount={outfit.totalCost}
              currency={getDominantCurrency(outfit.items.map(i => i.wardrobeItem).filter(Boolean) as ClothingItem[])}
              userCurrency={userCurrency}
              className="text-sm font-medium text-gray-900"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ItemCard({ item, userCurrency }: { item: ClothingItem; userCurrency: Currency }) {
  const mainImage = item.images[0];

  return (
    <Link href={`/catalog/${item.id}`} className="group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300">
        <div className="aspect-square bg-gray-100 relative">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs">
            {categoryEmojis[item.category]} {categoryLabels[item.category]}
          </div>
        </div>
        
        <div className="p-4">
          <h4 className="font-medium truncate mb-1 text-gray-900">{item.name}</h4>
          {item.brand && (
            <p className="text-sm text-gray-600 truncate mb-2">{item.brand}</p>
          )}
          <div className="flex items-center justify-between">
            <PriceDisplay
              amount={item.price}
              currency={item.priceCurrency}
              userCurrency={userCurrency}
              className="text-sm font-medium text-gray-900"
            />
            <div className={cn(
              "w-2 h-2 rounded-full",
              item.isOwned ? "bg-green-500" : "bg-orange-500"
            )} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PublicProfileClient({ profileData }: PublicProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'outfits' | 'items'>('outfits');
  const { user, stats, recentOutfits, featuredItems } = profileData;

  // Calculate level based on activity
  const activityScore = stats.totalItems + (stats.totalOutfits * 2) + (stats.totalTimesWorn * 0.5);
  const level = Math.floor(activityScore / 20) + 1;
  const progressToNext = ((activityScore % 20) / 20) * 100;

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-100 relative overflow-hidden">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
                    <span className="text-2xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {level > 1 && (
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                  {level}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                {level >= 5 && <Crown className="w-5 h-5 text-yellow-500" />}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatTimeAgo(user.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Level {level} Fashionista
                </div>
              </div>

              {/* Level progress bar */}
              {level < 10 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress to Level {level + 1}</span>
                    <span className="font-medium text-gray-900">{Math.round(progressToNext)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Package}
            label="Total Items"
            value={stats.totalItems}
            subtitle={`${stats.ownedItems} owned, ${stats.wishlistItems} wishlist`}
          />
          <StatCard
            icon={Sparkles}
            label="Outfits Created"
            value={stats.totalOutfits}
            subtitle={stats.avgOutfitRating > 0 ? `${stats.avgOutfitRating.toFixed(1)}★ avg rating` : undefined}
          />
          <StatCard
            icon={ShoppingBag}
            label="Total Value"
            value={formatCurrency(stats.totalValue, user.currency)}
          />
          <StatCard
            icon={TrendingUp}
            label="Times Worn"
            value={stats.totalTimesWorn}
            subtitle="outfit wears"
          />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Favorite Categories */}
          <AnalyticsCard title="Top Categories" icon={BarChart3}>
            <div className="space-y-3">
              {stats.favoriteCategories.map((cat, index) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryEmojis[cat.category]}</span>
                    <span className="capitalize text-sm font-medium text-gray-900">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(cat.count / stats.totalItems) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[2ch] text-gray-900">{cat.count}</span>
                  </div>
                </div>
              ))}
              {stats.favoriteCategories.length === 0 && (
                <p className="text-sm text-gray-600">No items yet</p>
              )}
            </div>
          </AnalyticsCard>

          {/* Favorite Brands */}
          <AnalyticsCard title="Favorite Brands" icon={Star}>
            <div className="space-y-3">
              {stats.favoriteBrands.slice(0, 5).map((brand, index) => (
                <div key={brand.brand} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate text-gray-900">{brand.brand}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(brand.count / stats.totalItems) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 min-w-[2ch]">{brand.count}</span>
                  </div>
                </div>
              ))}
              {stats.favoriteBrands.length === 0 && (
                <p className="text-sm text-gray-600">No brands tracked yet</p>
              )}
            </div>
          </AnalyticsCard>

          {/* Color Palette */}
          <AnalyticsCard title="Color Palette" icon={Sparkles}>
            <div className="space-y-3">
              {stats.favoriteColors.slice(0, 6).map((colorData, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: colorData.color }}
                  />
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: colorData.color,
                          width: `${(colorData.count / stats.favoriteColors.reduce((sum, c) => sum + c.count, 0)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {Math.round((colorData.count / stats.favoriteColors.reduce((sum, c) => sum + c.count, 0)) * 100)}%
                  </span>
                </div>
              ))}
              {stats.favoriteColors.length === 0 && (
                <p className="text-sm text-gray-600">No colors extracted yet</p>
              )}
            </div>
          </AnalyticsCard>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('outfits')}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-colors text-sm",
                activeTab === 'outfits'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Recent Outfits ({recentOutfits.length})
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-colors text-sm",
                activeTab === 'items'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Featured Items ({featuredItems.length})
            </button>
          </div>

          {activeTab === 'outfits' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentOutfits.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} userCurrency={user.currency} />
              ))}
              {recentOutfits.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2 text-gray-900">No public outfits yet</h3>
                  <p className="text-sm text-gray-600">
                    When this user creates public outfits, they&apos;ll appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredItems.map((item) => (
                <ItemCard key={item.id} item={item} userCurrency={user.currency} />
              ))}
              {featuredItems.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2 text-gray-900">No items with images yet</h3>
                  <p className="text-sm text-gray-600">
                    Items with photos will be featured here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 