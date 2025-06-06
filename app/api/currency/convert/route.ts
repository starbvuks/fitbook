import { NextRequest, NextResponse } from 'next/server'
import { convertCurrency } from '@/lib/currency'
import type { Currency } from '@/app/models/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, fromCurrency, toCurrency } = body

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, fromCurrency, toCurrency' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    const validCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD']
    if (!validCurrencies.includes(fromCurrency) || !validCurrencies.includes(toCurrency)) {
      return NextResponse.json(
        { error: 'Invalid currency code' },
        { status: 400 }
      )
    }

    const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency)

    return NextResponse.json({
      amount: convertedAmount,
      fromCurrency,
      toCurrency,
      originalAmount: amount
    })
  } catch (error) {
    console.error('Currency conversion error:', error)
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    )
  }
} 