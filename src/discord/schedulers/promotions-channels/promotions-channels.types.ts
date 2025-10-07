import { Client } from 'discord.js'
import type { TelegramMessage } from '../../../services/telegram/telegramService.types.js'

export interface PromotionSchedulerConfig {
  client: Client
  channelIds: string[]
  telegramChannels: string[]
}

export interface SchedulePromotionMessage {
  client: Client
  channelId: string
  telegramChannels: string[]
}

export interface PromotionData extends TelegramMessage {
  formattedDate: string
}

export const PROMOTIONS_CONFIG = {
  SCHEDULE: '0 */2 * * *', // Every 2 hours
  CACHE_TTL: 86400, // 24 hours in seconds
  CACHE_CHECK_PERIOD: 3600, // 1 hour in seconds
  MAX_PROMOTIONS_PER_EXECUTION: 5,
  MESSAGE_DELAY_MS: 2000,
  MAX_MESSAGE_LENGTH: 1800,
} as const
