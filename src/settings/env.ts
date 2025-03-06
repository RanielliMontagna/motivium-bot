import { z } from 'zod'

const envSchema = z.object({
  BOT_TOKEN: z.string({ description: 'Discord Bot Token is required' }).min(1),
  WEBHOOK_LOGS_URL: z.string().url().optional(),
  MAIN_GUILD_ID: z.string().optional(),
  CURRENCY_CHANNELS_IDS: z.string().optional(),
  NEWS_CHANNELS_IDS: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_CHANNELS_IDS: z.string().optional(),
  AI_NEWS_CHANNELS_IDS: z.string().optional(),
  TECH_NEWS_CHANNELS_IDS: z.string().optional(),
  SPACE_NEWS_CHANNELS_IDS: z.string().optional(),
  ECONOMY_NEWS_CHANNELS_IDS: z.string().optional(),
  // Env vars...
})

type EnvSchema = z.infer<typeof envSchema>

export { envSchema, type EnvSchema }
