import { axiosInstance } from '#libs'
import NodeCache from 'node-cache'

export const AWESOME_API_URL = 'https://economia.awesomeapi.com.br'

export const AWESOME_API_AVAILABLE_COTATIONS_URL = `${AWESOME_API_URL}/json/available`
export const AWESOME_API_EXCHANGE_RATE_URL = `${AWESOME_API_URL}/json/last`

const cache = new NodeCache({ stdTTL: 3600 }) // 1 hour cache

export async function getAvailableCotations(): Promise<string[]> {
  try {
    const response = await axiosInstance.get(AWESOME_API_AVAILABLE_COTATIONS_URL)

    if (response.data) {
      cache.set('availableCotations', response.data)
      return response.data
    }

    throw new Error('Failed to fetch available cotations')
  } catch (error) {
    console.error('Error fetching available cotations:', error)
    throw error
  }
}

export function getCachedAvailableCotations(): string[] {
  return cache.get('availableCotations') as string[]
}

export interface ExchangeRateResponse {
  code: string
  codein: string
  name: string
  high: string
  low: string
  varBid: string
  pctChange: string
  bid: string
  ask: string
  timestamp: string
  create_date: string
}

type ExchangeRate = {
  [key: string]: ExchangeRateResponse

  [Symbol.iterator](): IterableIterator<[string, ExchangeRateResponse]>
}

export async function getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
  try {
    const response = await axiosInstance.get(`${AWESOME_API_EXCHANGE_RATE_URL}/${from}-${to}`)

    if (response.data) {
      return response.data as ExchangeRate
    }

    throw new Error('Failed to fetch exchange rate')
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    throw error
  }
}
