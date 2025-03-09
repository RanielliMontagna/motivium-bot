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

export async function getDollarExchangeRate(): Promise<DollarExchangeRateResponse> {
  try {
    const response = await axiosInstance.get('https://economia.awesomeapi.com.br/json/last/USD-BRL')

    if (response.data.USDBRL) {
      return response.data.USDBRL
    }

    throw new Error('Failed to fetch dollar exchange rate')
  } catch (error) {
    console.error('Error fetching dollar exchange rate:', error)
    throw new Error('Failed to fetch dollar exchange rate')
  }
}
