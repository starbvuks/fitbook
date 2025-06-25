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
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,INR,CAD,AUD')
    const data = await response.json()

    if (!data.rates) {
      throw new Error('Invalid response from exchange rate API')
    }

    exchangeRates = {
      USD: 1,
      ...data.rates
    } as Record<Currency, number>
    
    lastFetchTime = now
    return exchangeRates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    // Fallback to approximate rates if API fails (rates as of March 2024, base USD)
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      INR: 83.2,
      CAD: 1.35,
      AUD: 1.52
    }
  }
}

export async function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number> {
  if (fromCurrency === toCurrency) return amount
  
  const rates = await getExchangeRates()
  const amountInUSD = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency]
  const finalAmount = toCurrency === 'USD' ? amountInUSD : amountInUSD * rates[toCurrency]
  
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
  const baseMaxUSD = 12000 // $12,000 USD as base max
  if (currency === 'USD') return baseMaxUSD
  
  const converted = await convertCurrency(baseMaxUSD, 'USD', currency)
  return Math.ceil(converted / 100) * 100
}

export function getDominantCurrency(items: Array<{ priceCurrency?: Currency }>): Currency {
  if (items.length === 0) return 'USD'
  
  const currencyCount: Record<Currency, number> = {
    USD: 0, EUR: 0, GBP: 0, JPY: 0, INR: 0, CAD: 0, AUD: 0
  }
  
  items.forEach(item => {
    const currency = item.priceCurrency || 'USD'
    currencyCount[currency]++
  })
  
  return Object.entries(currencyCount)
    .reduce((a, b) => currencyCount[a[0] as Currency] > currencyCount[b[0] as Currency] ? a : b)[0] as Currency
} 