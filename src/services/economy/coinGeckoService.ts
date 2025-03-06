import axios from 'axios'

export interface CoinGeckoCoin {
  usd: number
  usd_24h_change: number
  last_updated_at: number
}

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export const getCoinData = async (coinId: string): Promise<CoinGeckoCoin> => {
  try {
    const response = (await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: 'usd',
        precision: 2,
        include_24hr_change: true,
      },
    })) as { data: Record<string, CoinGeckoCoin> }

    const coinData = response.data[coinId] as CoinGeckoCoin

    if (coinData) {
      return coinData
    }

    throw new Error(`Failed to fetch coin data for ${coinId}`)
  } catch (error) {
    console.error('Error fetching coin data:', error)
    throw error
  }
}
