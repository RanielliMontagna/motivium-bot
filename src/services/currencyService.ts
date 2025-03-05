import axios from 'axios'

export async function getDollarExchangeRate(): Promise<number> {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
    return response.data.rates.BRL
  } catch (error) {
    console.error('Error fetching dollar exchange rate:', error)
    throw new Error('Failed to fetch dollar exchange rate')
  }
}
