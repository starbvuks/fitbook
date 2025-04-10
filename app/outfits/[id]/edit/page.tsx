import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import EditOutfitClient from '@/app/outfits/[id]/edit/EditOutfitClient' // Try absolute path
import type { Outfit, ClothingItem, Season, Occasion, Currency, ClothingCategory } from '@/app/models/types'

interface EditOutfitPageProps {
  params: any; // Use any for params
  // You might also need searchParams: any if you use them
}

// Fetch data on the server
async function getOutfitData(outfitId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401, outfit: null, items: [], profile: null };
  }

  const userId = session.user.id

  // Fetch outfit, profile, and available items in parallel
  const [outfit, profile, availableItems] = await Promise.all([
    prisma.outfit.findUnique({
      where: { id: outfitId },
      include: {
        items: { 
          include: { 
            wardrobeItem: { 
              include: { 
                images: { include: { colors: true } },
                colors: true, 
                tags: true, 
                seasons: true, 
                occasions: true 
              } 
            } 
          } 
        },
        tags: true,
        seasons: true,
        occasions: true,
        user: true
      }
    }),
    prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { currency: true } 
    }),
    prisma.wardrobeItem.findMany({ 
        where: { userId },
        include: { 
          images: { include: { colors: true } },
          colors: true, 
          tags: true, 
          seasons: true, 
          occasions: true 
        }
    })
  ])

  if (!outfit) {
    return { error: 'Outfit not found', status: 404, outfit: null, items: [], profile: null };
  }

  // *** Crucial Check: Verify Ownership ***
  if (outfit.userId !== userId) {
    return { error: 'Forbidden', status: 403, outfit: null, items: [], profile: null };
  }

  return {
    error: null,
    status: 200,
    outfit: outfit as Outfit,
    items: availableItems as ClothingItem[],
    profile: profile
  };
}

export default async function EditOutfitPage({ params }: EditOutfitPageProps) {
  const id = params?.id; // Safely access id
  if (!id) {
    return (
       <div className="min-h-screen pt-16 flex items-center justify-center text-red-500">
         <p>Error: Missing Outfit ID.</p>
       </div>
    );
  }
  const { error, status, outfit, items, profile } = await getOutfitData(id);

  if (error) {
    if (status === 404) notFound(); // Use Next.js notFound for 404
    // For 401/403, you might redirect or show a generic error
    // For simplicity, showing a generic message here
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center text-red-500">
        <p>{error} (Status: {status})</p>
      </div>
    );
  }

  // If data is fetched successfully, render the client component
  return (
    <EditOutfitClient 
      initialOutfit={outfit!} 
      initialAvailableItems={items}
      initialCurrency={(profile?.currency || 'USD') as Currency}
    />
  );
} 