import dayjs from 'dayjs'
import cron from 'node-cron'
import { Client } from 'discord.js'

import { logger } from '#settings'
import { DollarExchangeRateResponse, getDollarExchangeRate } from '#services'

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import { sendMessage } from '#utils'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Initializes the scheduler for currency channels
 * @param client Discord client
 */
export async function initializeCurrencyChannelsScheduler(client: Client) {
  cron.schedule('*/5 * * * * *', async () => {
    scheduleDollarExchangeRateMessage(client)
  })

  cron.schedule('0 9-18 * * 1-5', async () => scheduleDollarExchangeRateMessage(client), {
    timezone: 'America/Sao_Paulo',
  })
}

export async function scheduleDollarExchangeRateMessage(client: Client): Promise<void> {
  const currencyChannelsIds = process.env.CURRENCY_CHANNELS_IDS?.split(',')

  if (!currencyChannelsIds?.length) {
    logger.warn('No currency channels IDs found')
    return
  }

  const data = await getDollarExchangeRate()

  await Promise.all(
    currencyChannelsIds.map(async (channelId) => {
      formatDollarMessage(data, channelId)

      await sendMessage({
        client,
        channelId,
        message: formatDollarMessage(data, channelId),
      })
    }),
  )
}

function formatDollarMessage(data: DollarExchangeRateResponse, channelId: string): string {
  const now = dayjs().tz('America/Sao_Paulo').format('dddd, [dia] D [de] MMMM [de] YYYY [às] HH:mm')
  const isFirstHour = dayjs().tz('America/Sao_Paulo').hour() === 9
  const isLastHour = dayjs().tz('America/Sao_Paulo').hour() === 18

  const capitalizedNow = `-# ${now.charAt(0).toUpperCase() + now.slice(1)}`
  const title = '💵 **Cotação do Dólar** 💵'

  const bidFormatted = parseFloat(data.bid).toFixed(2).replace('.', ',')

  let description = `O valor do dólar no momento é: **R$ ${bidFormatted}**`
  if (isFirstHour) description = `O mercado abriu com o dólar valendo: **R$ ${bidFormatted}**`
  if (isLastHour) description = `O mercado fechou com o dólar valendo: **R$ ${bidFormatted}**`

  const dayVariation = parseFloat(data.pctChange)
  const variation =
    dayVariation > 0 ? `📈 **${dayVariation.toFixed(2)}%**` : `📉 **${dayVariation.toFixed(2)}%**`
  const variationText = `Variação do dia: ${variation}`

  const font = `-# 🗞️ Fonte: [AwesomeAPI](<https://docs.awesomeapi.com.br/>)`

  return `${capitalizedNow}\n\n${title}\n${description}\n${variationText}\n\n${font}`
}
