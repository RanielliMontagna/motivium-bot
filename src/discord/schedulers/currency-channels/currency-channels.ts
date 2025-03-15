import dayjs from 'dayjs'
import cron from 'node-cron'
import { Client, Colors } from 'discord.js'

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

import { sendMessage } from '#utils'
import { logger } from '#settings'
import {
  DollarExchangeRateResponse,
  getDollarExchangeRate,
  CoinGeckoCoin,
  getCoinData,
  Coins,
} from '#services'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Initializes the scheduler for currency channels
 * @param client Discord client
 */
export async function initializeCurrencyChannelsScheduler(client: Client) {
  cron.schedule(
    '0 9-18 * * 1-5', // Every hour from 9 to 18 hours, Monday to Friday
    async () => scheduleDollarExchangeRateMessage(client),
    { timezone: 'America/Sao_Paulo' },
  )

  cron.schedule(
    '0 6-22/1 * * *', // Every hour from 6 to 22 hours
    async () => scheduleBitcoinMessage(client),
    { timezone: 'America/Sao_Paulo' },
  )
}

export async function scheduleDollarExchangeRateMessage(client: Client): Promise<void> {
  const dollarExchangeChannelsIds = process.env.CURRENCY_DOLLAR_EXCHANGE_CHANNEL_IDS?.split(',')

  if (!dollarExchangeChannelsIds?.length) {
    logger.warn('No currency channels IDs found')
    return
  }

  const data = await getDollarExchangeRate()

  await Promise.all(
    dollarExchangeChannelsIds.map(async (channelId) => {
      formatDollarMessage(data)

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

export async function scheduleBitcoinMessage(client: Client): Promise<void> {
  const bitcoinChannelsIds = process.env.CURRENCY_BTC_CHANNEL_IDS?.split(',')

  if (!bitcoinChannelsIds?.length) {
    logger.warn('No bitcoin channels IDs found')
    return
  }

  const data = await getCoinData(Coins.Bitcoin)

  await Promise.all(
    bitcoinChannelsIds.map(async (channelId) => {
      formatBitcoinMessage(data)

      await sendMessage({
        client,
        channelId,
        message: formatBitcoinMessage(data),
        color: Colors.Gold,
      })
    }),
  )
}

export function formatBitcoinMessage(data: CoinGeckoCoin): string {
  const now = dayjs().tz('America/Sao_Paulo').format('dddd, [dia] D [de] MMMM [de] YYYY [às] HH:mm')
  const capitalizedNow = `-# ${now.charAt(0).toUpperCase() + now.slice(1)}`
  const title = '🪙 **Bitcoin** 🪙'
  const value = `Preço em dólares: **$${data.usd.toFixed(2)}**`
  const variation =
    data.usd_24h_change > 0
      ? `📈 **${data.usd_24h_change.toFixed(2)}%**`
      : `📉 **${data.usd_24h_change.toFixed(2)}%**`
  const variationText = `Variação do dia: ${variation}`
  const font = `-# Fonte: [CoinGecko](<https://www.coingecko.com/>)`

  return `${capitalizedNow}\n\n${title}\n${value}\n${variationText}\n\n${font}`
}
