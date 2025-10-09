import cron from 'node-cron'
import NodeCache from 'node-cache'
import { Client } from 'discord.js'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { TelegramService } from '#services'

import {
  PromotionCategory,
  PROMOTION_KEYWORDS,
  DEFAULT_PROMOTION_CONFIG,
  GENERAL_PROMOTION_CONFIG,
  type PromotionConfig,
} from './promotions.types.js'
import type { TelegramMessage } from '../../../services/telegram/telegramService.types.js'

// Cache for each promotion category - 24 hours TTL
const promotionCache = new Map<PromotionCategory, NodeCache>()

// Queue for promotions by category
const promotionQueues = new Map<PromotionCategory, TelegramMessage[]>()

// Singleton for TelegramService to reuse connection
let telegramServiceInstance: TelegramService | null = null

function getTelegramService(): TelegramService {
  if (!telegramServiceInstance) {
    telegramServiceInstance = new TelegramService({
      apiId: Number(process.env.TELEGRAM_API_ID),
      apiHash: process.env.TELEGRAM_API_HASH!,
      phoneNumber: process.env.TELEGRAM_PHONE_NUMBER,
      password: process.env.TELEGRAM_PASSWORD,
      sessionString: process.env.TELEGRAM_SESSION_STRING,
    })
  }
  return telegramServiceInstance
}

function getPromotionCache(category: PromotionCategory): NodeCache {
  if (!promotionCache.has(category)) {
    promotionCache.set(
      category,
      new NodeCache({
        stdTTL: 86400, // 24 hours
        checkperiod: 3600, // Check every 1 hour
      }),
    )
  }
  return promotionCache.get(category)!
}

function getPromotionQueue(category: PromotionCategory): TelegramMessage[] {
  if (!promotionQueues.has(category)) {
    promotionQueues.set(category, [])
  }
  return promotionQueues.get(category)!
}

export class PromotionsService {
  private client: Client
  private promotionConfigs: Map<PromotionCategory, PromotionConfig> = new Map()

  constructor(client: Client) {
    this.client = client
  }

  /**
   * Initialize schedulers for all configured categories
   */
  initialize(): void {
    this.loadPromotionConfigurations()
    this.setupSchedulers()

    const configuredCategories = Array.from(this.promotionConfigs.keys())
    logger.success(`Promotions system initialized for: ${configuredCategories.join(', ')}`)
  }

