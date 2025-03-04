import axios from 'axios'
import dayjs from 'dayjs'

import { Client } from 'discord.js'
import { scheduleMessage } from '#utils'

export async function getDollarExchangeRate(): Promise<number> {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
    return response.data.rates.BRL
  } catch (error) {
    console.error('Error fetching dollar exchange rate:', error)
    throw new Error('Failed to fetch dollar exchange rate')
  }
}

export function scheduleDollarExchangeRateMessage(
  client: Client,
  channelId: string,
  cronExpression: string,
): void {
  scheduleMessage({
    client,
    channelId,
    cronExpression,
    message: async () => {
      const rate = await getDollarExchangeRate()
      const now = dayjs().format('dddd, [dia] D [de] MMMM [de] YYYY [às] HH:mm')
      const capitalizedNow = now.charAt(0).toUpperCase() + now.slice(1)

      const firstLine = `📅 ${capitalizedNow}`
      const secondLine = `**💵 Cotação do Dólar 💵**`
      const thirdLine = `O valor do dólar no momento é: **R$ ${rate.toFixed(2)}**`
      const fourthLine = `-# 📈 Fonte: [ExchangeRate](<https://exchangerate-api.com>)`

      return `${firstLine}\n\n${secondLine}\n${thirdLine}\n\n${fourthLine}`
    },
  })
}
