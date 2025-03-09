import type { Currency } from '@/app/models/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function formatPrice(amount: number, currency: Currency = 'USD'): string {
  return formatCurrency(amount, currency);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
