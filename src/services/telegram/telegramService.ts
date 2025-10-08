import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/StringSession.js'

import { logger } from '#settings'
import type {
  TelegramMessage,
  TelegramServiceConfig,
  PromotionSearchOptions,
} from './telegramService.types.js'

// Global state to manage Telegram authentication
class TelegramAuthManager {
  private static instance: TelegramAuthManager
  private pendingCode: string | null = null
  private codeResolver: ((code: string) => void) | null = null

  static getInstance(): TelegramAuthManager {
    if (!TelegramAuthManager.instance) {
      TelegramAuthManager.instance = new TelegramAuthManager()
    }
    return TelegramAuthManager.instance
  }

  setCode(code: string): void {
    this.pendingCode = code
    if (this.codeResolver) {
      this.codeResolver(code)
      this.codeResolver = null
    }
  }

  waitForCode(): Promise<string> {
    if (this.pendingCode) {
      const code = this.pendingCode
      this.pendingCode = null
      return Promise.resolve(code)
    }

    return new Promise((resolve) => {
      this.codeResolver = resolve
      logger.warn('📨 Telegram code required! Use: /telegramcode <code>')
    })
  }

  hasPendingRequest(): boolean {
    return this.codeResolver !== null
  }
}

export class TelegramError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message)
    this.name = 'TelegramError'
  }
}

export class TelegramAuthError extends TelegramError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError)
    this.name = 'TelegramAuthError'
  }
}

export class TelegramConnectionError extends TelegramError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError)
    this.name = 'TelegramConnectionError'
  }
}

export class TelegramService {
  private client: any
  private session: any
  private config: TelegramServiceConfig
  private isInitialized: boolean = false
  private authManager = TelegramAuthManager.getInstance()
  private connectionTimeout: NodeJS.Timeout | null = null

  private readonly DEFAULT_KEYWORDS = [
    'promoção',
    'desconto',
    '% off',
    'oferta',
    'cupom',
    'sale',
    'black friday',
    'cyber monday',
    'liquidação',
    'promo',
  ]

  constructor(config: TelegramServiceConfig) {
    this.validateConfig(config)
    this.config = config

    let sessionString = ''
    if (
      config.sessionString &&
      config.sessionString.trim() !== '' &&
      config.sessionString !== 'sessao_string_opcional'
    ) {
      if (config.sessionString.length > 20 && /^[A-Za-z0-9+/=]+$/.test(config.sessionString)) {
        sessionString = config.sessionString
      } else {
        logger.warn('Invalid session string format, starting with empty session')
      }
    }

    this.session = new StringSession(sessionString)
    this.client = new TelegramClient(this.session, config.apiId, config.apiHash, {
      connectionRetries: 3,
      requestRetries: 2,
      timeout: 10000, // 10 seconds
      useWSS: false,
      floodSleepThreshold: 60,
    })
  }

  static submitSMSCode(code: string): boolean {
    try {
      TelegramAuthManager.getInstance().setCode(code)
      return true
    } catch (error) {
      logger.error('Error submitting Telegram code:', error)
      return false
    }
  }

  static hasPendingAuth(): boolean {
    return TelegramAuthManager.getInstance().hasPendingRequest()
  }

  private validateConfig(config: TelegramServiceConfig): void {
    if (!config.apiId || !config.apiHash) {
      throw new Error('Telegram API ID and Hash are required')
    }

    if (typeof config.apiId !== 'number' || config.apiId <= 0) {
      throw new Error('Invalid Telegram API ID')
    }

    if (typeof config.apiHash !== 'string' || config.apiHash.length === 0) {
      throw new Error('Invalid Telegram API Hash')
    }
  }

