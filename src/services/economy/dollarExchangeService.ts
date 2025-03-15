import { axiosInstance } from '#libs'
import { AWESOME_API_EXCHANGE_RATE_URL } from './awesomeApiService.js'

export interface DollarExchangeRateResponse {
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

export async function getDollarExchangeRate(): Promise<DollarExchangeRateResponse> {
  try {
    const response = await axiosInstance.get(`${AWESOME_API_EXCHANGE_RATE_URL}/USD-BRL`)

    if (response.data.USDBRL) {
      return response.data.USDBRL
    }

    throw new Error('Failed to fetch dollar exchange rate')
  } catch (error) {
    console.error('Error fetching dollar exchange rate:', error)
    throw error
  }
}
