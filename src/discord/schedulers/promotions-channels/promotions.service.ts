import cron from 'node-cron'
import NodeCache from 'node-cache'
import { Client, TextChannel, AttachmentBuilder, EmbedBuilder, Colors } from 'discord.js'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { TelegramService } from '#services'

import {
  PromotionCategory,
  PROMOTION_KEYWORDS,
  DEFAULT_PROMOTION_CONFIG,
  CATEGORY_SPECIFIC_CONFIG,
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
    this.initialize()
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
        ...DEFAULT_PROMOTION_CONFIG,
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.GENERAL],
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
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.TECH],
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
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.GAMING],
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
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.FITNESS],
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
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.AUTOMOTIVE],
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
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.FASHION],
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
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.HOME],
        category: PromotionCategory.HOME,
        discordChannelIds: homeChannels,
        telegramChannels: homeTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.HOME]],
      })
    }

    // Bugs Configuration
    const bugsChannels = process.env.BUGS_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const bugsTelegramChannels =
      process.env.BUGS_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (bugsChannels.length && bugsTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.BUGS, {
        ...DEFAULT_PROMOTION_CONFIG,
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.BUGS],
        category: PromotionCategory.BUGS,
        discordChannelIds: bugsChannels,
        telegramChannels: bugsTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.BUGS]],
      })
    }

    const aliexpressChannels =
      process.env.ALIEXPRESS_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const aliexpressTelegramChannels =
      process.env.ALIEXPRESS_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (aliexpressChannels.length && aliexpressTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.ALIEXPRESS, {
        ...DEFAULT_PROMOTION_CONFIG,
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.ALIEXPRESS],
        category: PromotionCategory.ALIEXPRESS,
        discordChannelIds: aliexpressChannels,
        telegramChannels: aliexpressTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.ALIEXPRESS]],
      })
    }

    // Cupons Configuration
    const cuponsChannels =
      process.env.CUPONS_PROMOTIONS_CHANNELS_IDS?.split(',').filter(Boolean) || []
    const cuponsTelegramChannels =
      process.env.CUPONS_TELEGRAM_CHANNELS?.split(',').filter(Boolean) || []

    if (cuponsChannels.length && cuponsTelegramChannels.length) {
      this.promotionConfigs.set(PromotionCategory.CUPONS, {
        ...DEFAULT_PROMOTION_CONFIG,
        ...CATEGORY_SPECIFIC_CONFIG[PromotionCategory.CUPONS],
        category: PromotionCategory.CUPONS,
        discordChannelIds: cuponsChannels,
        telegramChannels: cuponsTelegramChannels,
        keywords: [...PROMOTION_KEYWORDS[PromotionCategory.CUPONS]],
      })
    }
  }

  /**
   * Setup schedulers for each category
   */
  private setupSchedulers(): void {
    if (this.promotionConfigs.size === 0) {
      logger.warn('⚠️ No promotion configurations found! Check your environment variables.')
      return
    }

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

      // Get category-specific age limit
      const categoryConfig = CATEGORY_SPECIFIC_CONFIG[category]
      const maxAgeMinutes = categoryConfig?.maxAgeMinutes || DEFAULT_PROMOTION_CONFIG.maxAgeMinutes

      const promotions = await telegramService.searchPromotions({
        channels: telegramChannels,
        keywords,
        limit: 20,
        maxAgeMinutes,
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
        [PromotionCategory.BUGS]: '🐛',
        [PromotionCategory.ALIEXPRESS]: '🛒',
        [PromotionCategory.CUPONS]: '🎫',
      }

      const categoryNames = {
        [PromotionCategory.GENERAL]: 'Geral',
        [PromotionCategory.TECH]: 'Tech',
        [PromotionCategory.GAMING]: 'Gaming',
        [PromotionCategory.FITNESS]: 'Fitness',
        [PromotionCategory.AUTOMOTIVE]: 'Automotivo',
        [PromotionCategory.FASHION]: 'Moda',
        [PromotionCategory.HOME]: 'Casa',
        [PromotionCategory.BUGS]: 'Bugs',
        [PromotionCategory.ALIEXPRESS]: 'AliExpress',
        [PromotionCategory.CUPONS]: 'Cupons',
      }

      const emoji = categoryEmojis[category]
      const categoryName = categoryNames[category]

      // Prepare message content
      const cleanMessage = promotion.message ? promotion.message.substring(0, 1800) : ''
      const sourceFormatted = `-# 📢 Canal: ${promotion.channel.replace('@', '')}`
      const dateFormatted = new Date(promotion.date * 1000).toLocaleString('pt-BR')

      const message = `${cleanMessage}\n\n${sourceFormatted} • ${dateFormatted}`

      // Try to send with image if available
      await this.sendPromotionWithMedia(channelId, promotion, emoji, categoryName, message)
    } catch (error) {
      logger.error(`Error sending ${category} promotion to channel ${channelId}:`, error)
    }
  }

  /**
   * Send promotion with media attachment if available
   */
  private async sendPromotionWithMedia(
    channelId: string,
    promotion: TelegramMessage,
    emoji: string,
    categoryName: string,
    message: string,
  ): Promise<void> {
    try {
      // First try to send with image if it's a photo
      if (promotion.media?.type === 'photo') {
        const success = await this.sendPromotionWithImage(
          channelId,
          promotion,
          emoji,
          categoryName,
          message,
        )
        if (success) return
      }

      // Fallback to regular message with media indicator
      let mediaInfo = ''
      if (promotion.media) {
        const mediaType =
          promotion.media.type === 'photo'
            ? '📸'
            : promotion.media.type === 'video'
              ? '🎥'
              : promotion.media.type === 'document'
                ? '📄'
                : '📎'
        mediaInfo = `${mediaType} *Contém mídia (${promotion.media.type})*\n`
      }

      const finalMessage = promotion.message
        ? `${message}\n\n${mediaInfo}`
        : `${mediaInfo}${message}`

      await sendMessage({
        client: this.client,
        channelId,
        title: `${emoji} Nova Promoção ${categoryName}!`,
        message: finalMessage,
      })
    } catch (error) {
      logger.error('Error sending promotion with media:', error)
    }
  }

  /**
   * Send promotion with downloaded Telegram image
   */
  private async sendPromotionWithImage(
    channelId: string,
    promotion: TelegramMessage,
    emoji: string,
    categoryName: string,
    message: string,
  ): Promise<boolean> {
    try {
      if (!promotion.originalMessage) {
        logger.warn('No original message available for media download')
        return false
      }

      const telegramService = getTelegramService()
      const mediaData = await telegramService.downloadMediaForDiscord(promotion.originalMessage)

      if (!mediaData) {
        logger.warn('Failed to download media from Telegram')
        return false
      }

      // Send using Discord with attachment
      await this.sendDiscordMessageWithAttachment(
        channelId,
        `${emoji} Nova Promoção ${categoryName}!`,
        message,
        mediaData.buffer,
        mediaData.filename,
      )

      return true
    } catch (error) {
      logger.error('Error sending promotion with image:', error)
      return false
    }
  }

  /**
   * Send Discord message with file attachment
   */
  private async sendDiscordMessageWithAttachment(
    channelId: string,
    title: string,
    message: string,
    buffer: Buffer,
    filename: string,
  ): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel

      if (!channel || !channel.isTextBased()) {
        throw new Error(`Channel ${channelId} not found or not text-based`)
      }

      const attachment = new AttachmentBuilder(buffer, { name: filename })

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setImage(`attachment://${filename}`)
        .setColor(Colors.Blue)

      await channel.send({
        embeds: [embed],
        files: [attachment],
      })
    } catch (error) {
      logger.error('Error sending Discord message with attachment:', error)
      throw error
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

// Singleton instance
let promotionsServiceInstance: PromotionsService | null = null

/**
 * Initialize promotions system
 */
export function initializePromotions(client: Client): void {
  if (!promotionsServiceInstance) {
    promotionsServiceInstance = new PromotionsService(client)
    logger.log('✅ Promotions service initialized')
  }
}

/**
 * Get promotions service instance
 */
export function getPromotionsService(): PromotionsService | null {
  return promotionsServiceInstance
}
