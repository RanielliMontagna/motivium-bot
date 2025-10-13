import { z } from 'zod'

const envSchema = z.object({
  BOT_TOKEN: z.string({ description: 'Discord Bot Token is required' }).min(1),
  DATABASE_URL: z.string({ description: 'Database URL is required' }).min(1),
  MAIN_GUILD_ID: z.string().optional(),
  WEBHOOK_LOGS_URL: z.string().url().optional(),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),

  // Currency envs
  COIN_GECKO_API_KEY: z.string().optional(),
  CURRENCY_BTC_CHANNEL_IDS: z.string().optional(),
  CURRENCY_DOLLAR_EXCHANGE_CHANNEL_IDS: z.string().optional(),

  // AI envs
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_CHANNELS_IDS: z.string().optional(),

  // News envs
  NEWS_CHANNELS_IDS: z.string().optional(),
  AI_NEWS_CHANNELS_IDS: z.string().optional(),
  TECH_NEWS_CHANNELS_IDS: z.string().optional(),
  SPACE_NEWS_CHANNELS_IDS: z.string().optional(),
  BRAZIL_NEWS_CHANNELS_IDS: z.string().optional(),
  ECONOMY_NEWS_CHANNELS_IDS: z.string().optional(),

  // Weather
  WEATHER_API_KEY: z.string().optional(),

  // Telegram Configuration
  PROMOTIONS_ENABLED: z.string().optional().default('true'),

  TELEGRAM_API_ID: z.string().optional(),
  TELEGRAM_API_HASH: z.string().optional(),
  TELEGRAM_PHONE_NUMBER: z.string().optional(),
  TELEGRAM_PASSWORD: z.string().optional(),
  TELEGRAM_SESSION_STRING: z.string().optional(),

  // Promotions Channels - General
  PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  TELEGRAM_PROMOTIONS_CHANNELS: z.string().optional(),
  TECH_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  TECH_TELEGRAM_CHANNELS: z.string().optional(),
  GAMING_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  GAMING_TELEGRAM_CHANNELS: z.string().optional(),
  FITNESS_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  FITNESS_TELEGRAM_CHANNELS: z.string().optional(),
  AUTOMOTIVE_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  AUTOMOTIVE_TELEGRAM_CHANNELS: z.string().optional(),
  FASHION_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  FASHION_TELEGRAM_CHANNELS: z.string().optional(),
  HOME_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  HOME_TELEGRAM_CHANNELS: z.string().optional(),
  BUGS_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  BUGS_TELEGRAM_CHANNELS: z.string().optional(),
  ALIEXPRESS_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  ALIEXPRESS_TELEGRAM_CHANNELS: z.string().optional(),
  CUPONS_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  CUPONS_TELEGRAM_CHANNELS: z.string().optional(),
  BEAUTY_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  BEAUTY_TELEGRAM_CHANNELS: z.string().optional(),
  FOOD_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  FOOD_TELEGRAM_CHANNELS: z.string().optional(),
  HARDWARE_PROMOTIONS_CHANNELS_IDS: z.string().optional(),
  HARDWARE_TELEGRAM_CHANNELS: z.string().optional(),
})

type EnvSchema = z.infer<typeof envSchema>

export { envSchema, type EnvSchema }
