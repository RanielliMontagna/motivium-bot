import cron from 'node-cron'
import NodeCache from 'node-cache'
import { Client } from 'discord.js'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { getAINews, getEconomyNews, getSpaceNews, getTechNews, NewsArticle } from '#services'

// Cache with a TTL of 24h and a check period of 1h
const newsCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 })

/**
 * Initializes the scheduler for news channels.
 * @param client Discord client
 */
export async function initializeNewsChannelsScheduler(client: Client) {
  const categories = [
    { env: 'AI_NEWS_CHANNELS_IDS', fetchNews: getAINews, name: 'AI' },
    { env: 'TECH_NEWS_CHANNELS_IDS', fetchNews: getTechNews, name: 'Tech' },
    { env: 'SPACE_NEWS_CHANNELS_IDS', fetchNews: getSpaceNews, name: 'Space' },
    { env: 'ECONOMY_NEWS_CHANNELS_IDS', fetchNews: getEconomyNews, name: 'Economy' },
  ]

  categories.forEach(({ env, fetchNews, name }) => {
    const channelIds = process.env[env]?.split(',')
    if (!channelIds?.length) {
      logger.warn(`No ${name} channels configured`)
      return
    }
    scheduleNewsChannels(client, channelIds, fetchNews)
  })
}

/**
 * @description Schedule news messages for the given channels.
 */
function scheduleNewsChannels(
  client: Client,
  channelIds: string[],
  getNewsFunction: () => Promise<NewsArticle[]>,
) {
  channelIds.forEach((channelId) => {
    const channel = client.channels.cache.get(channelId)

    if (!channel || !channel.isTextBased()) {
      logger.warn(`Channel with ID ${channelId} not found or not text-based`)
      return
    }

    cron.schedule('0 * * * *', () => scheduleNewsMessage(client, channelId, getNewsFunction), {
      timezone: 'America/Sao_Paulo',
    })
  })
}

/**
 * Get and send a news article to the channel, ensuring it is not repeated.
 */
async function scheduleNewsMessage(
  client: Client,
  channelId: string,
  getNewsFunction: () => Promise<NewsArticle[]>,
) {
  try {
    const articles = await getNewsFunction()
    if (!articles.length) {
      logger.warn('No news articles found')
      return
    }

    const newArticles = articles.filter((article) => !newsCache.has(article.url))
    if (newArticles.length === 0) {
      logger.warn('No new news articles available')
      return
    }

    const article = newArticles[0]
    newsCache.set(article.url, true)

    const image = article.content.match(/<img[^>]+src="([^"]+)"/)?.[1].split('?')[0] ?? ''

    const sourceFormatted = `-# 🗞️ Fonte: [${article.source.name}](<${article.url}>)`
    const publishedAtDate = article.publishedAt.format('DD/MM/YYYY [às] HH:mm')
    const message = `${article.summary}\n\n${sourceFormatted} • ${publishedAtDate}`

    sendMessage({
      client,
      channelId,
      imageUrl: image,
      title: `📰 ${article.title}`,
      message,
    })
  } catch (error) {
    logger.error(`Error sending news message to channel ${channelId}:`, error)
  }
}
