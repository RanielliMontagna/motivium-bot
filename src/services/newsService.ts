import dayjs, { Dayjs } from 'dayjs'
import Parser from 'rss-parser'

export interface NewsArticle {
  title: string
  summary: string
  contentSnippet: string
  content: string
  url: string
  publishedAt: Dayjs
  source: { name: string }
}

interface RSSFeed {
  url: string
  name: string
}

const parser = new Parser()

async function getRSSNews(feed: RSSFeed): Promise<NewsArticle[]> {
  try {
    const articles: NewsArticle[] = []
    const feedContent = await parser.parseURL(feed.url)

    for (const item of feedContent.items) {
      articles.push({
        title: item.title || '',
        contentSnippet: item.contentSnippet || '',
        content: item.content || '',
        summary: item.summary || '',
        url: item.link || '',
        publishedAt: item.pubDate ? dayjs(item.pubDate) : dayjs(),
        source: { name: feed.name },
      })
    }

    return articles.sort((a, b) => b.publishedAt.diff(a.publishedAt))
  } catch (error) {
    console.error(`Error fetching RSS news from ${feed.name}:`, error)
    return []
  }
}

const theVergeURLBase = 'https://www.theverge.com/rss'
const investingURLBase = 'https://br.investing.com/rss'

async function getTechNews(): Promise<NewsArticle[]> {
  const techFeeds = [{ url: `${theVergeURLBase}/tech/index.xml`, name: 'The Verge - Tech' }]
  const techNews = await Promise.all(techFeeds.map((feed) => getRSSNews(feed)))

  return techNews.flat()
}

async function getAINews(): Promise<NewsArticle[]> {
  const aiFeeds = [
    { url: `${theVergeURLBase}/ai-artificial-intelligence/index.xml`, name: 'The Verge - AI' },
  ]
  const aiNews = await Promise.all(aiFeeds.map((feed) => getRSSNews(feed)))

  return aiNews.flat()
}

async function getSpaceNews(): Promise<NewsArticle[]> {
  const spaceFeeds = [{ url: `${theVergeURLBase}/space/index.xml`, name: 'The Verge - Space' }]
  const spaceNews = await Promise.all(spaceFeeds.map((feed) => getRSSNews(feed)))

  return spaceNews.flat()
}

async function getEconomyNews(): Promise<NewsArticle[]> {
  const economyFeeds = [
    { url: `${investingURLBase}/news_301.rss`, name: 'Investing.com - Cryptocurrency' },
    { url: `${investingURLBase}/news_14.rss`, name: 'Investing.com - Economy' },
    { url: `${investingURLBase}/news_1.rss`, name: 'Investing.com - Currency Exchange' },
  ]
  const economyNews = await Promise.all(economyFeeds.map((feed) => getRSSNews(feed)))

  return economyNews.flat()
}

export { getRSSNews, getTechNews, getAINews, getSpaceNews, getEconomyNews }
