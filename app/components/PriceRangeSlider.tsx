'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'
import type { Currency } from '@/app/models/types'

interface PriceRangeSliderProps {
  minPrice: number
  maxPrice: number
  currency: Currency
  onChange: (range: { min: number; max: number }) => void
}

export default function PriceRangeSlider({
  minPrice,
  maxPrice,
  currency,
  onChange,
}: PriceRangeSliderProps) {
  const [range, setRange] = useState({ min: minPrice, max: maxPrice })
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)

  // Calculate percentage for slider positioning
  const getPercent = useCallback(
    (value: number) => {
      return Math.round(((value - minPrice) / (maxPrice - minPrice)) * 100)
    },
    [minPrice, maxPrice]
  )

  // Handle mouse/touch move
  const handleMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging) return

      const slider = document.getElementById('price-range-slider')
      if (!slider) return

      const rect = slider.getBoundingClientRect()
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
      const percent = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1)
      const value = Math.round(minPrice + percent * (maxPrice - minPrice))

      setRange(prev => {
        const newRange = isDragging === 'min' 
          ? { ...prev, min: Math.min(value, prev.max) }
          : { ...prev, max: Math.max(value, prev.min) }
        onChange(newRange)
        return newRange
      })
    },
    [isDragging, minPrice, maxPrice, onChange]
  )

  // Handle mouse/touch up
  const handleUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('touchmove', handleMove)
      window.addEventListener('mouseup', handleUp)
      window.addEventListener('touchend', handleUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDragging, handleMove, handleUp])

  return (
    <div className="w-full px-2 py-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm">{formatPrice(range.min, currency)}</span>
        <span className="text-sm">{formatPrice(range.max, currency)}</span>
      </div>
      
      <div
        id="price-range-slider"
        className="relative w-full h-2 bg-background rounded-full"
      >
        {/* Track fill */}
        <div
          className="absolute h-full bg-accent-purple rounded-full"
          style={{
            left: `${getPercent(range.min)}%`,
            width: `${getPercent(range.max) - getPercent(range.min)}%`,
          }}
        />

        {/* Min thumb */}
        <div
          className="absolute w-4 h-4 -mt-1.5 bg-white border-2 border-accent-purple rounded-full cursor-pointer"
          style={{ left: `${getPercent(range.min)}%` }}
          onMouseDown={() => setIsDragging('min')}
          onTouchStart={() => setIsDragging('min')}
        />

        {/* Max thumb */}
        <div
          className="absolute w-4 h-4 -mt-1.5 bg-white border-2 border-accent-purple rounded-full cursor-pointer"
          style={{ left: `${getPercent(range.max)}%` }}
          onMouseDown={() => setIsDragging('max')}
          onTouchStart={() => setIsDragging('max')}
        />
      </div>
    </div>
  )
} 