import type { Currency } from '@/app/models/types'

export const currencyMap: Record<Currency, { symbol: string }> = {
  USD: { symbol: '$' },
  EUR: { symbol: '€' },
  GBP: { symbol: '£' },
  JPY: { symbol: '¥' },
  INR: { symbol: '₹' },
  CAD: { symbol: '$' },
  AUD: { symbol: '$' }
}

let exchangeRates: Record<Currency, number> | null = null
let lastFetchTime = 0
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

async function getExchangeRates(): Promise<Record<Currency, number>> {
  const now = Date.now()
  
  if (exchangeRates && (now - lastFetchTime) < CACHE_DURATION) {
    return exchangeRates
  }

  try {
    // Using frankfurter API - completely free, no key needed
    const response = await fetch('https://api.frankfurter.app/latest?from=INR&to=USD,EUR,GBP,JPY,CAD,AUD')
    const data = await response.json()

    if (!data.rates) {
      throw new Error('Invalid response from exchange rate API')
    }

    exchangeRates = {
      INR: 1,
      ...data.rates
    } as Record<Currency, number>
    
    lastFetchTime = now
    return exchangeRates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    // Fallback to approximate rates if API fails (rates as of March 2024, base INR)
    return {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      JPY: 1.79,
      INR: 1,
      CAD: 0.016,
      AUD: 0.018
    }
  }
}

export async function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number> {
  if (fromCurrency === toCurrency) return amount
  
  const rates = await getExchangeRates()
  const amountInINR = fromCurrency === 'INR' ? amount : amount / rates[fromCurrency]
  const finalAmount = toCurrency === 'INR' ? amountInINR : amountInINR * rates[toCurrency]
  
  return Math.round(finalAmount * 100) / 100 // Round to 2 decimal places
}

export function formatCurrency(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

export async function getMaxPriceForCurrency(currency: Currency): Promise<number> {
  const baseMaxINR = 1000000 // 10 Lakh INR as base max
  if (currency === 'INR') return baseMaxINR
  
  const converted = await convertCurrency(baseMaxINR, 'INR', currency)
  return Math.ceil(converted / 100) * 100
} 