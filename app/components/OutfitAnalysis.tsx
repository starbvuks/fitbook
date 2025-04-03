'use client'

import { useEffect, useState } from 'react'
import type { ClothingItem } from '../models/types'
import ColorPalette from './ColorPalette'
import { Sparkles } from 'lucide-react'

interface Analysis {
  totalCost: number
  colorAnalysis: {
    primaryColors: { hex: string; prevalence: number }[]
    complementaryColors: { hex: string; prevalence: number }[]
    colorHarmony: 'complementary' | 'analogous' | 'triadic' | 'monochromatic' | 'mixed'
    mood: string
  }
  categories: {
    category: string
    count: number
  }[]
  style: {
    formality: 'casual' | 'smart casual' | 'business casual' | 'formal'
    seasonality: string[]
    occasions: string[]
  }
}

interface OutfitAnalysisProps {
  items: ClothingItem[]
}

export default function OutfitAnalysis({ items }: OutfitAnalysisProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    if (items.length === 0) {
      setAnalysis(null)
      return
    }

    // Calculate total cost
    const totalCost = items.reduce((sum: number, item) => sum + item.price, 0)

    // Analyze colors
    const allColors = items.flatMap(item => 
      item.images.flatMap(image => 
        image.colors?.map(color => ({
          hex: color.hex,
          prevalence: color.prevalence || 1
        })) || []
      )
    )

    // Group colors by similarity and calculate prevalence
    const groupedColors = allColors.reduce((groups: { hex: string; prevalence: number }[], color) => {
      const similarColor = groups.find(group => 
        isColorSimilar(group.hex, color.hex)
      )
      if (similarColor) {
        similarColor.prevalence += color.prevalence
      } else {
        groups.push({ ...color })
      }
      return groups
    }, [] as { hex: string; prevalence: number }[])

    // Sort by prevalence
    const sortedColors = groupedColors.sort((a, b) => b.prevalence - a.prevalence)

    // Determine color harmony
    const colorHarmony = analyzeColorHarmony(sortedColors.map(c => c.hex))

    // Analyze style
    const style = analyzeStyle(items)

    // Count items per category
    const categoryCount = items.reduce((acc: Record<string, number>, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    setAnalysis({
      totalCost,
      colorAnalysis: {
        primaryColors: sortedColors.slice(0, 3),
        complementaryColors: sortedColors.slice(3),
        colorHarmony,
        mood: determineMood(colorHarmony, style.formality)
      },
      categories: Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count,
      })),
      style,
    })
  }, [items])

  if (!analysis) {
    return null
  }

  return (
    <div className="bg-background rounded-lg border border-border p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Outfit Analysis</h2>
        <Sparkles className="w-5 h-5 text-accent-purple" />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Total Cost</h3>
        <p className="text-2xl font-bold text-accent-purple">
          ${analysis.totalCost.toFixed(2)}
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Color Palette</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm text-foreground-soft mb-2">Primary Colors</h4>
            <ColorPalette colors={analysis.colorAnalysis.primaryColors} readonly />
          </div>
          {analysis.colorAnalysis.complementaryColors.length > 0 && (
            <div>
              <h4 className="text-sm text-foreground-soft mb-2">Accent Colors</h4>
              <ColorPalette colors={analysis.colorAnalysis.complementaryColors} readonly />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-foreground-soft">Harmony: </span>
              <span className="capitalize">{analysis.colorAnalysis.colorHarmony}</span>
            </p>
            <p className="text-sm">
              <span className="text-foreground-soft">Mood: </span>
              {analysis.colorAnalysis.mood}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Style Analysis</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm text-foreground-soft mb-2">Formality</h4>
            <p className="capitalize">{analysis.style.formality}</p>
          </div>
          <div>
            <h4 className="text-sm text-foreground-soft mb-2">Best For</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.style.occasions.map(occasion => (
                <span
                  key={occasion}
                  className="px-2 py-1 bg-background-soft rounded-full text-sm"
                >
                  {occasion}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm text-foreground-soft mb-2">Seasons</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.style.seasonality.map(season => (
                <span
                  key={season}
                  className="px-2 py-1 bg-background-soft rounded-full text-sm"
                >
                  {season}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Items Breakdown</h3>
        <div className="space-y-2">
          {analysis.categories.map(({ category, count }) => (
            <div
              key={category}
              className="flex justify-between items-center text-sm"
            >
              <span className="capitalize">{category}</span>
              <span className="text-foreground-soft">{count} items</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper functions for color analysis
function isColorSimilar(color1: string, color2: string): boolean {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return false

  const threshold = 30 // Adjust this value to control similarity sensitivity
  return (
    Math.abs(rgb1.r - rgb2.r) <= threshold &&
    Math.abs(rgb1.g - rgb2.g) <= threshold &&
    Math.abs(rgb1.b - rgb2.b) <= threshold
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function analyzeColorHarmony(colors: string[]): Analysis['colorAnalysis']['colorHarmony'] {
  if (colors.length <= 1) return 'monochromatic'
  
  const hslColors = colors.map(hexToHsl)
  
  // Check if colors are analogous (adjacent on color wheel)
  const isAnalogous = hslColors.every((hsl, i) => {
    if (i === 0) return true
    const hueDiff = Math.abs(hsl.h - hslColors[i - 1].h)
    return hueDiff <= 30 || hueDiff >= 330
  })
  if (isAnalogous) return 'analogous'
  
  // Check if colors are complementary (opposite on color wheel)
  const isComplementary = hslColors.some((hsl1, i) =>
    hslColors.some((hsl2, j) => {
      if (i === j) return false
      const hueDiff = Math.abs(hsl1.h - hsl2.h)
      return Math.abs(hueDiff - 180) <= 30
    })
  )
  if (isComplementary) return 'complementary'
  
  // Check if colors form a triadic relationship (120° apart)
  const isTriadic = hslColors.length >= 3 && hslColors.some((hsl1, i) =>
    hslColors.some((hsl2, j) =>
      hslColors.some((hsl3, k) => {
        if (i === j || j === k || i === k) return false
        const diff1 = Math.abs(hsl1.h - hsl2.h)
        const diff2 = Math.abs(hsl2.h - hsl3.h)
        const diff3 = Math.abs(hsl3.h - hsl1.h)
        return (
          Math.abs(diff1 - 120) <= 30 &&
          Math.abs(diff2 - 120) <= 30 &&
          Math.abs(diff3 - 120) <= 30
        )
      })
    )
  )
  if (isTriadic) return 'triadic'
  
  return 'mixed'
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex)
  if (!rgb) return { h: 0, s: 0, l: 0 }
  
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h *= 60
  }
  
  return { h, s, l }
}

function analyzeStyle(items: ClothingItem[]): Analysis['style'] {
  // Determine formality based on item categories and tags
  const formalityScore = items.reduce((score: number, item) => {
    if (item.tags.some(tag => ['formal', 'business', 'suit'].includes(tag.name))) {
      return score + 3
    }
    if (item.tags.some(tag => ['smart', 'business casual'].includes(tag.name))) {
      return score + 2
    }
    if (item.tags.some(tag => ['casual', 'sporty'].includes(tag.name))) {
      return score + 1
    }
    return score + 1.5 // Default to smart casual
  }, 0) / items.length

  let formality: Analysis['style']['formality']
  if (formalityScore >= 2.5) formality = 'formal'
  else if (formalityScore >= 2) formality = 'business casual'
  else if (formalityScore >= 1.5) formality = 'smart casual'
  else formality = 'casual'

  // Determine seasonality
  const seasons = new Set<string>()
  items.forEach(item => {
    item.seasons.forEach(season => seasons.add(season.name))
  })

  // Determine occasions
  const occasions = new Set<string>()
  items.forEach(item => {
    item.occasions.forEach(occasion => occasions.add(occasion.name))
  })

  return {
    formality,
    seasonality: Array.from(seasons),
    occasions: Array.from(occasions),
  }
}

function determineMood(
  harmony: Analysis['colorAnalysis']['colorHarmony'],
  formality: Analysis['style']['formality']
): string {
  switch (harmony) {
    case 'monochromatic':
      return formality === 'formal' ? 'Sophisticated & Elegant' : 'Clean & Minimal'
    case 'analogous':
      return formality === 'formal' ? 'Refined & Coordinated' : 'Harmonious & Balanced'
    case 'complementary':
      return formality === 'formal' ? 'Bold & Striking' : 'Dynamic & Energetic'
    case 'triadic':
      return formality === 'formal' ? 'Creative & Distinctive' : 'Playful & Expressive'
    default:
      return formality === 'formal' ? 'Eclectic & Sophisticated' : 'Versatile & Contemporary'
  }
} 