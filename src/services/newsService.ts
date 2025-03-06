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

const theVergeURLBase = 'https://www.theverge.com/rss'

const techFeed: RSSFeed = {
  url: `${theVergeURLBase}/tech/index.xml`,
  name: 'The Verge - Tech',
}

const aiFeed: RSSFeed = {
  url: `${theVergeURLBase}/ai-artificial-intelligence/index.xml`,
  name: 'The Verge - AI',
}

async function getTechNews(): Promise<NewsArticle[]> {
  return getRSSNews(techFeed)
}

async function getAINews(): Promise<NewsArticle[]> {
  return getRSSNews(aiFeed)
}

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

export { getRSSNews, getTechNews, getAINews }
