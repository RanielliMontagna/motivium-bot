import { axiosInstance } from '#libs'
import AxiosMockAdapter from 'axios-mock-adapter'

import { getDollarExchangeRate } from '../dollarExchangeService.js'
import { AWESOME_API_EXCHANGE_RATE_URL } from '../awesomeApiService.js'

const mock = new AxiosMockAdapter(axiosInstance)

const USDBRL = {
  code: 'USD',
  codein: 'BRL',
  name: 'Dólar Americano/Real Brasileiro',
  high: '5.25',
  low: '5.20',
  varBid: '0.01',
  pctChange: '0.19',
  bid: '5.22',
  ask: '5.23',
  timestamp: '1630675200',
  create_date: '2021-09-03 16:00:00',
}

describe('dollarExchangeService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should fetch dollar exchange rate', async () => {
    mock.onGet(`${AWESOME_API_EXCHANGE_RATE_URL}/USD-BRL`).reply(200, { USDBRL })

    const dollarExchangeRate = await getDollarExchangeRate()

    expect(dollarExchangeRate).toEqual(USDBRL)
  })

  it('should throw error on failed fetch', async () => {
    mock.onGet(`${AWESOME_API_EXCHANGE_RATE_URL}/USD-BRL`).reply(404)

    await expect(getDollarExchangeRate()).rejects.toThrow('Request failed with status code 404')
  })

  it('should throw error on missing dollar exchange rate', async () => {
    mock.onGet(`${AWESOME_API_EXCHANGE_RATE_URL}/USD-BRL`).reply(200, {})

    await expect(getDollarExchangeRate()).rejects.toThrow('Failed to fetch dollar exchange rate')
  })
})
