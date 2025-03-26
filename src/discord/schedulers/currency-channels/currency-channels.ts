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

type CurrencyType = 'dollar' | 'bitcoin' | 'ethereum' | 'solana'

type ColorsType = (typeof Colors)[keyof typeof Colors]

type CurrencyConfig = {
  coin: Coins | 'dollar'
  envVar: string
  color: ColorsType
  title: string
  icon: string
  source: string
}

const currencyConfigs: Record<CurrencyType, CurrencyConfig> = {
  dollar: {
    coin: 'dollar',
    envVar: 'CURRENCY_DOLLAR_EXCHANGE_CHANNEL_IDS',
    color: Colors.Green,
    title: '💵 **Cotação do Dólar** 💵',
    icon: '💵',
    source: '[AwesomeAPI](<https://docs.awesomeapi.com.br/>)',
  },
  bitcoin: {
    coin: Coins.Bitcoin,
    envVar: 'CURRENCY_BTC_CHANNEL_IDS',
    color: Colors.Gold,
    title: '🪙 **Bitcoin** 🪙',
    icon: '🪙',
    source: '[CoinGecko](<https://www.coingecko.com/>)',
  },
  ethereum: {
    coin: Coins.Ethereum,
    envVar: 'CURRENCY_ETH_CHANNEL_IDS',
    color: Colors.Blue,
    title: '🔵 **Ethereum** 🔵',
    icon: '🔵',
    source: '[CoinGecko](<https://www.coingecko.com/>)',
  },
  solana: {
    coin: Coins.Solana,
    envVar: 'CURRENCY_SOL_CHANNEL_IDS',
    color: Colors.Purple,
    title: '🟣 **Solana** 🟣',
    icon: '🟣',
    source: '[CoinGecko](<https://www.coingecko.com/>)',
  },
}

export async function initializeCurrencyChannelsScheduler(client: Client) {
  // Schedule the dollar exchange rate message every weekday at 9 AM to 6 PM
  cron.schedule('0 9-18 * * 1-5', () => scheduleCurrencyMessage(client, 'dollar'), {
    timezone: 'America/Sao_Paulo',
  })

  // Schedule the bitcoin exchange rate message every weekday at 6 AM to 10 PM
  cron.schedule('0 6-22/1 * * *', () => scheduleCurrencyMessage(client, 'bitcoin'), {
    timezone: 'America/Sao_Paulo',
  })

  // Schedule the ethereum exchange rate message every weekday at 6 AM to 10 PM
  cron.schedule('0 6-22/1 * * *', () => scheduleCurrencyMessage(client, 'ethereum'), {
    timezone: 'America/Sao_Paulo',
  })

  // Schedule the solana exchange rate message every weekday at 6 AM to 10 PM
  cron.schedule('0 6-22/1 * * *', () => scheduleCurrencyMessage(client, 'solana'), {
    timezone: 'America/Sao_Paulo',
  })
}

async function scheduleCurrencyMessage(client: Client, type: CurrencyType): Promise<void> {
  const config = currencyConfigs[type]
  const channelIds = process.env[config.envVar]?.split(',')

  if (!channelIds?.length) {
    logger.warn(`No channels found for ${type}`)
    return
  }

  const data =
    type === 'dollar' ? await getDollarExchangeRate() : await getCoinData(config.coin as Coins)
  const message = formatCurrencyMessage(type, data, config)

  await Promise.all(
    channelIds.map(async (channelId) => {
      await sendMessage({
        client,
        channelId,
        message,
        color: config.color,
      })
    }),
  )
}

function formatCurrencyMessage(
  type: CurrencyType,
  data: DollarExchangeRateResponse | CoinGeckoCoin,
  config: CurrencyConfig,
): string {
  const now = dayjs().tz('America/Sao_Paulo').format('dddd, [dia] D [de] MMMM [de] YYYY [às] HH:mm')
  const capitalizedNow = `-# ${now.charAt(0).toUpperCase() + now.slice(1)}`

  const value =
    type === 'dollar'
      ? `O valor do dólar no momento é: **R$ ${parseFloat((data as DollarExchangeRateResponse).bid)
          .toFixed(2)
          .replace('.', ',')}**`
      : `Preço em dólares: **$${(data as CoinGeckoCoin).usd.toFixed(2)}**`

  const dayVariation =
    type === 'dollar'
      ? parseFloat((data as DollarExchangeRateResponse).pctChange)
      : (data as CoinGeckoCoin).usd_24h_change

  const variation =
    dayVariation > 0 ? `📈 **${dayVariation.toFixed(2)}%**` : `📉 **${dayVariation.toFixed(2)}%**`
  const variationText = `Variação do dia: ${variation}`

  const font = `-# 🗞️ Fonte: ${config.source}`

  return `${capitalizedNow}\n\n${config.title}\n${value}\n${variationText}\n\n${font}`
}
