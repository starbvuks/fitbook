'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download,
  Share2,
  Star,
  Calendar,
  DollarSign
} from 'lucide-react';
import type { Outfit, Currency } from '@/app/models/types';
import { formatPrice } from '@/lib/utils';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function OutfitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileResponse, outfitResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch(`/api/outfits/${params.id}`)
        ]);

        if (!profileResponse.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileResponse.json();
        setCurrency(profileData.currency || 'USD');

        if (!outfitResponse.ok) throw new Error('Failed to fetch outfit');
        const outfitData = await outfitResponse.json();
        setOutfit(outfitData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load outfit');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: outfit?.name || 'My Outfit',
        text: `Check out my outfit: ${outfit?.name}`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
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

  if (loading) return <LoadingSpinner text="Loading outfit..." />;

  if (error) {
    return (
      <div className="min-h-screen pt-16 bg-background-soft">
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

  return (
    <div className="min-h-screen pt-16 bg-background-soft">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-background transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-display font-bold">{outfit.name}</h1>
              {outfit.description && (
                <p className="text-foreground-soft mt-1">{outfit.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-foreground-soft hover:text-accent-purple transition-colors"
              title="Share Outfit"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push(`/outfits/${outfit.id}/edit`)}
              className="p-2 rounded-lg text-foreground-soft hover:text-accent-purple transition-colors"
              title="Edit Outfit"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-foreground-soft hover:text-red-500 transition-colors"
              title="Delete Outfit"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Left Column - Outfit Display */}
          <div className="space-y-6">
            <div className="bg-background rounded-xl border border-border p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {outfit.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-lg border border-border overflow-hidden group"
                  >
                    <Image
                      src={item.wardrobeItem.images[0]?.url || '/placeholder.png'}
                      alt={item.wardrobeItem.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <div className="text-sm font-medium truncate">{item.wardrobeItem.name}</div>
                        <div className="text-xs">{formatPrice(item.wardrobeItem.price, currency)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Outfit Details */}
          <div className="space-y-6">
            <div className="bg-background rounded-xl border border-border p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-lg font-medium">
                      {formatPrice(outfit.totalCost, currency)}
                    </span>
                  </div>
                  {outfit.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-medium">{outfit.rating}</span>
                    </div>
                  )}
                </div>

                {outfit.stats?.timesWorn && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>Worn {outfit.stats.timesWorn} times</span>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium mb-2">Seasons</h3>
                  <div className="flex flex-wrap gap-2">
                    {outfit.seasons.map((season) => (
                      <span
                        key={season.id}
                        className="px-3 py-1 bg-background-soft rounded-full text-sm capitalize"
                      >
                        {season.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Occasions</h3>
                  <div className="flex flex-wrap gap-2">
                    {outfit.occasions.map((occasion) => (
                      <span
                        key={occasion.id}
                        className="px-3 py-1 bg-background-soft rounded-full text-sm capitalize"
                      >
                        {occasion.name}
                      </span>
                    ))}
                  </div>
                </div>

                {outfit.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {outfit.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-background-soft rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 