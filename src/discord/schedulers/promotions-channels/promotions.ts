import type { Client } from 'discord.js'
import { PromotionsService } from './promotions.service.js'

let promotionsService: PromotionsService | null = null

/**
 * Initialize the unified promotions system
 */
export function initializePromotions(client: Client): PromotionsService {
  if (!promotionsService) {
    promotionsService = new PromotionsService(client)
    promotionsService.initialize()
  }

  return promotionsService
}

/**
 * Get the instance of the promotions service
 */
export function getPromotionsService(): PromotionsService | null {
  return promotionsService
}

export { PromotionsService }
export * from './promotions.types.js'
