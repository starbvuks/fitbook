'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/app/models/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PriceDisplayProps {
  amount: number
  currency: Currency
  userCurrency: Currency
  showOriginal?: boolean
  showTooltip?: boolean
  className?: string
}

export default function PriceDisplay({
  amount,
  currency,
  userCurrency,
  showOriginal = true,
  showTooltip = true,
  className = ""
}: PriceDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currency === userCurrency) {
      setConvertedAmount(amount)
      return
    }

    const convertPrice = async () => {
      setLoading(true)
      try {
        if (typeof amount !== 'number' || isNaN(amount)) {
          throw new Error('Invalid amount for currency conversion')
        }
        const response = await fetch('/api/currency/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            fromCurrency: currency,
            toCurrency: userCurrency
          })
        })

        if (!response.ok) {
          const errorBody = await response.text()
          console.error('Currency conversion failed:', errorBody)
          throw new Error('Failed to convert currency')
        }

        const data = await response.json()
        setConvertedAmount(data.amount)
      } catch (error) {
        console.error('Error converting currency:', error)
        setConvertedAmount(amount) // Fallback to original amount
      } finally {
        setLoading(false)
      }
    }

    convertPrice()
  }, [amount, currency, userCurrency])

  if (loading || convertedAmount === null) {
    return <span className={className}>...</span>
  }

  const displayAmount = convertedAmount
  const displayCurrency = userCurrency
  const originalDisplay = formatCurrency(amount, currency)
  const convertedDisplay = formatCurrency(displayAmount, displayCurrency)

  if (currency === userCurrency || !showTooltip) {
    return <span className={className}>{convertedDisplay}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-help`}>
            {convertedDisplay}
            {showOriginal && currency !== userCurrency && (
              <span className="text-xs text-muted-foreground ml-1">
                (~{originalDisplay})
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <div className="font-medium">{convertedDisplay}</div>
            <div className="text-xs text-muted-foreground">
              Originally {originalDisplay}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 