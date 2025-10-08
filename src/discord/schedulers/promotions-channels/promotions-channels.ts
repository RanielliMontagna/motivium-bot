import cron from 'node-cron'
import dayjs from 'dayjs'
import NodeCache from 'node-cache'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { TelegramService } from '../../../services/telegram/telegramService.js'
import type { TelegramMessage } from '../../../services/telegram/telegramService.types.js'

import { PROMOTIONS_CONFIG } from './promotions-channels.types.js'
import type {
  PromotionSchedulerConfig,
  SchedulePromotionMessage,
  PromotionData,
} from './promotions-channels.types.js'

// Set cache expiration time based on configuration
const promotionsCache = new NodeCache({
  stdTTL: PROMOTIONS_CONFIG.CACHE_TTL,
  checkperiod: PROMOTIONS_CONFIG.CACHE_CHECK_PERIOD,
})

// Queue para armazenar promoções pendentes para envio
const promotionsQueue = new Map<string, TelegramMessage[]>()
let lastFetchTime = 0
const FETCH_INTERVAL_MS = 5 * 60 * 1000

/**
 * Initializes the scheduler for promotions channels.
 * @param client Discord client
 */
export async function initializePromotionsScheduler(
  config: PromotionSchedulerConfig,
): Promise<void> {
  const { client, channelIds, telegramChannels } = config

  if (!channelIds?.length) {
    logger.warn('No promotions channels configured')
    return
  }

  if (!telegramChannels?.length) {
    logger.warn('No Telegram channels configured for promotions')
    return
  }

  cron.schedule(
    PROMOTIONS_CONFIG.SCHEDULE,
    () => {
      channelIds.forEach((channelId) => {
        schedulePromotionMessage({
          client,
          channelId,
          telegramChannels,
        })
      })
    },
    { timezone: 'America/Sao_Paulo' },
  )

  logger.success('Promotions scheduler initialized successfully')
}

async function fetchNewPromotions(telegramChannels: string[], queueKey: string): Promise<void> {
  let telegramService: TelegramService | null = null

  try {
    logger.log('🔍 Fetching new promotions from Telegram...')

    telegramService = new TelegramService({
      apiId: Number(process.env.TELEGRAM_API_ID),
      apiHash: process.env.TELEGRAM_API_HASH!,
      phoneNumber: process.env.TELEGRAM_PHONE_NUMBER,
      password: process.env.TELEGRAM_PASSWORD,
      sessionString: process.env.TELEGRAM_SESSION_STRING,
    })

    await telegramService.initialize()

    const promotions = await telegramService.searchPromotions({
      channels: telegramChannels,
      keywords: [
        'promoção',
        'desconto',
        '% off',
        'oferta',
        'cupom',
        'sale',
        'black friday',
        'cyber monday',
        'frete grátis',
        'liquidação',
        'promo',
        'descontos',
        'cashback',
        'mercado livre',
        'magalu',
      ],
      limit: 30,
    })

    if (!promotions.length) {
      logger.log('No new promotions found')
      return
    }

    const newPromotions = promotions.filter(
      (promotion: TelegramMessage) => !promotionsCache.has(`${promotion.channel}_${promotion.id}`),
    )

    if (newPromotions.length === 0) {
      logger.log('No unsent promotions found')
      return
    }

    const existingQueue = promotionsQueue.get(queueKey) || []
    const updatedQueue = [...existingQueue, ...newPromotions]
    promotionsQueue.set(queueKey, updatedQueue)

    logger.success(`Added ${newPromotions.length} new promotions to queue`)
  } catch (error) {
    logger.error('Error fetching new promotions:', error)
  } finally {
    if (telegramService) {
      try {
        await telegramService.disconnect()
      } catch (disconnectError) {
        logger.warn('Error disconnecting Telegram service:', disconnectError)
      }
    }
  }
}

async function schedulePromotionMessage({
  client,
  channelId,
  telegramChannels,
}: SchedulePromotionMessage): Promise<void> {
  try {
    const channel = client.channels.cache.get(channelId)

    if (!channel || !channel.isTextBased()) {
      logger.warn(`Channel with ID ${channelId} not found or not text-based`)
      return
    }

    const now = Date.now()
    const queueKey = channelId

    if (now - lastFetchTime > FETCH_INTERVAL_MS || !promotionsQueue.has(queueKey)) {
      await fetchNewPromotions(telegramChannels, queueKey)
      lastFetchTime = now
    }

    const channelQueue = promotionsQueue.get(queueKey) || []

    if (channelQueue.length === 0) {
      logger.log(`No promotions in queue for channel ${channelId}`)
      return
    }

    const promotion = channelQueue.shift()
    if (!promotion) return

    promotionsQueue.set(queueKey, channelQueue)
    promotionsCache.set(`${promotion.channel}_${promotion.id}`, true)

    const promotionData: PromotionData = {
      ...promotion,
      formattedDate: dayjs(promotion.date * 1000).format('DD/MM/YYYY [às] HH:mm'),
    }

    console.log(JSON.stringify(promotionData, null, 2))
    const cleanMessage = promotion.message.substring(0, PROMOTIONS_CONFIG.MAX_MESSAGE_LENGTH) // Limit message length only

    const sourceFormatted = `-# 📢 Canal: ${promotion.channel.replace('@', '')}`
    const message = `${cleanMessage}\n\n${sourceFormatted} • ${promotionData.formattedDate}`

    await sendMessage({
      client,
      channelId,
      title: '🛍️ Nova Promoção Encontrada!',
      message,
    })

    logger.success(`Sent promotion from ${promotion.channel} to channel ${channelId}`)
  } catch (error) {
    logger.error(`Error in promotions scheduler for channel ${channelId}:`, error)
  }
}
