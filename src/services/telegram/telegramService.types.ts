export interface TelegramMessage {
  id: number
  message: string
  date: number
  channelId: string
  fromId?: string
  channel: string
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
}
