import type { Currency } from '@/app/models/types'

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

// Currency conversion rates (for demo purposes)
const CONVERSION_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  INR: 74.5,
  CAD: 1.25,
  AUD: 1.35,
}

export function convertCurrency(amount: number, from: Currency = 'USD', to: Currency = 'USD'): number {
  if (from === to) return amount
  const inUSD = amount / CONVERSION_RATES[from]
  return inUSD * CONVERSION_RATES[to]
}

export function formatPrice(amount: number, currency: Currency = 'USD'): string {
  return formatCurrency(amount, currency)
} 