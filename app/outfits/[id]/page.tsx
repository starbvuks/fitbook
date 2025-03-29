'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download,
  Share2,
  Star,
  Calendar,
  Tag,
  DollarSign,
  User,
  Clock,
  Heart,
  ExternalLink,
  Info
} from 'lucide-react';
import type { Outfit, Currency, User as UserType, OutfitItem } from '@/app/models/types';
import { formatPrice } from '@/lib/utils';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import OutfitThumbnail from '@/app/components/OutfitThumbnail';

interface ItemDetailsProps {
  item: OutfitItem;
  currency: Currency;
}

function ItemDetails({ item, currency }: ItemDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!item.wardrobeItem) return null;

  const handleItemClick = () => {
    if (item.wardrobeItem?.purchaseUrl) {
      window.open(item.wardrobeItem.purchaseUrl, '_blank');
    }
  };

  return (
    <div 
      className={`group relative aspect-square rounded-lg border border-border overflow-hidden bg-background-soft cursor-pointer ${
        item.wardrobeItem.purchaseUrl ? 'hover:border-accent-purple' : ''
      }`}
      onClick={handleItemClick}
    >
      {item.wardrobeItem.images?.[0] ? (
        <Image
          src={item.wardrobeItem.images[0].url}
          alt={item.wardrobeItem.name || 'Outfit item'}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-foreground-soft">
          No Image
        </div>
      )}
      
      {/* <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
          className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div> */}

      {showDetails ? (
        <div 
          className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-4 text-white overflow-y-auto z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="font-medium mb-2">{item.wardrobeItem.name}</h4>
          {item.wardrobeItem.brand && (
            <p className="text-sm text-white/80 mb-2">{item.wardrobeItem.brand}</p>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Price:</span>
              <span>{formatPrice(item.wardrobeItem.price, currency)}</span>
            </div>
            {item.wardrobeItem.size && (
              <div className="flex justify-between items-center">
                <span className="text-white/80">Size:</span>
                <span>{item.wardrobeItem.size}</span>
              </div>
            )}
            {item.wardrobeItem.material && (
              <div className="flex justify-between items-center">
                <span className="text-white/80">Material:</span>
                <span>{item.wardrobeItem.material}</span>
              </div>
            )}
            {item.position && (
              <div className="flex justify-between items-center">
                <span className="text-white/80">Position:</span>
                <span className="capitalize">{item.position.replace('_', ' ')}</span>
              </div>
            )}
            {item.wardrobeItem.purchaseUrl && (
              <a
                href={item.wardrobeItem.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent-purple hover:text-accent-purple-light mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buy Now</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <div className="text-sm font-medium line-clamp-2">
              {item.wardrobeItem.name}
            </div>
            <div className="text-xs mt-1 flex items-center justify-between">
              <span>{formatPrice(item.wardrobeItem.price, currency)}</span>
              {item.wardrobeItem.brand && (
                <span className="text-white/80">{item.wardrobeItem.brand}</span>
              )}
            </div>
 
          </div>
        </div>
      )}
    </div>
  );
}

export default function OutfitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileResponse, outfitResponse, userResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch(`/api/outfits/${resolvedParams.id}`),
          fetch('/api/user/me')
        ]);

        if (!profileResponse.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileResponse.json();
        setCurrency(profileData.currency || 'USD');

        if (!outfitResponse.ok) throw new Error('Failed to fetch outfit');
        const outfitData = await outfitResponse.json();
        console.log('Outfit data:', outfitData); // Debug log
        setOutfit(outfitData);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load outfit');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const handleShare = async () => {
    if (!outfit) return;
    
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
      setError(error instanceof Error ? error.message : 'Failed to delete outfit');
    }
  };

  const canEditOutfit = currentUser?.id === outfit?.userId;

  if (loading) return (
    <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
      <LoadingSpinner text="Loading outfit..." />
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen pt-16 bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!outfit) return null;

  const formattedDate = new Date(outfit.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-background-soft transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-bold">{outfit.name}</h1>
              {outfit.description && (
                <p className="text-foreground-soft mt-2 text-lg">{outfit.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-foreground-soft">
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
          <div className="flex items-center gap-3">
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple text-white hover:bg-accent-purple-dark transition-colors"
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

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Left Column - Outfit Display */}
          <div className="space-y-8">
            {/* Main outfit display */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Outfit Items</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {outfit.items.map((item) => (
                  <ItemDetails key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Outfit Details */}
          <div className="space-y-6">
            {/* Price */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-foreground-soft mb-1">Total Cost</div>
                  <div className="text-3xl font-semibold">
                    {formatPrice(outfit.totalCost, currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Seasons */}
            {outfit.seasons.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-medium mb-3">Seasons</h3>
                <div className="flex flex-wrap gap-2">
                  {outfit.seasons.map((season) => (
                    <span
                      key={season.id}
                      className="px-4 py-2 bg-background-soft rounded-full text-sm capitalize"
                    >
                      {season.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Occasions */}
            {outfit.occasions.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-medium mb-3">Occasions</h3>
                <div className="flex flex-wrap gap-2">
                  {outfit.occasions.map((occasion) => (
                    <span
                      key={occasion.id}
                      className="px-4 py-2 bg-background-soft rounded-full text-sm capitalize"
                    >
                      {occasion.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {outfit.tags && outfit.tags.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {outfit.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-4 py-2 bg-background-soft rounded-full text-sm"
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