import type {
  PromotionSearchCriteria,
  PromotionQueueManager,
  PromotionCacheManager,
} from '../domain/interfaces.js'
import type { IPromotionSearchService } from '../../../../services/telegram/telegramService.types.js'
import type { SMART_KEYWORDS } from '../promotions.types.js'
import { logger } from '#settings'

/**
 * Use case for fetching and processing promotions
 * Implements business logic following Clean Architecture
 */
export class FetchPromotionsUseCase {
  constructor(
    private searchService: IPromotionSearchService,
    private queueManager: PromotionQueueManager,
    private cacheManager: PromotionCacheManager,
    private smartKeywords: typeof SMART_KEYWORDS,
  ) {}

  async execute(criteria: PromotionSearchCriteria): Promise<void> {
    try {
      const { category, channels, keywords, maxAgeMinutes, limit } = criteria

      // Get smart configuration for the category
      const smartConfig = this.smartKeywords[category as keyof typeof this.smartKeywords]

      logger.log(
        `🔍 Fetching ${category} promotions from ${channels.length} channels (max age: ${maxAgeMinutes}min)`,
      )

      // Search for promotions using the service
      const promotions = await this.searchService.searchPromotions({
        channels,
        keywords,
        limit,
        maxAgeMinutes,
        smartConfig,
      })

      // Filter out already sent promotions
      const newPromotions = promotions.filter((promo) => {
        const promotionId = `${promo.channel}_${promo.id}`
        return !this.cacheManager.isAlreadySent(category, promotionId)
      })

      if (newPromotions.length > 0) {
        // Mark promotions as sent
        newPromotions.forEach((promo) => {
          const promotionId = `${promo.channel}_${promo.id}`
          this.cacheManager.markAsSent(category, promotionId)
        })

        // Add to queue
        this.queueManager.addPromotions(category, newPromotions)

        logger.log(`✅ Added ${newPromotions.length} new ${category} promotions to queue`)
      } else {
        logger.log(`ℹ️ No new promotions found for ${category}`)
      }
    } catch (error) {
      logger.error(`❌ Error fetching ${criteria.category} promotions:`, error)
      throw error
    }
  }
}
