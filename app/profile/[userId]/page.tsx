import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PublicProfileClient from './PublicProfileClient';
import type { 
  User,
  Outfit,
  ClothingItem,
  Currency,
  ClothingCategory,
  SeasonName,
  OccasionName,
  Season,
  Occasion,
  Color,
  Image
} from '../../models/types';

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
  return ['headwear', 'tops', 'bottoms', 'outerwear', 'shoes', 'accessories'].includes(value);
}

function transformColor(color: { name: string | null; id: string; hex: string; prevalence: number }): Color {
  return {
    name: color.name || undefined,
    hex: color.hex,
    prevalence: color.prevalence
  };
}

interface GeneratedPageParams {
  userId: string;
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<GeneratedPageParams>;
}) {
  const resolvedParams = await params;
  
  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.userId },
    select: {
      id: true,
      name: true,
      image: true,
      currency: true,
      createdAt: true
    }
  });

  if (!user || !user.name) {
    notFound();
  }

  // Fetch user's items
  const items = await prisma.wardrobeItem.findMany({
    where: { userId: resolvedParams.userId },
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
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch user's public outfits
  const outfits = await prisma.outfit.findMany({
    where: { 
      userId: resolvedParams.userId,
      isPublic: true
    },
    include: {
      items: {
        include: {
          wardrobeItem: {
            select: {
              id: true,
              name: true,
              category: true,
              brand: true,
              price: true,
              priceCurrency: true,
              images: {
                select: {
                  id: true,
                  url: true,
                  publicId: true,
                  colors: true,
                  isPrimary: true
                }
              }
            }
          }
        }
      },
      tags: true,
      seasons: true,
      occasions: true
    },
    orderBy: { createdAt: 'desc' },
    take: 6
  });

  // Calculate stats
  const totalItems = items.length;
  const totalOutfits = outfits.length;
  const totalValue = items.reduce((sum, item) => sum + item.price, 0);
  const ownedItems = items.filter(item => item.isOwned).length;
  const wishlistItems = items.filter(item => !item.isOwned).length;
  const avgOutfitRating = outfits.length > 0 
    ? outfits.reduce((sum, outfit) => sum + (outfit.rating || 0), 0) / outfits.length
    : 0;
  const totalTimesWorn = outfits.reduce((sum, outfit) => sum + (outfit.timesWorn || 0), 0);

  // Calculate favorite categories
  const categoryCount = items.reduce((acc, item) => {
    if (isClothingCategory(item.category)) {
      acc[item.category] = (acc[item.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<ClothingCategory, number>);

  const favoriteCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category: category as ClothingCategory, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Calculate favorite brands
  const brandCount = items.reduce((acc, item) => {
    if (item.brand) {
      acc[item.brand] = (acc[item.brand] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const favoriteBrands = Object.entries(brandCount)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Calculate favorite colors from item images
  const colorCount = items.reduce((acc, item) => {
    item.images.forEach(image => {
      if (image.colors) {
        image.colors.forEach((color: any) => {
          acc[color.hex] = (acc[color.hex] || 0) + color.prevalence;
        });
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const favoriteColors = Object.entries(colorCount)
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Transform data
  const profileData: PublicProfileData = {
    user: {
      id: user.id,
      name: user.name,
      image: user.image || undefined,
      currency: isCurrency(user.currency) ? user.currency : 'USD',
      createdAt: user.createdAt
    },
    stats: {
      totalItems,
      totalOutfits,
      totalValue,
      ownedItems,
      wishlistItems,
      avgOutfitRating,
      totalTimesWorn,
      favoriteCategories,
      favoriteBrands,
      favoriteColors
    },
    recentOutfits: outfits.map(outfit => ({
      id: outfit.id,
      name: outfit.name,
      description: outfit.description || undefined,
      totalCost: outfit.totalCost,
      rating: outfit.rating || undefined,
      createdAt: outfit.createdAt,
      updatedAt: outfit.updatedAt,
      userId: outfit.userId,
      timesWorn: outfit.timesWorn || 0,
      isPublic: outfit.isPublic || false,
      favorited: outfit.favorited,
      items: outfit.items.map(item => ({
        id: item.id,
        outfitId: item.outfitId,
        wardrobeItemId: item.wardrobeItemId,
        position: item.position,
        wardrobeItem: item.wardrobeItem && isClothingCategory(item.wardrobeItem.category) ? {
          id: item.wardrobeItem.id,
          userId: resolvedParams.userId,
          name: item.wardrobeItem.name,
          category: item.wardrobeItem.category,
          brand: item.wardrobeItem.brand || undefined,
          price: item.wardrobeItem.price,
          priceCurrency: (item.wardrobeItem.priceCurrency as Currency) || 'USD',
          purchaseUrl: undefined,
          size: undefined,
          material: undefined,
          condition: undefined,
          isOwned: true,
          notes: undefined,
          images: item.wardrobeItem.images.map(img => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
            colors: img.colors?.map(transformColor),
            isPrimary: img.isPrimary
          })),
          tags: [],
          seasons: [],
          occasions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        } : undefined
      })),
      seasons: outfit.seasons.filter(s => isSeasonName(s.name)) as Season[],
      occasions: outfit.occasions.filter(o => isOccasionName(o.name)) as Occasion[],
      tags: outfit.tags
    })),
    featuredItems: items
      .filter(item => item.images.length > 0)
      .slice(0, 8)
      .map(item => ({
        id: item.id,
        userId: item.userId,
        name: item.name,
        category: isClothingCategory(item.category) ? item.category : 'accessories',
        brand: item.brand || undefined,
        price: item.price,
        priceCurrency: (item.priceCurrency as Currency) || 'USD',
        purchaseUrl: item.purchaseUrl || undefined,
        size: item.size || undefined,
        material: item.material || undefined,
        condition: item.condition || undefined,
        isOwned: item.isOwned,
        notes: item.notes || undefined,
        images: item.images.map(img => ({
          id: img.id,
          url: img.url,
          publicId: img.publicId,
          colors: img.colors?.map(transformColor),
          isPrimary: img.isPrimary
        })),
        tags: item.tags,
        seasons: item.seasons.filter(s => isSeasonName(s.name)) as Season[],
        occasions: item.occasions.filter(o => isOccasionName(o.name)) as Occasion[],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
  };

  return <PublicProfileClient profileData={profileData} />;
} 