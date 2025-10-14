import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/StringSession.js'

import { logger } from '#settings'
import type {
  TelegramMessage,
  TelegramServiceConfig,
  PromotionSearchOptions,
  TelegramMediaInfo,
  IMessageClassifier,
  IPromotionSearchService,
} from './telegramService.types.js'
import { SmartMessageClassifier } from './messageClassifier.js'

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

export class TelegramService implements IPromotionSearchService {
  private static instance: TelegramService | null = null
  private static instanceConfig: string = ''

  private client: any
  private session: any
  private config: TelegramServiceConfig
  private isInitialized: boolean = false
  private initializationPromise: Promise<void> | null = null
  private authManager = TelegramAuthManager.getInstance()
  private connectionTimeout: NodeJS.Timeout | null = null
  private messageClassifier: IMessageClassifier

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

  private constructor(config: TelegramServiceConfig, classifier?: IMessageClassifier) {
    this.validateConfig(config)
    this.config = config
    this.messageClassifier = classifier || new SmartMessageClassifier()

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
      requestRetries: 3,
      timeout: 60000,
      useWSS: false,
      floodSleepThreshold: 120,
      autoReconnect: false,
      retryDelay: 1000,
    })
  }

  static getInstance(
    config?: TelegramServiceConfig,
    classifier?: IMessageClassifier,
  ): TelegramService {
    const configKey = config ? `${config.apiId}-${config.apiHash}-${config.sessionString}` : ''

    // If no instance exists or config changed, create new one
    if (!TelegramService.instance || (config && TelegramService.instanceConfig !== configKey)) {
      if (TelegramService.instance) {
        // Disconnect previous instance
        TelegramService.instance
          .disconnect()
          .catch((err) => logger.warn('Error disconnecting previous instance:', err))
      }

      if (!config) {
        throw new Error('Config is required for first getInstance call')
      }

      TelegramService.instance = new TelegramService(config, classifier)
      TelegramService.instanceConfig = configKey
    }

    return TelegramService.instance
  }

  static resetInstance(): void {
    if (TelegramService.instance) {
      TelegramService.instance
        .disconnect()
        .catch((err) => logger.warn('Error disconnecting during reset:', err))
      TelegramService.instance = null
      TelegramService.instanceConfig = ''
    }
  }

  static async forceNewAuth(
    config: TelegramServiceConfig,
    classifier?: IMessageClassifier,
  ): Promise<TelegramService> {
    // Completely reset the instance
    TelegramService.resetInstance()

    logger.log('🔄 Starting new Telegram authentication with clean session...')

    // Wait a bit to ensure previous connections were closed
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Create new instance with clean session and optimized settings
    const cleanConfig = {
      ...config,
      sessionString: '', // Force empty session
    }

    const instance = new TelegramService(cleanConfig, classifier)

    TelegramService.instance = instance
    TelegramService.instanceConfig = `${cleanConfig.apiId}-${cleanConfig.apiHash}-`

    logger.log('✓ New Telegram instance created - ready for authentication')
    return instance
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
    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // If already initialized and connected, do nothing
    if (this.isInitialized && this.client?.connected) {
      return
    }

    // If initialized but not connected, force reinitialization
    if (this.isInitialized && this.client && !this.client.connected) {
      logger.warn('Client was initialized but not connected, forcing reinitialization')
      this.isInitialized = false
    }

    this.initializationPromise = this._performInitialization()

    try {
      await this.initializationPromise
    } catch (error) {
      // In case of error, clear state to allow new attempts
      this.isInitialized = false
      throw error
    } finally {
      this.initializationPromise = null
    }
  }

  private async _performInitialization(): Promise<void> {
    try {
      logger.log('🔗 Starting Telegram connection...')

      // If already connected, no need to do anything
      if (this.client?.connected) {
        this.isInitialized = true
        logger.log('✓ Client was already connected')
        return
      }

      // If client exists but not connected, or doesn't exist, create/recreate
      if (!this.client || (this.client && !this.client.connected)) {
        try {
          if (this.client) {
            logger.log('🔄 Destroying previous client...')
            await this.client.destroy()
          }
        } catch (error) {
          logger.warn('Error destroying old client:', error)
        }

        // Always recreate client with new instance
        logger.log('🔨 Creating Telegram client...')
        this.client = new TelegramClient(this.session, this.config.apiId, this.config.apiHash, {
          connectionRetries: 3,
          requestRetries: 3,
          timeout: 60000,
          useWSS: false,
          floodSleepThreshold: 120,
          autoReconnect: false,
          retryDelay: 1000,
        })
      }

      logger.log('📱 Starting authentication process...')

      await this.client.start({
        phoneNumber: async () => {
          const phone = this.config.phoneNumber || ''
          logger.log(`📞 Using number: ${phone}`)
          return phone
        },
        password: async () => {
          const password = this.config.password || ''
          if (password) {
            logger.log('🔐 2FA password configured')
          }
          return password
        },
        phoneCode: async () => {
          logger.log('📨 Waiting for SMS code...')
          return await this.authManager.waitForCode()
        },
        onError: (err: any) => {
          logger.error('❌ Telegram auth error:', err)
          throw new TelegramAuthError(`Authentication failed: ${err.message || err}`)
        },
      })

      if (this.client.connected) {
        this.isInitialized = true
        logger.success('✓ Telegram client connected successfully')

        // Save session after successful connection
        const sessionString = this.session.save()
        if (sessionString && sessionString.length > 0) {
          logger.log('Session saved successfully')
        }
      } else {
        this.isInitialized = false
        throw new TelegramConnectionError('Failed to establish connection')
      }
    } catch (error: any) {
      this.isInitialized = false
      logger.error('Failed to initialize Telegram client:', error)

      // If it's a duplicate key error, reset instance to force recreation
      if (error.message && error.message.includes('AUTH_KEY_DUPLICATED')) {
        logger.warn('AUTH_KEY_DUPLICATED detected, resetting instance...')
        TelegramService.resetInstance()
      }

      throw new TelegramConnectionError(`Initialization failed: ${error.message || error}`)
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
    // Allow messages with media even if text is empty
    const hasText = msg.message && typeof msg.message === 'string' && msg.message.trim().length > 0
    const hasMedia = msg.media

    return msg && (hasText || hasMedia) && msg.date && msg.id
  }

  private mapToTelegramMessage(msg: any, channelUsername: string): TelegramMessage {
    return {
      id: msg.id,
      message: msg.message?.trim() || '',
      date: msg.date,
      channelId: msg.peerId?.toString() || '',
      fromId: msg.fromId?.toString(),
      channel: channelUsername,
      media: this.extractMediaInfo(msg),
      originalMessage: msg, // Store for media download
    }
  }

  private extractMediaInfo(msg: any): TelegramMediaInfo | undefined {
    if (!msg.media) return undefined

    try {
      const media = msg.media

      // Handle photos
      if (media.className === 'MessageMediaPhoto' && media.photo) {
        const photoId = this.extractIntegerId(media.photo.id)
        const mediaInfo = {
          type: 'photo' as const,
          fileId: photoId,
          size: this.getPhotoSize(media.photo),
        }

        return mediaInfo
      }

      // Handle documents (includes videos, GIFs, files)
      if (media.className === 'MessageMediaDocument' && media.document) {
        const doc = media.document
        const mimeType = doc.mimeType || ''

        let type: 'document' | 'video' | 'sticker' = 'document'
        if (mimeType.startsWith('video/')) type = 'video'
        if (
          mimeType.startsWith('image/') &&
          doc.attributes?.some((attr: any) => attr.className === 'DocumentAttributeSticker')
        ) {
          type = 'sticker'
        }

        return {
          type,
          fileId: this.extractIntegerId(doc.id),
          fileName: this.getDocumentFileName(doc),
          mimeType: doc.mimeType,
          size: doc.size,
        }
      }

      return undefined
    } catch (error) {
      logger.warn('Error extracting media info:', error)
      return undefined
    }
  }

  private getPhotoSize(photo: any): number | undefined {
    try {
      if (photo.sizes && Array.isArray(photo.sizes)) {
        // Get the largest size
        const largestSize = photo.sizes.reduce((prev: any, current: any) => {
          const prevSize = (prev.w || 0) * (prev.h || 0)
          const currentSize = (current.w || 0) * (current.h || 0)
          return currentSize > prevSize ? current : prev
        })
        return largestSize.size
      }
    } catch (error) {
      logger.warn('Error getting photo size:', error)
    }
    return undefined
  }

  private getDocumentFileName(doc: any): string | undefined {
    try {
      if (doc.attributes && Array.isArray(doc.attributes)) {
        const fileNameAttr = doc.attributes.find(
          (attr: any) => attr.className === 'DocumentAttributeFilename',
        )
        if (fileNameAttr && fileNameAttr.fileName) {
          return fileNameAttr.fileName
        }
      }
    } catch (error) {
      logger.warn('Error getting document filename:', error)
    }
    return undefined
  }

  private extractIntegerId(id: any): string | undefined {
    try {
      if (!id) return undefined

      // Handle BigInt Integer objects from Telegram
      if (id.value !== undefined) {
        return id.value.toString()
      }

      // Handle regular numbers/strings
      if (typeof id === 'number' || typeof id === 'string') {
        return id.toString()
      }

      // Handle BigInt directly
      if (typeof id === 'bigint') {
        return id.toString()
      }

      return id.toString()
    } catch (error) {
      logger.warn('Error extracting integer ID:', error)
      return undefined
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
    const {
      channels,
      keywords = this.DEFAULT_KEYWORDS,
      limit = 20,
      maxAgeMinutes = 5,
      smartConfig,
    } = options

    if (!this.isInitialized) {
      await this.initialize()
    }

    this.scheduleAutoDisconnect()

    const allPromotions: TelegramMessage[] = []

    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i]
      try {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500)) // 500ms delay
        }

        const messages = await this.getChannelMessages(channel, limit)

        const candidatePromotions = messages.filter((msg) => {
          const text = msg.message || ''

          if (smartConfig) {
            const result = this.messageClassifier.classify(text, smartConfig)

            // If classifier explicitly excluded the message, block it regardless of fallback
            if (result.reason && result.reason.startsWith('Excluded by keyword')) {
              return false
            }

            // If classifier positively matched, accept immediately
            if (result.match) {
              return true
            }
          }

          const lowerMessage = text.toLowerCase()
          const hasKeywords = keywords.some((keyword) =>
            lowerMessage.includes(keyword.toLowerCase()),
          )
          const hasMedia = msg.media && this.hasPromotionInMedia(msg)
          return hasKeywords || hasMedia
        })

        const promotions = candidatePromotions.filter((msg) => {
          return this.isMessageRecent(msg.date, maxAgeMinutes)
        })

        // Log only if significant number of promotions were filtered
        const filteredCount = candidatePromotions.length - promotions.length
        if (filteredCount > 5) {
          logger.log(
            `Filtered ${filteredCount} old promotions from ${channel} (older than ${maxAgeMinutes} minutes)`,
          )
        }

        allPromotions.push(...promotions)
      } catch (error) {
        logger.error(`Error searching promotions in ${channel}:`, error)
      }
    }

    // Sort by date (newest first) and remove duplicates
    return this.removeDuplicatePromotions(allPromotions.sort((a, b) => b.date - a.date))
  }

  private hasPromotionInMedia(msg: any): boolean {
    // Check if message has media that could be promotional
    if (!msg.media) return false

    const media = msg.media

    // Photos are often used for product promotions
    if (media.className === 'MessageMediaPhoto') return true

    // Videos could be product demos or promotional content
    if (media.className === 'MessageMediaDocument' && media.document) {
      const mimeType = media.document.mimeType || ''
      return mimeType.startsWith('video/') || mimeType.startsWith('image/')
    }

    return false
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

  /**
   * Check if message is recent (within specified minutes)
   */
  private isMessageRecent(messageDate: number, maxMinutes: number): boolean {
    const now = Math.floor(Date.now() / 1000) // Current timestamp in seconds
    const messageAge = now - messageDate // Age in seconds
    const maxAgeSeconds = maxMinutes * 60 // Convert minutes to seconds

    const isRecent = messageAge <= maxAgeSeconds

    return isRecent
  }

  getSessionString(): string {
    return this.session.save() as string
  }

  /**
   * Download media from Telegram and return as buffer
   */
  async downloadMedia(message: any): Promise<Buffer | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      this.scheduleAutoDisconnect()

      if (!message.media) {
        logger.warn('No media found in message')
        return null
      }

      // Download the media
      const buffer = await this.client.downloadMedia(message, {
        workers: 1,
        progressCallback: undefined,
      })

      if (buffer instanceof Buffer) {
        logger.log(`Downloaded media: ${buffer.length} bytes`)
        return buffer
      }

      return null
    } catch (error) {
      logger.error('Error downloading media:', error)
      return null
    }
  }

  /**
   * Download media and prepare for Discord attachment
   */
  async downloadMediaForDiscord(msg: any): Promise<{ buffer: Buffer; filename: string } | null> {
    try {
      const buffer = await this.downloadMedia(msg)
      if (!buffer) return null

      // Determine file extension based on media type
      let extension = 'jpg' // default
      let filename = `telegram_media_${msg.id}`

      if (msg.media?.className === 'MessageMediaPhoto') {
        extension = 'jpg'
        filename = `photo_${msg.id}.jpg`
      } else if (msg.media?.className === 'MessageMediaDocument' && msg.media.document) {
        const mimeType = msg.media.document.mimeType || ''
        if (mimeType.startsWith('image/')) {
          extension = mimeType.split('/')[1] || 'jpg'
        } else if (mimeType.startsWith('video/')) {
          extension = mimeType.split('/')[1] || 'mp4'
        }

        // Use original filename if available
        const originalName = this.getDocumentFileName(msg.media.document)
        if (originalName) {
          filename = originalName
        } else {
          filename = `document_${msg.id}.${extension}`
        }
      }

      return { buffer, filename }
    } catch (error) {
      logger.error('Error downloading media for Discord:', error)
      return null
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        // Stop the update loop before disconnecting
        if (this.client._updateLoop) {
          this.client._updateLoop = false
        }

        // Try to disconnect gracefully first
        if (this.client.connected) {
          await Promise.race([
            this.client.disconnect(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Disconnect timeout')), 5000),
            ),
          ])
        }

        // Completely destroy client to free resources
        try {
          await this.client.destroy()
          logger.log('Telegram client disconnected and destroyed')
        } catch (destroyError) {
          logger.warn('Error destroying client:', destroyError)
        }
      }
    } catch (error) {
      logger.warn('Error disconnecting Telegram client (forced):', error)
    } finally {
      // Clear the auto-disconnect timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout)
        this.connectionTimeout = null
      }

      // Don't set client as null to avoid "cannot read properties of null" errors
      this.isInitialized = false
      this.initializationPromise = null // Clear initialization promise
    }
  }
}
