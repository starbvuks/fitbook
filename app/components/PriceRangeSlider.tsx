'use client'

import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import type { Currency } from '@/app/models/types'

interface PriceRangeSliderProps {
  minPrice: number
  maxPrice: number
  currency: Currency
  onChange: (range: { min: number; max: number | null }) => void
}

export default function PriceRangeSlider({
  minPrice,
  maxPrice,
  currency,
  onChange,
}: PriceRangeSliderProps) {
  const [range, setRange] = useState<{ min: number; max: number }>({
    min: minPrice,
    max: maxPrice,
  })
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)

  // Calculate the percentage for slider position
  const getPercentage = (value: number) => {
    return ((value - minPrice) / (maxPrice - minPrice)) * 100
  }

  // Format the slider track style
  const trackStyle = {
    left: `${getPercentage(range.min)}%`,
    width: `${getPercentage(range.max) - getPercentage(range.min)}%`,
  }

  // Handle slider thumb movement
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const slider = document.getElementById('price-range-slider')
    if (!slider) return

    const rect = slider.getBoundingClientRect()
    const percentage = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    const value = Math.round(minPrice + percentage * (maxPrice - minPrice))

    setRange(prev => ({
      ...prev,
      [isDragging]: value,
    }))
  }

  // Handle slider thumb release
  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(null)
    onChange(range)
  }

  // Add and remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span>Price Range:</span>
        <span>
          {formatPrice(range.min, currency)} - {formatPrice(range.max, currency)}
        </span>
      </div>

      <div
        id="price-range-slider"
        className="relative h-2 bg-background-soft rounded-full"
      >
        {/* Slider track */}
        <div
          className="absolute h-full bg-accent-purple rounded-full"
          style={trackStyle}
        />

        {/* Min thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-white border-2 border-accent-purple rounded-full cursor-pointer ${
            isDragging === 'min' ? 'ring-2 ring-accent-purple ring-opacity-50' : ''
          }`}
          style={{ left: `${getPercentage(range.min)}%` }}
          onMouseDown={() => setIsDragging('min')}
        />

        {/* Max thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-white border-2 border-accent-purple rounded-full cursor-pointer ${
            isDragging === 'max' ? 'ring-2 ring-accent-purple ring-opacity-50' : ''
          }`}
          style={{ left: `${getPercentage(range.max)}%` }}
          onMouseDown={() => setIsDragging('max')}
        />
      </div>
    </div>
  )
} 