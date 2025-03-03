import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { ClothingItem, Currency } from '@/app/models/types'
import { formatPrice } from '@/lib/utils'

interface ItemCardProps {
  item: ClothingItem
  currency: Currency
}

export default function ItemCard({ item, currency }: ItemCardProps) {
  return (
    <Link
      href={`/catalog/${item.id}`}
      className="group relative bg-background rounded-lg border border-border overflow-hidden hover:border-accent-purple transition-colors"
    >
      <div className="relative aspect-square">
        {item.images[0] ? (
          <Image
            src={item.images[0].url}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-background-soft flex items-center justify-center text-foreground-soft">
            No Image
          </div>
        )}
        {item.purchaseUrl && (
          <a
            href={item.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full hover:bg-background transition-colors"
            title="Purchase Link"
          >
            <ExternalLink className="w-4 h-4 text-foreground-soft hover:text-accent-purple" />
          </a>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium mb-1 group-hover:text-accent-purple transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center justify-between text-sm text-foreground-soft">
          <span className="capitalize">{item.category}</span>
          <span>{formatPrice(item.price, currency)}</span>
        </div>
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="px-2 py-1 text-xs bg-background-soft rounded-full text-foreground-soft">
                +{item.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
} 