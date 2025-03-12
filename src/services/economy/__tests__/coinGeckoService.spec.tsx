import { axiosInstance } from '#libs'
import AxiosMockAdapter from 'axios-mock-adapter'

import { COINGECKO_SIMPLE_PRICE_URL, Coins, getCoinData } from '../coinGeckoService.js'

const mock = new AxiosMockAdapter(axiosInstance)

const coinId = Coins.Bitcoin

describe('coinGeckoService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should fetch coin data', async () => {
    mock.onGet(COINGECKO_SIMPLE_PRICE_URL).reply(200, {
      [coinId]: {
        usd: 50000,
        usd_24h_change: 0.5,
        last_updated_at: 1630675200,
      },
    })

    const coinData = await getCoinData(coinId)

    expect(coinData).toEqual({
      usd: 50000,
      usd_24h_change: 0.5,
      last_updated_at: 1630675200,
    })
  })

  it('should throw error on failed fetch', async () => {
    mock.onGet(COINGECKO_SIMPLE_PRICE_URL).reply(404)

    await expect(getCoinData(coinId)).rejects.toThrow('Request failed with status code 404')
  })

  it('should throw error on missing coin data', async () => {
    mock.onGet(COINGECKO_SIMPLE_PRICE_URL).reply(200, {})

    await expect(getCoinData(coinId)).rejects.toThrow('Failed to fetch coin data for bitcoin')
  })
})
