'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface ColorPaletteProps {
  colors: { hex: string; prevalence: number }[]
  readonly?: boolean
  onColorSelect?: (color: { hex: string; prevalence: number }) => void
}

export default function ColorPalette({
  colors,
  readonly = false,
  onColorSelect,
}: ColorPaletteProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const handleColorClick = (color: { hex: string; prevalence: number }) => {
    if (readonly) {
      navigator.clipboard.writeText(color.hex)
      setCopiedColor(color.hex)
      setTimeout(() => setCopiedColor(null), 2000)
    } else if (onColorSelect) {
      onColorSelect(color)
    }
  }

  // Sort colors by prevalence
  const sortedColors = [...colors].sort((a, b) => b.prevalence - a.prevalence)

  return (
    <div className="space-y-4">
      {/* Color Grid */}
      <div className="grid grid-cols-6 gap-2">
        {sortedColors.map((color) => {
          const isLight = isLightColor(color.hex)
          const isCopied = copiedColor === color.hex
          
          return (
            <button
              key={color.hex}
              onClick={() => handleColorClick(color)}
              className={`
                relative group aspect-square rounded-lg overflow-hidden
                transition-transform hover:scale-105 hover:shadow-lg
                ${!readonly && 'hover:ring-2 hover:ring-accent-purple'}
              `}
              style={{ backgroundColor: color.hex }}
              title={`${color.hex} (${Math.round(color.prevalence * 100)}%)`}
            >
              <div
                className={`
                  absolute inset-0 flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity
                  ${isLight ? 'text-gray-800' : 'text-white'}
                  ${readonly ? 'bg-black/10' : 'bg-black/20'}
                `}
              >
                {readonly && (
                  isCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Color Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {sortedColors.map((color) => (
          <div
            key={color.hex}
            className="flex items-center justify-between p-2 bg-background-soft rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color.hex }}
              />
              <span className="font-mono text-xs">{color.hex}</span>
            </div>
            <span className="text-foreground-soft">
              {Math.round(color.prevalence * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function isLightColor(hex: string): boolean {
  const rgb = parseInt(hex.slice(1), 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5
} 