  async initialize(): Promise<void> {
    try {
      if (this.client.connected) {
        logger.log('Telegram client already connected')
        this.isInitialized = true
        return
      }

      await this.client.start({
        phoneNumber: async () => this.config.phoneNumber || '',
        password: async () => this.config.password || '',
        phoneCode: async () => {
          return await this.authManager.waitForCode()
        },
        onError: (err: any) => {
          logger.error('Telegram auth error:', err)
          throw new TelegramAuthError(`Authentication failed: ${err.message || err}`)
        },
      })

      const newSessionString = this.session.save()
      if (newSessionString && newSessionString !== this.config.sessionString) {
        logger.success(
          `New session created. Add to your .env: TELEGRAM_SESSION_STRING=${newSessionString}`,
        )
      }

      this.isInitialized = true
      logger.success('Telegram client connected successfully')
    } catch (error) {
      this.isInitialized = false

      if (error instanceof TelegramAuthError) {
        throw error
      }

      logger.error('Failed to initialize Telegram client:', error)
      throw new TelegramConnectionError('Failed to connect to Telegram', error as Error)
    }
  }

  async getChannelMessages(
    channelUsername: string,
    limit: number = 10,
  ): Promise<TelegramMessage[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      this.scheduleAutoDisconnect()

      const messages = await this.client.getMessages(channelUsername, {
        limit: Math.min(limit, 100), // Limit to prevent excessive requests
      })

      return messages
        .filter((msg: any) => this.isValidMessage(msg))
        .map((msg: any) => this.mapToTelegramMessage(msg, channelUsername))
    } catch (error) {
      logger.error(`Error fetching messages from ${channelUsername}:`, error)
      throw new TelegramError(`Failed to fetch messages from ${channelUsername}`, error as Error)
    }
  }

  private isValidMessage(msg: any): boolean {
    return (
      msg &&
      msg.message &&
      typeof msg.message === 'string' &&
      msg.message.trim().length > 0 &&
      msg.date &&
      msg.id
    )
  }

  private mapToTelegramMessage(msg: any, channelUsername: string): TelegramMessage {
    return {
      id: msg.id,
      message: msg.message.trim(),
      date: msg.date,
      channelId: msg.peerId?.toString() || '',
      fromId: msg.fromId?.toString(),
      channel: channelUsername,
    }
  }

  private scheduleAutoDisconnect(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
    }

    this.connectionTimeout = setTimeout(async () => {
      try {
        await this.disconnect()
        logger.log('Auto-disconnected from Telegram due to inactivity')
      } catch (error) {
        logger.warn('Error during auto-disconnect:', error)
      }
    }, 120000) // 2 minutes
  }

  async searchPromotions(options: PromotionSearchOptions): Promise<TelegramMessage[]> {
    const { channels, keywords = this.DEFAULT_KEYWORDS, limit = 20 } = options

    if (!this.isInitialized) {
      await this.initialize()
    }

    this.scheduleAutoDisconnect()

    const allPromotions: TelegramMessage[] = []

    for (const channel of channels) {
      try {
        const messages = await this.getChannelMessages(channel, limit)

        const promotions = messages.filter((msg) =>
          this.containsPromotionKeywords(msg.message, keywords),
        )

        allPromotions.push(...promotions)
      } catch (error) {
        logger.error(`Error searching promotions in ${channel}:`, error)
      }
    }

    // Sort by date (newest first) and remove duplicates
    return this.removeDuplicatePromotions(allPromotions.sort((a, b) => b.date - a.date))
  }

  private containsPromotionKeywords(message: string, keywords: string[]): boolean {
    const lowerMessage = message.toLowerCase()
    return keywords.some((keyword) => lowerMessage.includes(keyword.toLowerCase()))
  }

  private removeDuplicatePromotions(promotions: TelegramMessage[]): TelegramMessage[] {
    const seen = new Set<string>()
    return promotions.filter((promo) => {
      const key = `${promo.channel}_${promo.message.substring(0, 50)}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  getSessionString(): string {
    return this.session.save() as string
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.client.connected) {
        // Stop the update loop before disconnecting
        if (this.client._updateLoop) {
          this.client._updateLoop = false
        }

        await Promise.race([
          this.client.disconnect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Disconnect timeout')), 5000),
          ),
        ])

        logger.log('Telegram client disconnected')
      }
    } catch (error) {
      logger.warn('Error disconnecting Telegram client (forced):', error)
    } finally {
      // Clear the auto-disconnect timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout)
        this.connectionTimeout = null
      }

      this.client = null
      this.isInitialized = false
    }
  }
}
