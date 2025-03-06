import axios from 'axios'
import dayjs from 'dayjs'

import 'dayjs/locale/pt-br.js'

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.locale('pt-br')
dayjs.extend(utc)
dayjs.extend(timezone)

import { Client } from 'discord.js'
import { sendMessage } from '#utils'

export async function getDollarExchangeRate(): Promise<number> {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
    return response.data.rates.BRL
  } catch (error) {
    console.error('Error fetching dollar exchange rate:', error)
    throw new Error('Failed to fetch dollar exchange rate')
  }
}

export function scheduleDollarExchangeRateMessage(client: Client, channelId: string): void {
  sendMessage({
    client,
    channelId,
    message: async () => {
      const rate = await getDollarExchangeRate()
      const now = dayjs()
        .tz('America/Sao_Paulo')
        .format('dddd, [dia] D [de] MMMM [de] YYYY [às] HH:mm')
      const capitalizedNow = now.charAt(0).toUpperCase() + now.slice(1)

      const firstLine = `📅 ${capitalizedNow}`
      const secondLine = `**💵 Cotação do Dólar 💵**`
      const thirdLine = `O valor do dólar no momento é: **R$ ${rate.toFixed(2)}**`
      const fourthLine = `-# 📈 Fonte: [ExchangeRate](<https://exchangerate-api.com>)`

      return `${firstLine}\n\n${secondLine}\n${thirdLine}\n\n${fourthLine}`
    },
  })
}
