'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullscreen?: boolean
  text?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  fullscreen = false,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
  }

  const spinner = (
    <div className={`
      animate-spin rounded-full
      border-accent-purple border-t-transparent
      ${sizeClasses[size]}
    `} />
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
        {spinner}
        {text && (
          <p className="mt-4 text-foreground-soft animate-pulse">{text}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {spinner}
      {text && (
        <p className="mt-2 text-sm text-foreground-soft">{text}</p>
      )}
    </div>
  )
} 