import dayjs from 'dayjs'
import cron from 'node-cron'
import NodeCache from 'node-cache'
import { Client } from 'discord.js'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { DollarExchangeRateResponse, getDollarExchangeRate } from '#services'

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }) // 24 hours

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
        message: formatDollarMessage(data, channelId),
      })
    }),
  )
}

function formatDollarMessage(data: DollarExchangeRateResponse, channelId: string): string {
  const now = dayjs().tz('America/Sao_Paulo').format('dddd, [dia] D [de] MMMM [de] YYYY [às] HH:mm')
  const isFirstHour = dayjs().tz('America/Sao_Paulo').hour() === 9
  const isLastHour = dayjs().tz('America/Sao_Paulo').hour() === 18

  const capitalizedNow = now.charAt(0).toUpperCase() + now.slice(1)
  const title = '💵 **Cotação do Dólar** 💵'

  const lastBid = cache.get<number>(`lastBid_${channelId}`)
  const varBid = lastBid ? +(Number(data.bid) - lastBid).toFixed(2) : 0

  let description = `O valor do dólar no momento é: **R$ ${data.bid}** ${
    varBid > 0 ? `(+${varBid})` : varBid < 0 ? `(${varBid})` : ''
  }`

  if (isFirstHour) description = `O mercado abriu com o dólar valendo: **R$ ${data.bid}**`
  if (isLastHour) description = `O mercado fechou com o dólar valendo: **R$ ${data.bid}**`

  const font = `-# 📈 Fonte: [AwesomeAPI](<https://docs.awesomeapi.com.br/>)`

  cache.set(`lastBid_${channelId}`, data.bid)

  return `📅 ${capitalizedNow}\n\n${title}\n${description}\n\n${font}`
}
