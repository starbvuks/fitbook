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
  Info,
  ImageIcon,
  Pencil,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Outfit, Currency, User as UserType, OutfitItem, Season, Occasion, Tag as PrismaTag, ClothingItem, Image as PrismaImage } from '@/app/models/types';
import { formatPrice } from '@/lib/utils';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import OutfitThumbnail from '@/app/components/OutfitThumbnail';

interface ItemDetailsProps {
  item: OutfitItem;
  currency: Currency;
}

function ItemDetails({ item, currency }: ItemDetailsProps) {
  if (!item.wardrobeItem) {
    return null;
  }

  return (
    <div className="bg-background-soft rounded-xl border border-border-bright overflow-hidden transition-all hover:border-accent-purple">
      <div className="flex flex-col">
        <div className="relative aspect-square overflow-hidden">
          {item.wardrobeItem.images[0]?.url ? (
            <Image
              src={item.wardrobeItem.images[0].url}
              alt={item.wardrobeItem.name}
              width={300}
              height={300}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-background flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-4">
          <Link href={`/catalog/${item.wardrobeItem.id}`} className="text-lg font-medium hover:text-accent-purple transition-colors">
            {item.wardrobeItem.name}
          </Link>
          <p className="text-sm text-muted-foreground">{item.wardrobeItem.brand}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="font-semibold">{formatPrice(item.wardrobeItem.price, currency)}</p>
            <Link href={`/catalog/${item.wardrobeItem.id}`} className="text-xs text-accent-purple flex items-center gap-1 hover:underline">
              <ExternalLink className="w-3 h-3" /> View
            </Link>
          </div>
        </div>
      </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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