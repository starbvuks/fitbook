"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import PriceDisplay from "@/app/components/PriceDisplay";
import { getDominantCurrency } from "@/lib/currency";
import { toPng } from 'html-to-image';

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
      className="bg-background-soft max-w-3xl rounded-xl border border-border-bright overflow-hidden transition-all hover:border-accent-purple group cursor-pointer"
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
            <div className="font-semibold text-sm">
              <PriceDisplay
                amount={item.wardrobeItem.price}
                currency={item.wardrobeItem.priceCurrency || 'INR'}
                userCurrency={currency}
                showTooltip={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OutfitMannequinProps {
  items: OutfitItem[];
  currency: Currency;
  mannequinRef: React.RefObject<HTMLDivElement>;
  exportMode?: boolean;
}

function OutfitMannequin({ items, currency, mannequinRef, exportMode = false }: OutfitMannequinProps & { exportMode?: boolean }) {
  // Group items by category
  const byCategory: Record<string, OutfitItem | undefined> = {};
  const accessories: OutfitItem[] = [];
  items.forEach(item => {
    const cat = item.wardrobeItem?.category;
    if (cat && MANNEQUIN_CATEGORIES.includes(cat)) {
      byCategory[cat] = item;
    } else if (cat === 'accessories') {
      accessories.push(item);
    }
  });

  // Helper to render image (Next.js Image or <img> for export)
  const renderImage = (url: string, alt: string, size: number, className = "") => {
    if (exportMode) {
      return (
        <img
          src={url}
          alt={alt}
          width={size}
          height={size}
          style={{ objectFit: 'contain', width: size, height: size, display: 'block' }}
          className={className}
        />
      );
    }
    return (
      <Image
        src={url}
        alt={alt}
        width={size}
        height={size}
        className={"object-contain w-full h-full " + className}
      />
    );
  };

  return (
    <div
      ref={mannequinRef}
      className={`w-[500px] sm:w-[600px] mx-auto ${exportMode ? 'bg-white' : 'bg-white/80 dark:bg-card/80'} ${exportMode ? '' : 'backdrop-blur-lg shadow-2xl border border-border'} rounded-2xl px-12 py-12 mb-8 flex flex-col gap-4 overflow-visible min-h-[420px] relative`}
      style={{ position: 'relative', boxShadow: exportMode ? 'none' : undefined, border: exportMode ? 'none' : undefined }}
    >
      {/* Mannequin rows */}
      {MANNEQUIN_CATEGORIES.map((cat, idx) => {
        const item = byCategory[cat];
        if (!item || !item.wardrobeItem) return null;
        return (
          <div
            key={cat}
            className={
              'flex items-center gap-6 py-4' +
              (idx !== MANNEQUIN_CATEGORIES.length - 1 ? ' border-b border-border/60' : '')
            }
          >
            <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-background-soft border border-border shadow-md">
              {item.wardrobeItem.images[0]?.url ? (
                renderImage(item.wardrobeItem.images[0].url, item.wardrobeItem.name, 96)
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-foreground line-clamp-1">{item.wardrobeItem.name}</div>
              <div className="text-base text-muted-foreground line-clamp-1">{item.wardrobeItem.brand}</div>
            </div>
          </div>
        );
      })}
      {/* Accessories row */}
      {accessories.length > 0 && (
        <div className="pt-6">
          <div className="text-lg font-bold mb-3 text-foreground">Accessories</div>
          <div className="flex gap-6 overflow-x-auto pt-2">
            {accessories.map(item => (
              <div key={item.id} className="flex flex-col items-center min-w-[100px]">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-background-soft border border-border shadow">
                  {item.wardrobeItem && item.wardrobeItem.images[0]?.url ? (
                    renderImage(item.wardrobeItem.images[0].url, item.wardrobeItem.name, 120)
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground line-clamp-1 text-center max-w-[100px]">{item.wardrobeItem?.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1 text-center max-w-[100px]">{item.wardrobeItem?.brand}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface OutfitDetailClientProps {
  initialOutfit: Outfit & { stats: { timesWorn: number } };
}

// Helper: category order for mannequin
const MANNEQUIN_CATEGORIES = [
  "headwear",
  "outerwear",
  "tops",
  "bottoms",
  "shoes"
];

export default function OutfitDetailClient({
  initialOutfit,
}: OutfitDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [outfit] = useState(initialOutfit);
  const [currency, setCurrency] = useState<Currency>("USD");
  const { toast, dismiss } = useToast();
  const outfitDisplayRef = useRef<HTMLDivElement>(null);
  const mannequinRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportMode, setExportMode] = useState(false);

  // Fetch user's profile currency
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setCurrency(data.currency || 'USD')
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [])

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

  // Download: use a hidden export block for perfect image
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setExportMode(true);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Let React re-render
    try {
      const node = mannequinRef.current;
      if (!node) throw new Error('Mannequin not found');
      // Wait for all <img> elements to load
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
        return new Promise<void>(res => {
          img.onload = img.onerror = () => res();
        });
      }));
      const dataUrl = await toPng(node, {
        backgroundColor: '#fff',
        cacheBust: true,
        pixelRatio: 2,
        width: 600, // match mannequin width
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      const filename = outfit.name.trim().replace(/\s+/g, "-").toLowerCase() || "outfit";
      link.download = `${filename}-fit.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not generate fit image.",
        variant: "destructive",
      });
    } finally {
      setExportMode(false);
      setIsDownloading(false);
    }
  }, [currency, outfit.name, toast]);

  const canEditOutfit = session?.user?.id === outfit.userId;

  const formattedDate = new Date(outfit.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categoryOrder = [
    "headwear",
    "outerwear",
    "tops",
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

  // Get the dominant currency for the outfit
  const outfitItems = outfit.items
    .map(item => item.wardrobeItem)
    .filter((item): item is ClothingItem => Boolean(item))
  const dominantCurrency = getDominantCurrency(outfitItems)

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,640px)_1fr] gap-x-12 gap-y-8">
          {/* LEFT: Header + Mannequin only */}
          <div className="flex flex-col">
            {/* Header/topline */}
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => router.back()}
                  className="p-2 -ml-2 mt-1 rounded-lg hover:bg-accent/20 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-display font-extrabold tracking-tight text-white mb-1">
                    {outfit.name}
                  </h1>
                  {outfit.description && (
                    <p className="text-foreground-soft mt-1 text-base">
                      {outfit.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-base text-foreground-soft">
                    {/* User avatar + name + date */}
                    <div className="flex items-center gap-2">
                      {outfit.user?.image ? (
                        <Image
                          src={outfit.user.image}
                          alt={outfit.user.name || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full object-cover border border-border shadow-sm"
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                      <span className="truncate max-w-[150px] font-semibold text-white">
                        {outfit.user?.name || "Anonymous"}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Mannequin block (with accessories) */}
            <div className="relative flex-1 flex flex-col justify-center items-center">
              <OutfitMannequin
                items={sortedOutfitItems}
                currency={currency}
                mannequinRef={mannequinRef}
                exportMode={exportMode}
              />
            </div>
          </div>
          {/* RIGHT: Action row, Meta card, Items grid */}
          <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
            {/* Action buttons row */}
            <div className="flex flex-row flex-wrap gap-3 items-center mb-2">
              <button
                onClick={handleShare}
                className="btn btn-ghost border-2 h-11 px-6 flex items-center gap-2 rounded-xl font-semibold text-base hover:bg-accent/10 transition"
                title="Copy share link"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {/* <button
                onClick={handleDownload}
                className="btn btn-ghost border-2 h-11 px-6 flex items-center gap-2 rounded-xl font-semibold text-base hover:bg-accent/10 transition"
                title="Download Fit Image"
                disabled={isDownloading}
              >
                <Download className="w-5 h-5" />
              </button> */}
              {canEditOutfit && (
                <>
                  <button
                    onClick={() => router.push(`/outfits/${outfit.id}/edit`)}
                    className="btn btn-primary h-11 px-6 flex items-center gap-2 rounded-xl font-semibold text-base hover:bg-accent transition"
                    title="Edit Outfit"
                  >
                    <Edit className="w-5 h-5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn text-red-500 border border-red-500 h-11 px-6 flex items-center gap-2 rounded-xl font-semibold text-base hover:bg-red-500/10 transition"
                    title="Delete Outfit"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
            {/* Meta card: total cost, tags, etc. */}
            <div className="bg-white/90 dark:bg-card/90 rounded-2xl border border-border shadow-lg p-6 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-base text-foreground-soft">Total Cost</div>
                  <div className="text-2xl font-bold text-accent">
                    <PriceDisplay
                      amount={outfit.totalCost}
                      currency={dominantCurrency}
                      userCurrency={currency}
                      showTooltip={true}
                    />
                  </div>
                </div>
              </div>
              {outfit.tags && outfit.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {outfit.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              {outfit.seasons.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {outfit.seasons.map((season) => (
                    <span
                      key={season.id}
                      className="px-3 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-sm font-medium capitalize"
                    >
                      {season.name}
                    </span>
                  ))}
                </div>
              )}
              {outfit.occasions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {outfit.occasions.map((occasion) => (
                    <span
                      key={occasion.id}
                      className="px-3 py-1 bg-accent-pink/10 text-accent-pink rounded-full text-sm font-medium capitalize"
                    >
                      {occasion.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Items grid/list (unchanged) */}
            <div
              ref={outfitDisplayRef}
              className="bg-white/90 dark:bg-card/90 rounded-2xl border border-border shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-4 text-foreground">Outfit Items</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {sortedOutfitItems.map((item) => (
                  <ItemDetails key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
