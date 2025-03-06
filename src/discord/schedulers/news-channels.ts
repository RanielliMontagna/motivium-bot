import dayjs from 'dayjs'
import cron from 'node-cron'
import { Client } from 'discord.js'

import { logger } from '#settings'
import { sendMessage } from '#utils'
import { getRSSNews } from '#services'

dayjs.locale('pt-br')

const sentNews = new Set<string>()
const MAX_NEWS_HISTORY = 50 // Maximum number of news articles to keep in memory

/**
 * Initializes the scheduler for news channels
 * @param client Discord client
 */
export async function initializeNewsChannelsScheduler(client: Client) {
  const newsChannelsIds = process.env.NEWS_CHANNELS_IDS?.split(',')

  if (!newsChannelsIds?.length) {
    logger.warn('No news channels configured')
    return
  }

  newsChannelsIds.forEach((id) => {
    const channel = client.channels.cache.get(id)

    if (!channel) {
      logger.warn(`Channel with ID ${id} not found`)
      return
    }

    if (channel.isTextBased()) {
      cron.schedule('0 * * * *', async () => scheduleNewsMessage(client, id), {
        timezone: 'America/Sao_Paulo',
      })
    } else {
      logger.warn(`Channel with ID ${id} is not text-based`)
    }
  })
}

async function scheduleNewsMessage(client: Client, channelId: string): Promise<void> {
  const articles = await getRSSNews()

  if (!articles.length) {
    logger.warn('No news articles found')
    return
  }

  const newArticles = articles.filter((article) => {
    if (sentNews.has(article.url)) {
      logger.log(`News article already sent: ${article.url}`)
      return false
    }

    return true
  })

  if (newArticles.length === 0) {
    logger.warn('No new news articles available')
  }

  const article = newArticles[0]
  sentNews.add(article.url)

  if (sentNews.size > MAX_NEWS_HISTORY) {
    const firstKey = sentNews.values().next().value
    sentNews.delete(firstKey!)
  }

  const image = article.content.match(/<img[^>]+src="([^"]+)"/)?.[1].split('?')[0] ?? ''

  const sourceFormatted = `-# 🗞️ Font: [${article.source.name}](<${article.url}>)`
  const publishedAtDate = article.publishedAt.format('DD/MM/YYYY [at] HH:mm')
  const capitalizedDate = publishedAtDate.charAt(0).toUpperCase() + publishedAtDate.slice(1)
  const message = `${article.summary}\n\n${sourceFormatted} • ${capitalizedDate}`

  sendMessage({
    client,
    channelId,
    imageUrl: image,
    title: `📰 ${article.title}`,
    message,
  })
}
