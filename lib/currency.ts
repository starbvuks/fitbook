import type { Currency } from '@/app/models/types'

export const currencyMap: Record<Currency, { symbol: string, name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' }
}

interface ExchangeRate {
  from: Currency
  to: Currency
  rate: number
  timestamp: Date
}

class CurrencyService {
  private static instance: CurrencyService
  private cache: Map<string, ExchangeRate>
  private CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

  private constructor() {
    this.cache = new Map()
  }

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService()
    }
    return CurrencyService.instance
  }

  private getCacheKey(from: Currency, to: Currency): string {
    return `${from}-${to}`
  }

  private isRateValid(rate: ExchangeRate): boolean {
    return Date.now() - rate.timestamp.getTime() < this.CACHE_DURATION
  }

  private async fetchExchangeRates(baseCurrency: Currency): Promise<Record<Currency, number>> {
    try {
      const currencies = Object.keys(currencyMap).filter(c => c !== baseCurrency).join(',')
      const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}&to=${currencies}`)
      const data = await response.json()

      if (!data.rates) {
        throw new Error('Invalid response from exchange rate API')
      }

      return {
        [baseCurrency]: 1,
        ...data.rates
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      // Fallback rates (as of March 2024)
      const fallbackRates: Record<string, Record<string, number>> = {
        INR: {
          USD: 0.012,
          EUR: 0.011,
          GBP: 0.0095,
          JPY: 1.79,
          INR: 1,
          CAD: 0.016,
          AUD: 0.018
        }
        // Add other base currencies if needed
      }
      return fallbackRates[baseCurrency] || { [baseCurrency]: 1 }
    }
  }

  public async getExchangeRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) return 1

    const cacheKey = this.getCacheKey(from, to)
    const cached = this.cache.get(cacheKey)

    if (cached && this.isRateValid(cached)) {
      return cached.rate
    }

    const rates = await this.fetchExchangeRates(from)
    const rate = rates[to]

    this.cache.set(cacheKey, {
      from,
      to,
      rate,
      timestamp: new Date()
    })

    return rate
  }

  public async convertAmount(amount: number, from: Currency, to: Currency): Promise<number> {
    if (from === to) return amount

    const rate = await this.getExchangeRate(from, to)
    const converted = amount * rate

    // Round to 2 decimal places
    return Math.round(converted * 100) / 100
  }

  public formatAmount(amount: number, currency: Currency): string {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    return formatter.format(amount)
  }

  public async getMaxPrice(currency: Currency): Promise<number> {
    const baseMaxINR = 1000000 // 10 Lakh INR as base max
    if (currency === 'INR') return baseMaxINR
    
    const converted = await this.convertAmount(baseMaxINR, 'INR', currency)
    return Math.ceil(converted / 100) * 100
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance()

// Convenience functions that use the service
export async function convertCurrency(amount: number, from: Currency, to: Currency): Promise<number> {
  return currencyService.convertAmount(amount, from, to)
}

export function formatCurrency(amount: number, currency: Currency): string {
  return currencyService.formatAmount(amount, currency)
}

export async function getMaxPriceForCurrency(currency: Currency): Promise<number> {
  return currencyService.getMaxPrice(currency)
}

// Helper to get currency display info
export function getCurrencyInfo(currency: Currency) {
  return currencyMap[currency]
} 