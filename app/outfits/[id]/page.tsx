import { prisma } from '@/lib/prisma';
import OutfitDetailClient from './OutfitDetailClient';
import type { 
  Outfit, 
  Season, 
  Occasion, 
  SeasonName, 
  OccasionName, 
  User, 
  Currency,
  ClothingCategory,
  ClothingItem,
  Image,
  Color
} from '@/app/models/types';

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

interface OutfitWithStats extends Outfit {
  stats: {
    timesWorn: number;
  };
  favorited: boolean;
}

function isSeasonName(name: string): name is SeasonName {
  return ['spring', 'summer', 'fall', 'winter'].includes(name);
}

function isOccasionName(name: string): name is OccasionName {
  return ['casual', 'formal', 'business', 'party', 'sport', 'beach', 'evening', 'wedding'].includes(name);
}

function isCurrency(value: string): value is Currency {
  return ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD'].includes(value);
}

function isClothingCategory(value: string): value is ClothingCategory {
  return ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'].includes(value);
}

// Helper to transform color data
function transformColor(color: { name: string | null; id: string; hex: string; prevalence: number }): Color {
  return {
    name: color.name || undefined,
    hex: color.hex,
    prevalence: color.prevalence
  };
}

export default async function OutfitDetailPage({ params }: PageProps) {
  const outfit = await prisma.outfit.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          currency: true,
          language: true,
          darkMode: true
        }
      },
      items: {
        include: {
          wardrobeItem: {
            include: {
              images: {
                select: {
                  id: true,
                  url: true,
                  publicId: true,
                  colors: true,
                  isPrimary: true
                }
              },
              tags: true,
              seasons: true,
              occasions: true
            }
          }
        }
      },
      seasons: {
        select: {
          id: true,
          name: true
        }
      },
      occasions: {
        select: {
          id: true,
          name: true
        }
      },
      tags: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!outfit) {
    return (
      <div className="min-h-screen pt-16 bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Outfit not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform the data to match the OutfitWithStats type
  const outfitData: OutfitWithStats = {
    id: outfit.id,
    name: outfit.name,
    description: outfit.description || undefined,
    totalCost: outfit.totalCost,
    rating: outfit.rating || undefined,
    createdAt: outfit.createdAt.toISOString(),
    updatedAt: outfit.updatedAt.toISOString(),
    userId: outfit.userId,
    favorited: outfit.favorited,
    user: outfit.user && isCurrency(outfit.user.currency) ? {
      id: outfit.user.id,
      name: outfit.user.name || undefined,
      image: outfit.user.image || undefined,
      currency: outfit.user.currency,
      language: outfit.user.language,
      darkMode: outfit.user.darkMode
    } : undefined,
    items: outfit.items.map(item => ({
      id: item.id,
      outfitId: item.outfitId,
      wardrobeItemId: item.wardrobeItemId,
      position: item.position,
      wardrobeItem: item.wardrobeItem && isClothingCategory(item.wardrobeItem.category) ? {
        id: item.wardrobeItem.id,
        userId: item.wardrobeItem.userId,
        name: item.wardrobeItem.name,
        category: item.wardrobeItem.category,
        brand: item.wardrobeItem.brand || undefined,
        price: item.wardrobeItem.price,
        purchaseUrl: item.wardrobeItem.purchaseUrl || undefined,
        size: item.wardrobeItem.size || undefined,
        material: item.wardrobeItem.material || undefined,
        condition: item.wardrobeItem.condition || undefined,
        isOwned: item.wardrobeItem.isOwned,
        notes: item.wardrobeItem.notes || undefined,
        images: item.wardrobeItem.images.map(img => ({
          id: img.id,
          url: img.url,
          publicId: img.publicId,
          colors: (img.colors || []).map(transformColor),
          isPrimary: img.isPrimary
        })),
        tags: item.wardrobeItem.tags,
        seasons: item.wardrobeItem.seasons.filter(s => isSeasonName(s.name)) as Season[],
        occasions: item.wardrobeItem.occasions.filter(o => isOccasionName(o.name)) as Occasion[],
        createdAt: item.wardrobeItem.createdAt,
        updatedAt: item.wardrobeItem.updatedAt
      } : undefined
    })),
    seasons: outfit.seasons.filter(s => isSeasonName(s.name)) as Season[],
    occasions: outfit.occasions.filter(o => isOccasionName(o.name)) as Occasion[],
    tags: outfit.tags,
    stats: {
      timesWorn: outfit.timesWorn || 0
    }
  };

  return <OutfitDetailClient initialOutfit={outfitData} />;
} 