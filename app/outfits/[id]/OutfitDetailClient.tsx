'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2,
  User,
  Clock,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import type { Outfit, Currency, User as UserType, OutfitItem } from '@/app/models/types';
import { formatPrice } from '@/lib/utils';
import OutfitThumbnail from '@/app/components/OutfitThumbnail';

interface ItemDetailsProps {
  item: OutfitItem;
  currency: Currency;
}

function ItemDetails({ item, currency }: ItemDetailsProps) {
  if (!item.wardrobeItem) {
    return null;
  }

  const handleItemClick = (e: React.MouseEvent) => {
    if (item.wardrobeItem?.purchaseUrl) {
      e.preventDefault();
      window.open(item.wardrobeItem.purchaseUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="bg-background-soft rounded-xl border border-border-bright overflow-hidden transition-all hover:border-accent-purple group cursor-pointer"
      onClick={handleItemClick}
    >
      <div className="flex flex-col">
        <div className="relative aspect-square overflow-hidden">
          {item.wardrobeItem.images[0]?.url ? (
            <Image
              src={item.wardrobeItem.images[0].url}
              alt={item.wardrobeItem.name}
              width={300}
              height={300}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-background flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {item.wardrobeItem.purchaseUrl && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        <div className="p-4">
          <span
            className="text-lg font-medium group-hover:text-accent-purple transition-colors line-clamp-1"
          >
            {item.wardrobeItem.name}
          </span>
          <p className="text-sm text-muted-foreground line-clamp-1">{item.wardrobeItem.brand}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="font-semibold">{formatPrice(item.wardrobeItem.price, currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OutfitDetailClientProps {
  initialOutfit: Outfit & { stats: { timesWorn: number } };
}

export default function OutfitDetailClient({ initialOutfit }: OutfitDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [outfit] = useState(initialOutfit);
  const [currency] = useState<Currency>('INR');

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/outfits/${outfit.id}`;
      await navigator.clipboard.writeText(url);
      // You might want to add a toast notification here
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleDelete = async () => {
    if (!outfit || !confirm('Are you sure you want to delete this outfit?')) return;

    try {
      const response = await fetch(`/api/outfits/${outfit.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete outfit');
      router.push('/outfits');
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  };

  const canEditOutfit = session?.user?.id === outfit.userId;

  const formattedDate = new Date(outfit.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-background-soft transition-colors self-start"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-display font-bold">{outfit.name}</h1>
              {outfit.description && (
                <p className="text-foreground-soft mt-2 text-base md:text-lg">{outfit.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-foreground-soft">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>By {outfit.user?.name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-foreground-soft hover:text-accent-purple transition-colors"
              title="Copy share link"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
            {canEditOutfit && (
              <>
                <button
                  onClick={() => router.push(`/outfits/${outfit.id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-accent-purple-dark transition-colors"
                  title="Edit Outfit"
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  title="Delete Outfit"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 md:gap-8">
          {/* Left Column - Outfit Display */}
          <div className="space-y-6 md:space-y-8">
            {/* Main outfit display */}
            <div className="bg-card rounded-xl md:rounded-2xl border border-border overflow-hidden">
              <div className="aspect-[4/3] relative">
                <OutfitThumbnail 
                  items={outfit.items
                    .map(item => item.wardrobeItem)
                    .filter(item => item !== undefined)}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Individual items grid */}
            <div className="bg-card rounded-xl md:rounded-2xl border border-border p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4">Outfit Items</h2>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {outfit.items.map((item) => (
                  <ItemDetails key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Outfit Details */}
          <div className="space-y-4 md:space-y-6">
            {/* Price */}
            <div className="bg-card rounded-xl md:rounded-2xl border border-border p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <div className="text-sm text-foreground-soft mb-1">Total Cost</div>
                  <div className="text-2xl md:text-3xl font-semibold">
                    {formatPrice(outfit.totalCost, currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Seasons */}
            {outfit.seasons.length > 0 && (
              <div className="bg-card rounded-xl md:rounded-2xl border border-border p-4 md:p-6">
                <h3 className="text-sm font-medium mb-3">Seasons</h3>
                <div className="flex flex-wrap gap-2">
                  {outfit.seasons.map((season) => (
                    <span
                      key={season.id}
                      className="px-3 py-1.5 bg-accent-blue/40 rounded-full text-sm capitalize"
                    >
                      {season.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Occasions */}
            {outfit.occasions.length > 0 && (
              <div className="bg-card rounded-xl md:rounded-2xl border border-border p-4 md:p-6">
                <h3 className="text-sm font-medium mb-3">Occasions</h3>
                <div className="flex flex-wrap gap-2">
                  {outfit.occasions.map((occasion) => (
                    <span
                      key={occasion.id}
                      className="px-3 py-1.5 bg-accent-blue/40 rounded-full text-sm capitalize"
                    >
                      {occasion.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {outfit.tags && outfit.tags.length > 0 && (
              <div className="bg-card rounded-xl md:rounded-2xl border border-border p-4 md:p-6">
                <h3 className="text-sm font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {outfit.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1.5 bg-accent-blue/40 rounded-full text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 