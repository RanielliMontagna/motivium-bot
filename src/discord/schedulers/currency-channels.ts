import dayjs from 'dayjs'
import cron from 'node-cron'
import { Client } from 'discord.js'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { DollarExchangeRateResponse, getDollarExchangeRate } from '#services'

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Initializes the scheduler for currency channels
 * @param client Discord client
 */
export async function initializeCurrencyChannelsScheduler(client: Client) {
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
      await sendMessage({
        client,
        channelId,
        message: formatDollarMessage(data),
      })
    }),
  )
}

function formatDollarMessage(data: DollarExchangeRateResponse): string {
  const now = dayjs().tz('America/Sao_Paulo').format('dddd, [dia] D [de] MMMM [de] YYYY [às] HH:mm')
  const isFirstHour = dayjs().tz('America/Sao_Paulo').hour() === 9
  const isLastHour = dayjs().tz('America/Sao_Paulo').hour() === 18

  const capitalizedNow = now.charAt(0).toUpperCase() + now.slice(1)

  const title = '💵 **Cotação do Dólar** 💵'

  let description = `O valor do dólar no momento é: **R$ ${data.bid}** (${data.varBid})`
  if (isFirstHour) description = `O mercado abriu com o dólar valendo: **R$ ${data.bid}**`
  if (isLastHour) description = `O mercado fechou com o dólar valendo: **R$ ${data.bid}**`

  const font = `-# 📈 Fonte: [AwesomeAPI](<https://docs.awesomeapi.com.br/>)`

  return `📅 ${capitalizedNow}\n\n${title}\n${description}\n\n${font}`
}
