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
})

type EnvSchema = z.infer<typeof envSchema>

export { envSchema, type EnvSchema }
