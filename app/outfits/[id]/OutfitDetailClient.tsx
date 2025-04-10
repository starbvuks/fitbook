"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import html2canvas from "html2canvas";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
  Download,
  User,
  Clock,
  ExternalLink,
  ImageIcon,
  CircleCheck,
} from "lucide-react";
import type {
  Outfit,
  Currency,
  User as UserType,
  OutfitItem,
  ClothingItem,
} from "@/app/models/types";
import { formatPrice } from "@/lib/utils";
import OutfitThumbnail from "@/app/components/OutfitThumbnail";

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
      window.open(
        item.wardrobeItem.purchaseUrl,
        "_blank",
        "noopener,noreferrer"
      );
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
          {item.wardrobeItem.isOwned && (
            <div
              className="absolute top-2 left-2 bg-green-600 backdrop-blur-sm text-primary-foreground rounded-full p-1 text-xs"
              title="Owned"
            >
              <CircleCheck className="w-3 h-3" />
            </div>
          )}
        </div>
        <div className="p-3">
          <span className="text-base font-medium group-hover:text-accent-purple transition-colors line-clamp-1">
            {item.wardrobeItem.name}
          </span>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.wardrobeItem.brand}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <p className="font-semibold text-sm">
              {formatPrice(item.wardrobeItem.price, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OutfitDetailClientProps {
  initialOutfit: Outfit & { stats: { timesWorn: number } };
}

export default function OutfitDetailClient({
  initialOutfit,
}: OutfitDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [outfit] = useState(initialOutfit);
  const [currency] = useState<Currency>("INR");
  const { toast } = useToast();
  const outfitDisplayRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/outfits/${outfit.id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Outfit link copied to clipboard.",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!outfit || !confirm("Are you sure you want to delete this outfit?"))
      return;

    try {
      const response = await fetch(`/api/outfits/${outfit.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete outfit");
      router.push("/outfits");
    } catch (error) {
      console.error("Error deleting outfit:", error);
    }
  };

  const handleDownload = async () => {
    if (!outfitDisplayRef.current) {
      toast({
        title: "Error",
        description: "Cannot find outfit element to capture.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating Image...",
      description: "Please wait a moment.",
    });

    try {
      const canvas = await html2canvas(outfitDisplayRef.current, {
        backgroundColor: "#111111",
        useCORS: true,
        scale: 2,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      const filename =
        outfit.name.trim().replace(/\s+/g, "-").toLowerCase() || "outfit";
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating outfit image:", error);
      toast({
        title: "Error",
        description: "Could not generate outfit image.",
        variant: "destructive",
      });
    }
  };

  const canEditOutfit = session?.user?.id === outfit.userId;

  const formattedDate = new Date(outfit.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categoryOrder = [
    "headwear",
    "tops",
    "outerwear",
    "bottoms",
    "shoes",
    "accessories",
  ];

  const sortedOutfitItems = [...outfit.items].sort((a, b) => {
    const aCategory = a.wardrobeItem?.category || "";
    const bCategory = b.wardrobeItem?.category || "";
    const aIndex = categoryOrder.indexOf(aCategory);
    const bIndex = categoryOrder.indexOf(bCategory);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 mt-1 rounded-lg hover:bg-accent-purple/20 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 hidden sm:block" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold">
                {outfit.name}
              </h1>
              {outfit.description && (
                <p className="text-foreground-soft mt-1 text-sm sm:text-base">
                  {outfit.description}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-2 text-sm text-foreground-soft">
                <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">
                    {outfit.user?.name || "Anonymous"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </div>
                </div>

                <div className="flex flex-wrap justify-start sm:justify-end items-center gap-1.5 sm:gap-2 mt-3 sm:mt-0">
                  <button
                    onClick={handleShare}
                    className="btn btn-ghost border-2 h-8 px-3 flex items-center gap-1.5"
                    title="Copy share link"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="btn btn-ghost border-2 h-8 px-2 flex items-center gap-1.5"
                    title="Download Outfit Image"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Download</span>
                  </button>
                  {canEditOutfit && (
                    <>
                      <button
                        onClick={() =>
                          router.push(`/outfits/${outfit.id}/edit`)
                        }
                        className="btn btn-primary h-8 px-2 flex items-center gap-1.5"
                        title="Edit Outfit"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">Edit</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="btn text-red-500 border border-red-500 h-8 px-2 flex items-center gap-1.5"
                        title="Delete Outfit"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 md:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="sm:aspect-[4/3] relative">
                <OutfitThumbnail
                  items={sortedOutfitItems
                    .map((item) => item.wardrobeItem)
                    .filter((item): item is ClothingItem => item !== undefined)}
                  className="w-full h-full"
                />
              </div>
            </div>

            <div
              ref={outfitDisplayRef}
              className="bg-card rounded-xl md:rounded-2xl border border-border p-4 md:p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Outfit Items</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {sortedOutfitItems.map((item) => (
                  <ItemDetails key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground-soft">Total Cost</div>
                  <div className="text-xl sm:text-2xl font-semibold">
                    {formatPrice(outfit.totalCost, currency)}
                  </div>
                </div>
              </div>
            </div>

            {outfit.seasons.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium mb-2">Seasons</h3>
                <div className="flex flex-wrap gap-1.5">
                  {outfit.seasons.map((season) => (
                    <span
                      key={season.id}
                      className="px-2.5 py-1 bg-accent-blue/40 rounded-full text-sm capitalize"
                    >
                      {season.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {outfit.occasions.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium mb-2">Occasions</h3>
                <div className="flex flex-wrap gap-1.5">
                  {outfit.occasions.map((occasion) => (
                    <span
                      key={occasion.id}
                      className="px-2.5 py-1 bg-accent-blue/40 rounded-full text-sm capitalize"
                    >
                      {occasion.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {outfit.tags && outfit.tags.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {outfit.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2.5 py-1 bg-accent-blue/40 rounded-full text-sm"
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
