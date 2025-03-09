import { axiosInstance } from '#libs'

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

export const AWESOME_API_URL = 'https://economia.awesomeapi.com.br'
export const AWESOME_API_DOLLAR_EXCHANGE_URL = `${AWESOME_API_URL}/json/last/USD-BRL`

export async function getDollarExchangeRate(): Promise<DollarExchangeRateResponse> {
  try {
    const response = await axiosInstance.get(AWESOME_API_DOLLAR_EXCHANGE_URL)

    if (response.data.USDBRL) {
      return response.data.USDBRL
    }

    throw new Error('Failed to fetch dollar exchange rate')
  } catch (error) {
    console.error('Error fetching dollar exchange rate:', error)
    throw error
  }
}
