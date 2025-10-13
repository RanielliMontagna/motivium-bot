import { SmartKeywordConfig } from '#schedulers'

export interface TelegramMessage {
  id: number
  message: string
  date: number
  channelId: string
  fromId?: string
  channel: string
  media?: TelegramMediaInfo
  originalMessage?: any // Store original Telegram message for media download
}

export interface TelegramMediaInfo {
  type: 'photo' | 'document' | 'video' | 'sticker'
  fileId?: string
  fileName?: string
  mimeType?: string
  size?: number
  thumbnail?: string
  downloadUrl?: string
}

export interface TelegramServiceConfig {
  apiId: number
  apiHash: string
  phoneNumber?: string
  password?: string
  sessionString?: string
}

export interface PromotionSearchOptions {
  channels: string[]
  keywords?: string[]
  limit?: number
  maxAgeMinutes?: number
  smartConfig?: SmartKeywordConfig
}

export interface ClassificationResult {
  match: boolean
  confidence: number
  reason: string
  category?: string
}

export interface IMessageClassifier {
  classify(message: string, config: any): ClassificationResult
}

export interface IPromotionSearchService {
  searchPromotions(options: PromotionSearchOptions): Promise<TelegramMessage[]>
}
