import NodeCache from 'node-cache'

import type { TelegramMessage } from '../../../../services/telegram/telegramService.types.js'
import type { PromotionQueueManager, PromotionCacheManager } from '../domain/interfaces.js'

/**
 * In-memory implementation of promotion queue management
 * Follows Repository pattern for data access
 */
export class InMemoryPromotionQueueManager implements PromotionQueueManager {
  private queues = new Map<string, TelegramMessage[]>()

  addPromotions(category: string, promotions: TelegramMessage[]): void {
    if (!this.queues.has(category)) {
      this.queues.set(category, [])
    }

    const currentQueue = this.queues.get(category)!
    const updatedQueue = [...currentQueue, ...promotions]
    this.queues.set(category, updatedQueue)
  }

  getNext(category: string, count: number): TelegramMessage[] {
    const queue = this.queues.get(category) || []
    const items = queue.splice(0, count)
    this.queues.set(category, queue)
    return items
  }

  getQueueSize(category: string): number {
    return (this.queues.get(category) || []).length
  }

  clearQueue(category: string): void {
    this.queues.set(category, [])
  }

  getAllStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    for (const [category, queue] of this.queues) {
      stats[category] = queue.length
    }
    return stats
  }
}

/**
 * Cache-based implementation for tracking sent promotions
 * Prevents duplicate sends using TTL-based cache
 */
export class CacheBasedPromotionCacheManager implements PromotionCacheManager {
  private caches = new Map<string, NodeCache>()
  private readonly TTL = 86400 // 24 hours

  private getCache(category: string): NodeCache {
    if (!this.caches.has(category)) {
      this.caches.set(
        category,
        new NodeCache({
          stdTTL: this.TTL,
          checkperiod: 3600, // Check every 1 hour
        }),
      )
    }
    return this.caches.get(category)!
  }

  isAlreadySent(category: string, promotionId: string): boolean {
    const cache = this.getCache(category)
    return cache.has(promotionId)
  }

  markAsSent(category: string, promotionId: string): void {
    const cache = this.getCache(category)
    cache.set(promotionId, true)
  }

  clear(category: string): void {
    const cache = this.getCache(category)
    cache.flushAll()
  }
}
