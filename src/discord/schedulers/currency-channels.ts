import dayjs from 'dayjs'
import cron from 'node-cron'
import { Client } from 'discord.js'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { getDollarExchangeRate } from '#services'

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Initializes the scheduler for currency channels
 * @param client Discord client
 */
export async function initializeCurrencyChannelsScheduler(client: Client) {
  const currencyChannelsIds = process.env.CURRENCY_CHANNELS_IDS?.split(',')

  if (!currencyChannelsIds?.length) {
    logger.warn('No currency channels configured')
    return
  }

  currencyChannelsIds.forEach((id) => {
    const channel = client.channels.cache.get(id)

    if (!channel) {
      logger.warn(`Channel with ID ${id} not found`)
      return
    }

    if (channel.isTextBased()) {
      cron.schedule('0 9-18 * * 1-5', async () => scheduleDollarExchangeRateMessage(client, id), {
        timezone: 'America/Sao_Paulo',
      })
    } else {
      logger.warn(`Channel with ID ${id} is not text-based`)
    }
  })
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
      const isFirstHour = now.endsWith('09:00')
      const isLastHour = now.endsWith('18:00')

      const firstLine = `📅 ${capitalizedNow}`
      const secondLine = `**💵 Cotação do Dólar 💵**`

      let thirdLine = `O valor do dólar no momento é: **R$ ${rate.toFixed(2)}**`
      if (isFirstHour) {
        thirdLine = `O mercado financeiro abriu e o valor do dólar é: **R$ ${rate.toFixed(2)}**`
      }
      if (isLastHour) {
        thirdLine = `O mercado financeiro fechou e o valor do dólar é: **R$ ${rate.toFixed(2)}**`
      }

      const fourthLine = `-# 📈 Fonte: [ExchangeRate](<https://exchangerate-api.com>)`

      return `${firstLine}\n\n${secondLine}\n${thirdLine}\n\n${fourthLine}`
    },
  })
}
