'use client'

import { useState, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { convertCurrency, formatCurrency, getCurrencyInfo } from '@/lib/currency'
import type { Currency } from '@/app/models/types'
import { Info } from 'lucide-react'

interface PriceDisplayProps {
  amount: number
  currency: Currency
  userCurrency: Currency
  className?: string
  showOriginal?: boolean
  showTooltip?: boolean
}

export default function PriceDisplay({
  amount,
  currency,
  userCurrency,
  className = '',
  showOriginal = true,
  showTooltip = true
}: PriceDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function convert() {
      if (currency === userCurrency) {
        setConvertedAmount(amount)
        return
      }

      setIsLoading(true)
      try {
        const converted = await convertCurrency(amount, currency, userCurrency)
        setConvertedAmount(converted)
      } catch (error) {
        console.error('Error converting currency:', error)
        setConvertedAmount(null)
      } finally {
        setIsLoading(false)
      }
    }

    convert()
  }, [amount, currency, userCurrency])

  const formattedOriginal = formatCurrency(amount, currency)
  const formattedConverted = convertedAmount !== null ? formatCurrency(convertedAmount, userCurrency) : null

  const originalInfo = getCurrencyInfo(currency)
  const userCurrencyInfo = getCurrencyInfo(userCurrency)

  if (isLoading) {
    return <span className={`${className} animate-pulse`}>{formattedOriginal}</span>
  }

  if (currency === userCurrency) {
    return <span className={className}>{formattedOriginal}</span>
  }

  return (
    <div className={`${className} flex items-center gap-1.5`}>
      {showOriginal ? (
        <span className="text-muted-foreground">{formattedOriginal}</span>
      ) : null}
      
      {convertedAmount !== null && currency !== userCurrency && (
        <>
          {showOriginal && <span className="text-muted-foreground">≈</span>}
          <span>{formattedConverted}</span>
          
          {showTooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Original price: {formattedOriginal} ({originalInfo.name})<br />
                    Converted to: {formattedConverted} ({userCurrencyInfo.name})<br />
                    <span className="text-muted-foreground">Exchange rates are updated hourly</span>
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      )}
    </div>
  )
} 