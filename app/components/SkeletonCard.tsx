import { cn } from '@/lib/utils'

type ViewMode = 'large' | 'small' | 'stack'

interface SkeletonCardProps {
  viewMode: ViewMode
  className?: string
}

export default function SkeletonCard({ viewMode, className }: SkeletonCardProps) {
  const isStack = viewMode === 'stack'

  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border shadow-soft animate-pulse',
        isStack ? 'flex space-x-4 p-3' : 'overflow-hidden',
        className
      )}
    >
      {/* Image Placeholder */}
      <div
        className={cn(
          'bg-neutral-800/50', // Slightly darker pulse color
          isStack ? 'w-20 h-20 rounded-md flex-shrink-0' : 'aspect-square w-full'
        )}
      />
      {/* Text Placeholders */}
      <div className={cn('flex-1', isStack ? 'space-y-2 py-1' : 'p-3 space-y-2')}>
        <div className="h-4 bg-neutral-800/50 rounded w-3/4"></div>
        <div className="h-3 bg-neutral-800/50 rounded w-1/2"></div>
        {!isStack && (
          <div className="flex justify-between items-center pt-1">
            <div className="h-3 bg-neutral-800/50 rounded w-1/4"></div>
            <div className="h-6 w-6 bg-neutral-800/50 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  )
} 