  /**
   * Load configurations for the promotion categories from environment variables
   */
  private loadPromotionConfigurations(): void {
    // General Configuration (replaces the old system)
    const generalChannels = process.env.PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const generalTelegramChannels =
      process.env.TELEGRAM_PROMOTIONS_CHANNELS?.split(',').filter(Boolean) || []

    if (generalChannels.length && generalTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.GENERAL, {
        ...GENERAL_PROMOTION_CONFIG,
        category: PromotionCategory.GENERAL,
        discordChannelIds: generalChannels,
        telegramChannels: generalTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.GENERAL]],
      })
    }

    // Tech Configuration
    const techChannels = process.env.TECH_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const techTelegramChannels =
      process.env.TECH_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (techChannels.length && techTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.TECH, {
        ...DEFAULT_PROMOTION_CONFIG,
        category: PromotionCategory.TECH,
        discordChannelIds: techChannels,
        telegramChannels: techTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.TECH]],
      })
    }

    // Gaming Configuration
    const gamingChannels =
      process.env.GAMING_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const gamingTelegramChannels =
      process.env.GAMING_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (gamingChannels.length && gamingTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.GAMING, {
        ...DEFAULT_PROMOTION_CONFIG,
        category: PromotionCategory.GAMING,
        discordChannelIds: gamingChannels,
        telegramChannels: gamingTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.GAMING]],
      })
    }

    // Fitness Configuration
    const fitnessChannels =
      process.env.FITNESS_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const fitnessTelegramChannels =
      process.env.FITNESS_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (fitnessChannels.length && fitnessTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.FITNESS, {
        ...DEFAULT_PROMOTION_CONFIG,
        category: PromotionCategory.FITNESS,
        discordChannelIds: fitnessChannels,
        telegramChannels: fitnessTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.FITNESS]],
      })
    }

    // Automotive Configuration
    const automotiveChannels =
      process.env.AUTOMOTIVE_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const automotiveTelegramChannels =
      process.env.AUTOMOTIVE_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (automotiveChannels.length && automotiveTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.AUTOMOTIVE, {
        ...DEFAULT_PROMOTION_CONFIG,
        category: PromotionCategory.AUTOMOTIVE,
        discordChannelIds: automotiveChannels,
        telegramChannels: automotiveTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.AUTOMOTIVE]],
      })
    }

    // Fashion Configuration
    const fashionChannels =
      process.env.FASHION_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const fashionTelegramChannels =
      process.env.FASHION_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (fashionChannels.length && fashionTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.FASHION, {
        ...DEFAULT_PROMOTION_CONFIG,
        category: PromotionCategory.FASHION,
        discordChannelIds: fashionChannels,
        telegramChannels: fashionTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.FASHION]],
      })
    }

    // Home Configuration
    const homeChannels = process.env.HOME_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const homeTelegramChannels =
      process.env.HOME_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (homeChannels.length && homeTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.HOME, {
        ...DEFAULT_PROMOTION_CONFIG,
        category: PromotionCategory.HOME,
        discordChannelIds: homeChannels,
        telegramChannels: homeTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.HOME]],
      })
    }
  }

  /**
   * Setup schedulers for each category
   */
  private setupSchedulers(): void {
    for (const [category, config] of this.promotionConfigs) {
      cron.schedule(
        config.schedulePattern,
        async () => {
          try {
            await this.processPromotions(config)
          } catch (error) {
            logger.error(`Error processing ${category} promotions:`, error)
          }
        },
        {
          timezone: 'America/Sao_Paulo',
          name: `promotions-${category.toLowerCase()}`,
        },
      )

      logger.log(`📅 Scheduled ${category} promotions: ${config.schedulePattern}`)
    }
  }

  /**
   * Process promotions for a specific category
   */
  private async processPromotions(config: PromotionConfig): Promise<void> {
    const { category, discordChannelIds, telegramChannels, keywords, maxPromotionsPerExecution } =
      config

    try {
      // Fetch new promotions if the queue is empty
      let queue = getPromotionQueue(category)
      if (queue.length === 0) {
        await this.fetchPromotionsForCategory(category, telegramChannels, keywords)
        queue = getPromotionQueue(category)
      }

      if (queue.length === 0) {
        logger.warn(`No promotions available for ${category}`)
        return
      }

      // Process one channel at a time to avoid spam
      for (const channelId of discordChannelIds) {
        const promotionsToSend = queue.splice(0, maxPromotionsPerExecution)

        if (promotionsToSend.length === 0) break

        for (const promotion of promotionsToSend) {
          await this.sendPromotionToChannel(channelId, promotion, category)

          // Delay between messages
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }

      // Update the queue
      promotionQueues.set(category, queue)
    } catch (error) {
      logger.error(`Error in ${category} promotions processing:`, error)
    }
  }

  /**
   * Fetch new promotions for a specific category
   */
  private async fetchPromotionsForCategory(
    category: PromotionCategory,
    telegramChannels: string[],
    keywords: string[],
  ): Promise<void> {
    try {
      const telegramService = getTelegramService()
      const cache = getPromotionCache(category)

      logger.log(`🔍 Fetching ${category} promotions from ${telegramChannels.length} channels`)

      const promotions = await telegramService.searchPromotions({
        channels: telegramChannels,
        keywords,
        limit: 20,
      })

      // Filter out already sent promotions
      const newPromotions = promotions.filter((promo) => !cache.has(`${promo.channel}_${promo.id}`))

      if (newPromotions.length > 0) {
        // Mark promotions as viewed
        newPromotions.forEach((promo) => {
          cache.set(`${promo.channel}_${promo.id}`, true)
        })

        // Add to the queue
        const currentQueue = getPromotionQueue(category)
        const updatedQueue = [...currentQueue, ...newPromotions]
        promotionQueues.set(category, updatedQueue)

        logger.success(`Added ${newPromotions.length} new ${category} promotions to queue`)
      }
    } catch (error) {
      logger.error(`Error fetching ${category} promotions:`, error)
    }
  }

  /**
   * Send a promotion to a specific channel
   */
  private async sendPromotionToChannel(
    channelId: string,
    promotion: TelegramMessage,
    category: PromotionCategory,
  ): Promise<void> {
    try {
      const categoryEmojis = {
        [PromotionCategory.GENERAL]: '🎯',
        [PromotionCategory.TECH]: '💻',
        [PromotionCategory.GAMING]: '🎮',
        [PromotionCategory.FITNESS]: '🏋️',
        [PromotionCategory.AUTOMOTIVE]: '🚗',
        [PromotionCategory.FASHION]: '👗',
        [PromotionCategory.HOME]: '🏠',
      }

      const categoryNames = {
        [PromotionCategory.GENERAL]: 'Geral',
        [PromotionCategory.TECH]: 'Tech',
        [PromotionCategory.GAMING]: 'Gaming',
        [PromotionCategory.FITNESS]: 'Fitness',
        [PromotionCategory.AUTOMOTIVE]: 'Automotivo',
        [PromotionCategory.FASHION]: 'Moda',
        [PromotionCategory.HOME]: 'Casa',
      }

      const emoji = categoryEmojis[category]
      const categoryName = categoryNames[category]

      // Limit the message size
      const cleanMessage = promotion.message.substring(0, 1800)
      const sourceFormatted = `-# 📢 Canal: ${promotion.channel.replace('@', '')}`
      const dateFormatted = new Date(promotion.date * 1000).toLocaleString('pt-BR')

      const message = `${cleanMessage}\n\n${sourceFormatted} • ${dateFormatted}`

      await sendMessage({
        client: this.client,
        channelId,
        title: `${emoji} Nova Promoção ${categoryName}!`,
        message,
      })

      logger.log(`Sent ${category} promotion from ${promotion.channel} to channel ${channelId}`)
    } catch (error) {
      logger.error(`Error sending ${category} promotion to channel ${channelId}:`, error)
    }
  }

  /**
   * Get statistics from the queues by category
   */
  getQueueStats(): Record<PromotionCategory, number> {
    const stats: Record<PromotionCategory, number> = {} as any

    for (const category of Object.values(PromotionCategory)) {
      stats[category] = getPromotionQueue(category).length
    }

    return stats
  }
}
