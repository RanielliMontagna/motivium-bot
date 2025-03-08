import he from 'he'
import cron from 'node-cron'
import NodeCache from 'node-cache'
import { Client } from 'discord.js'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { getAINews, getEconomyNews, getSpaceNews, getTechNews } from '#services'

import { NewsCategory, ScheduleNewsChannels, ScheduleNewsMessage } from './news-channels.types.js'

// Set cache expiration time to 24 hours, with a check period of 1 hour
const newsCaches = {
  AI: new NodeCache({ stdTTL: 86400, checkperiod: 3600 }),
  Tech: new NodeCache({ stdTTL: 86400, checkperiod: 3600 }),
  Space: new NodeCache({ stdTTL: 86400, checkperiod: 3600 }),
  Economy: new NodeCache({ stdTTL: 86400, checkperiod: 3600 }),
}

/**
 * Initializes the scheduler for news channels.
 * @param client Discord client
 */
export async function initializeNewsChannelsScheduler(client: Client) {
  const categories = [
    { env: 'AI_NEWS_CHANNELS_IDS', fetchNews: getAINews, name: NewsCategory.AI },
    { env: 'TECH_NEWS_CHANNELS_IDS', fetchNews: getTechNews, name: NewsCategory.Tech },
    { env: 'SPACE_NEWS_CHANNELS_IDS', fetchNews: getSpaceNews, name: NewsCategory.Space },
    { env: 'ECONOMY_NEWS_CHANNELS_IDS', fetchNews: getEconomyNews, name: NewsCategory.Economy },
  ]

  categories.forEach(({ env, fetchNews, name }) => {
    const channelIds = process.env[env]?.split(',')

    if (!channelIds?.length) {
      logger.warn(`No ${name} channels configured`)
      return
    }

    scheduleNewsChannels({
      client,
      channelIds,
      category: name,
      getNewsFunction: fetchNews,
    })
  })
}

function scheduleNewsChannels({
  client,
  category,
  channelIds,
  getNewsFunction,
}: ScheduleNewsChannels) {
  channelIds.forEach((channelId) => {
    const channel = client.channels.cache.get(channelId)

    if (!channel || !channel.isTextBased()) {
      logger.warn(`Channel with ID ${channelId} not found or not text-based`)
      return
    }

    scheduleNewsMessage({ client, category, channelId, getNewsFunction })

    cron.schedule(
      '0 * * * *', // Send news every hour
      () => scheduleNewsMessage({ client, category, channelId, getNewsFunction }),
      { timezone: 'America/Sao_Paulo' },
    )
  })
}

async function scheduleNewsMessage({
  client,
  category,
  channelId,
  getNewsFunction,
}: ScheduleNewsMessage) {
  try {
    const articles = await getNewsFunction()

    if (!articles.length) {
      logger.warn('No news articles found')
      return
    }

    const newArticles = articles.filter(
      (article) => !newsCaches[category as NewsCategory].has(article.url),
    )

    if (newArticles.length === 0) {
      logger.warn('No new news articles available')
      return
    }

    const article = newArticles[0]
    newsCaches[category as NewsCategory].set(article.url, true)

    const image = article.content.match(/<img[^>]+src="([^"]+)"/)?.[1].split('?')[0] ?? ''

    const sourceFormatted = `-# 🗞️ Fonte: [${article.source.name}](<${article.url}>)`
    const publishedAtDate = article.publishedAt.format('DD/MM/YYYY [às] HH:mm')

    const rawSummary = article.summary
    const cleanSummary = he.decode(rawSummary)

    const message = `${cleanSummary}\n\n${sourceFormatted} • ${publishedAtDate}`

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
