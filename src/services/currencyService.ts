import axios from 'axios'
import dayjs from 'dayjs'

import 'dayjs/locale/pt-br.js'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.locale('pt-br')
dayjs.extend(utc)
dayjs.extend(timezone)

export async function getDollarExchangeRate(): Promise<number> {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
    return response.data.rates.BRL
  } catch (error) {
    console.error('Error fetching dollar exchange rate:', error)
    throw new Error('Failed to fetch dollar exchange rate')
  }
}
