import { prisma } from '@/lib/prisma';
import OutfitDetailClient from './OutfitDetailClient';

export default async function OutfitDetailPage({ params }: { params: { id: string } }) {
  const outfit = await prisma.outfit.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      items: {
        include: {
          wardrobeItem: {
            include: {
              images: true,
              tags: true
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

  // Calculate stats
  const stats = {
    timesWorn: outfit.timesWorn || 0
  };

  const outfitData = {
    ...outfit,
    stats
  };

  return <OutfitDetailClient initialOutfit={outfitData} />;
} 