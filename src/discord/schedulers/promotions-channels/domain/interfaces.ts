/**
 * Domain entities and interfaces for promotion system
 * Following Clean Architecture principles
 */

export interface PromotionSearchCriteria {
  category: string
  channels: string[]
  keywords: string[]
  maxAgeMinutes: number
  limit: number
}

export interface PromotionQueueManager {
  addPromotions(category: string, promotions: any[]): void
  getNext(category: string, count: number): any[]
  getQueueSize(category: string): number
  clearQueue(category: string): void
}

export interface PromotionCacheManager {
  isAlreadySent(category: string, promotionId: string): boolean
  markAsSent(category: string, promotionId: string): void
  clear(category: string): void
}

export interface PromotionScheduler {
  start(): void
  stop(): void
  getStatus(): { running: boolean; categories: string[] }
}

export interface PromotionSender {
  sendToChannel(channelId: string, promotion: any, category: string): Promise<void>
}

export interface PromotionStats {
  [category: string]: number
}
