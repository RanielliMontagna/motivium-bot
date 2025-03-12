import { axiosInstance } from '#libs'

export interface CoinGeckoCoin {
  usd: number
  usd_24h_change: number
  last_updated_at: number
}

export enum Coins {
  Bitcoin = 'bitcoin',
  Ethereum = 'ethereum',
  BinanceCoin = 'binancecoin',
  Cardano = 'cardano',
  Dogecoin = 'dogecoin',
}

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
export const COINGECKO_SIMPLE_PRICE_URL = `${COINGECKO_API_URL}/simple/price`

export const getCoinData = async (coinId: Coins): Promise<CoinGeckoCoin> => {
  try {
    const response = (await axiosInstance.get(COINGECKO_SIMPLE_PRICE_URL, {
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
